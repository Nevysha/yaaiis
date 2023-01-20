const path = require("path");
const fs = require('fs').promises;
const { createHash } = require('crypto');
const png = require('png-metadata');
const {yaaiisDatabase} = require('./yaaiisDatabase');
const {Op, Sequelize} = require("sequelize");
const chokidar = require('chokidar');

let images = {}; //TODO create class to handle all file, manage duplicate etc
let errors = [];

function _parse(fullPath, hash) {
    const s = png.readFileSync(fullPath);
    const list = png.splitChunk(s);

    let parsedStrRaw;
    for (let chunk of list) {
        if (chunk.type === 'tEXt') {
            parsedStrRaw = chunk;
            break;
        }
    }

    if (!parsedStrRaw || !parsedStrRaw.data) {
        throw new Error(`cannot parse ${hash}, adding stub metadata`);
    }

    let parsedSplit = parsedStrRaw.data.substring(10).split('Negative prompt:');
    const data = [];

    if (parsedSplit.length === 1) {
        //for easier parsing, adding empty string to the beginning so all case are treated the same way
        parsedSplit.push("");
    }

    data.push(sanitizeKeyVal('prompt', parsedSplit[0]));

    //manage case where there is no negative prompt
    if (parsedSplit[1].indexOf('\n') < 0) {
        parsedSplit[1] = `\n${parsedSplit[1]}`;
    }

    //first item in array will be bad prompt, rest will be others gen params
    let remainingRawChunks = (parsedSplit[1]).split('\n');

    data.push(sanitizeKeyVal('negative prompt', remainingRawChunks[0]));

    remainingRawChunks = (remainingRawChunks[1]).split(',');

    for (let chunk of remainingRawChunks) {
        const keyVal = chunk.split(":");
        if (keyVal[0].indexOf("Size") >= 0) {
            let size = keyVal[1].split("x");
            data.push(sanitizeKeyVal("width", size[0]));
            data.push(sanitizeKeyVal("height", size[1]));
        }
        data.push(sanitizeKeyVal(keyVal[0], keyVal[1]));
    }

    return data;
}
const sanitizeKeyVal = (key, val) => {
    val = val || '';
    return {
        key: key.toLowerCase().replace(/[^\x00-\x7F]/g, "").replace('\0', '').trim(),
        val:val.replace(/[^\x00-\x7F]/g, "").replace('\0', '').trim()
    }
}

const scrapFile = async (fullPath) => {
    if (!fullPath.endsWith('png'))  {
        console.log(`not a png`);
        return;
    }

    const buff = await fs.readFile(fullPath);
    const hash = createHash("sha256").update(buff).digest("hex");

    let isError = false;
    let parsed;
    try {
        parsed = _parse(fullPath, hash);
    } catch (e) {
        console.log(e);
        parsed = {key:"error", val:"no metadata"};
        isError = true;
    }

    const stats = await fs.stat(fullPath);

    const imgData = {
        generationMetadata:parsed,
        paths:[fullPath],
        hash:hash,
        stats:stats
    };

    if (isError) {
        errors.push(imgData);
        return;
    }

    if (!images[hash]) {
        images[hash] = imgData;
    }
    else {
        console.log(`found duplicate : ${hash}`);
        images[hash].paths.push(fullPath)
    }

    //up some of the metadata directly in the imgData
    const metaDataToReport = ['model', 'sampler', 'prompt'];
    for (let metadata of imgData.generationMetadata) {
        if (metaDataToReport.indexOf(metadata.key) >= 0) {
            imgData[metadata.key] = metadata.val;
        }
    }
    imgData.mtime = imgData.stats.mtime;
    imgData.ctime = imgData.stats.ctime;


    //insert into database
    const {Image} = await yaaiisDatabase.get();
    await Image.upsert(imgData);

    return imgData;
}

const scrap = async (folderPath) => {
    const files = await fs.readdir(folderPath);

    console.log(`loading ${files.length} files from path`);

    let i = 0;
    for (const file of files) {
        console.log(`file ${++i} of ${files.length} for folder : ${folderPath}`)
        const fullPath = path.join(folderPath, file);

        await scrapFile(fullPath);

    }
}

//TODO remove this and use database
function loadInMemory(_images) {
    //most recent first
    _images.sort((a, b) => {
        if (a.stats.mtime < b.stats.mtime) return 1;
        if (a.stats.mtime > b.stats.mtime) return -1;
        return 0;
    });

    images = {};
    for (let img of _images) {
        images[img.hash] = img;
    }
}

const foldersPath = require('./preferences').foldersPath;

const refresh = async () => {
    for (let folder of foldersPath) {
        await scrap(folder);
    }

    const imagesFlatten = Object.values(images);
    loadInMemory(imagesFlatten);

    console.log(`parsing error count : ${errors.length}`);

    return images;
}

let fSWatcher = null;
const init = async () => {
    const {Image} = await yaaiisDatabase.get();
    if ((await Image.count()) <= 0) {
        await refresh();
    }
    else {
        const _images = await Image.findAll();
        loadInMemory(_images);
    }

    if (fSWatcher) {
        fSWatcher.unwatch(foldersPath);
    }

    fSWatcher = chokidar
        .watch(
            foldersPath,
            {ignoreInitial: true}
        )
        .on('all', async (event, path) => {
            console.log(event, path);
            if (event === 'add') {
                const imgData = await scrapFile(path);
                if (imgData) {
                    socket.emit('newImage', imgData);
                }
            }
        });

}

const getImage = (hash) => {
    if (hash) return images[hash];
    return images;
}

const getFilterable = async (key) => {

    const where = {};
    where[key] = {[Op.not]:null};

    const {Image} = await yaaiisDatabase.get();
    const filterable = await Image.findAll({
        attributes: [
            [Sequelize.fn('DISTINCT', Sequelize.col(key)) ,key],
        ],
        where:where,
        order: [
            [key, 'ASC'],
        ]
    });
    return filterable.map(f => f.dataValues[key]);
}

const getPrompts = async () => {
    return await getFilterable('prompt');
};
const getSamplers = async () => {
    return await getFilterable('sampler');
};
const getModels = async () => {
    return await getFilterable('model');
};

let socket;
const setSocket = (_socket) => {
    socket = _socket;
}

module.exports = {init, refresh, getImage, getPrompts, getSamplers, getModels, setSocket}





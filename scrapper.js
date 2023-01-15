const path = require("path");
const fs = require('fs').promises;
const { createHash } = require('crypto');
const png = require('png-metadata');

let images = {}; //TODO create class to handle all file, manage duplicate etc
let model2img = {};
let prompt2img = {};
let sampler2img = {};
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
    return {
        key: key.replace(/[^\x00-\x7F]/g, "").replace('\0', '').trim(),
        val:val.replace(/[^\x00-\x7F]/g, "").replace('\0', '').trim()
    }
}

const scrap = async (folderPath) => {
    const files = await fs.readdir(folderPath);

    console.log(`loading ${files.length} files from path`);

    let i = 0;
    for (const file of files) {
        const fullPath = path.join(folderPath, file);

        if (!file.endsWith('png'))  {
            console.log(`${++i}/${files.length} not a png`);
            continue;
        }

        const buff = await fs.readFile(fullPath);
        const hash = createHash("sha256").update(buff).digest("hex");

        console.log(`${++i}/${files.length} hash:${hash}`);

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
            continue;
        }

        if (!images[hash]) {
            images[hash] = imgData;
        }
        else {
            console.log(`found duplicate : ${hash}`);
            images[hash].paths.push(fullPath)
        }

    }
}

function addToRepository(model2img, val, img) {
    if (!model2img[val]) {
        model2img[val] = [];
    }
    model2img[val].push(img);
}

const init = async () => {
    await scrap("D:\\stable-diffusion\\A1111 Web UI Autoinstaller\\stable-diffusion-webui\\outputs\\txt2img-images");
    await scrap("D:\\stable-diffusion\\A1111 Web UI Autoinstaller\\stable-diffusion-webui\\outputs\\img2img-images");
    await scrap("D:\\stable-diffusion\\A1111 Web UI Autoinstaller\\stable-diffusion-webui\\outputs\\saves");

    const imagesFlatten = Object.values(images);
    //most recent first
    imagesFlatten.sort((a,b) => {
        if(a.stats.mtime < b.stats.mtime) return 1;
        if(a.stats.mtime > b.stats.mtime) return -1;
        return 0;
    });

    images = {};
    model2img = {};
    prompt2img = {};
    sampler2img = {};
    for (let img of imagesFlatten) {
        images[img.hash] = img;

        for (let metadata of img.generationMetadata) {

            if (metadata.key === 'Model') {
                addToRepository(model2img, metadata.val, img);
            }

            else if (metadata.key === 'Sampler') {
                addToRepository(sampler2img, metadata.val, img);
            }

            else if (metadata.key === 'prompt') {
                let parsedPrompt = metadata.val.split(',');
                for (let prompt of parsedPrompt) {
                    addToRepository(prompt2img, prompt, img);
                }

            }
        }
    }

    console.log(`parsing error count : ${errors.length}`);

    return images;
}
init();

const getImage = (hash) => {
    if (hash) return images[hash];
    return images;
}
const getPrompt2Img = () => {
    return prompt2img
};
const getSampler2img = () => {
    return sampler2img
};
const getModel2img = () => {
    return model2img
};
module.exports = {init, getImage, getPrompt2Img, getSampler2img, getModel2img}





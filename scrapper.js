const path = require("path");
const fs = require('fs').promises;
const png = require('png-metadata');
const { createHash } = require('crypto');
const {XMLParser} = require("fast-xml-parser");
const escapeHtml = require('escape-html')
const exifr = require('exifr')

const parser = new XMLParser();

const _get = async (buf) => {
    const bin = buf.toString('binary');
    let list = png.splitChunk(bin);
    let itxt;
    for(let i=0; i<list.length; i++) {
        let item = list[i]
        if (item.type === "iTXt" && item.data.startsWith("XML:com.adobe.xmp")) {
            itxt = item
            itxt.index = i
            break;
        }
    }
    if (itxt) {
        let parsed = parser.parse(itxt.data)
        let gms = parsed["x:xmpmeta"]["rdf:RDF"]["rdf:Description"]["xmp:gm"]
        let subject = parsed["x:xmpmeta"]["rdf:RDF"]["rdf:Description"]["dc:subject"]


        let keys = [
            "xmp:prompt",
            "xmp:sampler",
            "xmp:steps",
            "xmp:cfg_scale",
            "xmp:seed",
            "xmp:negative_prompt",
            "xmp:model_name",
            "xmp:model_hash",
            "xmp:model_url",
            "xmp:agent",
            "xmp:width",
            "xmp:height",
        ]

        // xmp:prompt ~ xmp:agent
        let res = []
        if (gms) {
            for(let key of keys) {
                if (gms[key]) {
                    let val = escapeHtml(gms[key])
                    res.push({ key, val })
                } else {
                    res.push({ key, })
                }
            }
        }

        // xmp:width xmp:height => directly get it from the file
        let ex = await exifr.parse(buf, true)
        if (ex) {
            res.push({
                key: "xmp:width",
                val: parseInt(ex.ImageWidth)
            })
            res.push({
                key: "xmp:height",
                val: parseInt(ex.ImageHeight)
            })
        }

        // dc:subject
        if (subject) {
            let val = subject["rdf:Bag"]["rdf:li"]
            if (val) {
                val = (Array.isArray(val) ? val : [val])
                res.push({
                    key: "dc:subject",
                    val
                })
            } else {
                res.push({ key: "dc:subject" })
            }
        } else {
            res.push({ key: "dc:subject" })
        }
        return { chunk: itxt, parsed: res, list }
    }
    return { list }
}

let images = {}; //TODO create class to handle all file, manage duplicate etc

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

        let t = await _get(buff);

        if (!t.parsed) {
            console.log(`cannot parse ${hash}, ignoring`);
            continue;
        }

        console.log(`${++i}/${files.length} hash:${hash}`);

        const stats = await fs.stat(fullPath);

        if (!images[hash]) {
            images[hash] = {
                generationMetadata:t.parsed ?? [],
                paths:[fullPath],
                hash:hash,
                stats:stats
            };
        }
        else {
            console.log(`found duplicate : ${hash}`);
            images[hash].paths.push(fullPath)
        }

    }
}

const init = async () => {
    await scrap("D:\\stable-diffusion\\A1111 Web UI Autoinstaller\\stable-diffusion-webui\\outputs\\img2img-images");
    await scrap("D:\\stable-diffusion\\A1111 Web UI Autoinstaller\\stable-diffusion-webui\\outputs\\txt2img-images");
    await scrap("D:\\stable-diffusion\\A1111 Web UI Autoinstaller\\stable-diffusion-webui\\outputs\\saves");

    const imagesFlatten = Object.values(images);
    //most recent first
    imagesFlatten.sort((a,b) => {
        if(a.stats.mtime < b.stats.mtime) return 1;
        if(a.stats.mtime > b.stats.mtime) return -1;
        return 0;
    });

    images = {};
    for (let img of imagesFlatten) {
        images[img.hash] = img;
    }

    return images;
}
init();

const getImage = async (hash) => {
    if (hash) return images[hash];
    return images;

}

module.exports = {scrap, getImage}





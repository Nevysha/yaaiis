var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const {refresh, getImage, getPrompts, getSamplers, getModels, getTags, setSocket, setAutoTags} = require("./scrapper");
const cors = require("cors");

const {yaaiisDatabase} = require('./yaaiisDatabase');
const { Op } = require("sequelize");

var app = express();
app.use(cors());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

app.get('/refresh', async (req, res) => {
    await refresh();
    res.status(200).send();
})

app.get('/img/filter/:type', async (req, res) => {
    try {
        if (req.params.type === 'model') {
            res.status(200).send(await getModels());
        }
        else if (req.params.type === 'sampler') {
            res.status(200).send(await getSamplers());
        }
        else if (req.params.type === 'prompt') {
            res.status(200).send(await getPrompts());
        }
        else if (req.params.type === 'tag') {
            res.status(200).send(await getTags());
        }

    } catch (e) {
        res.status(500).send(e);
    }

});

app.get('/autotag/:value', async (req, res) => {
    console.log(`applyAutoTag:${req.params.value}`)
    if (req.params.value !== '') {
        setAutoTags(req.params.value.split(',').map(_tag => _tag.trim()));
    }
    else {
        setAutoTags([]);
    }
});

app.get('/img/data/all', async (req, res) => {
    try {
        let imgsData = getImage();
        res.send(imgsData);
    } catch (e) {
        res.status(500).send(e);
    }
});

app.post('/img/query', async (req, res) => {
    try {

        ///TODO clean this mess but it's 3AM and I work tomorrow ffs
        const model = req.body.model ? req.body.model : [];
        const sampler = req.body.sampler ? req.body.sampler : [];

        const prompt = req.body.prompt ? req.body.prompt : [];

        const tag = req.body.tag ? req.body.tag : [];

        const where = {[Op.and]:[]};
        if (model.length >= 1) where[Op.and].push({model:model});
        if (sampler.length >= 1) where[Op.and].push({sampler:sampler});
        if (tag.length > 0) {
            const {Tag, ImageTag} = await yaaiisDatabase.get();
            let _tags = (await Tag.findAll({
                where: [{
                    name:tag
                }]
            })).map(_modelTag => _modelTag.dataValues.uuid);

            let _img = (await ImageTag.findAll({
                where: [{
                    uuid:_tags
                }]
            })).map(_imgHash => _imgHash.dataValues.hash);

            if (_img && _img.length > 0) {
                where[Op.and].push({hash:_img});
            }
        }

        if (prompt.length >= 1) {
            let or = {[Op.or]:[]}

            for (let p of prompt) {
                or[Op.or].push({
                    prompt: {[Op.like]:`%${p}%`}
                });
            }
            where[Op.and].push(or);
        }

        const {Image} = await yaaiisDatabase.get();
        const images = await Image.findAll({
            where: where,
            order: [
                ['mtime', 'DESC'],
            ]
        });

        const map = images.reduce(function(map, obj) {
            map[obj.hash] = obj;
            return map;
        }, {});

        res.status(200).send(map);
    } catch (e) {
        console.error(e);
        res.status(500).send(e);
    }
});

app.get('/img/data/:hash', async (req, res) => {
    try {
        const imgData = await getImage(req.params.hash);
        res.status(200).send(imgData);
    } catch (e) {
        res.status(500).send(e);
    }

});
app.get('/img/:hash', async (req, res) => {
    try {
        const imgData = await getImage(req.params.hash);
        res.sendFile(imgData.paths[0]);
    } catch (e) {
        res.status(500).send(e);
    }
});

var http = require('http').Server(app);
var io = require('socket.io')(http);
io.on('connection', (socket) => {
    console.log('A connection is made');
    setSocket(socket);
})

http.listen(6968, () => {
    console.log('listening on localhost:6968');
});


module.exports = app;

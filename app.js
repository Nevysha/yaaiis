var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const {init, getImage, getPrompt2Img, getSampler2img, getModel2img} = require("./scrapper");
const cors = require("cors");

var app = express();
app.use(cors({
    origin: 'http://localhost:3000',
    optionsSuccessStatus: 200
}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

app.get('/refresh', (req, res) => {
    init();
    res.status(200).send();
})

app.get('/img/filter/:type', async (req, res) => {
    try {
        if (req.params.type === 'model') {
            res.status(200).send(Object.keys(getModel2img()));
        }
        else if (req.params.type === 'sampler') {
            res.status(200).send(Object.keys(getSampler2img()));
        }
        else if (req.params.type === 'prompt') {
            res.status(200).send(Object.keys(getPrompt2Img()));
        }

    } catch (e) {
        res.status(500).send(e);
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
app.get('/img/data/:hash', async (req, res) => {
    try {
        const imgData = getImage(req.params.hash);
        res.send(JSON.stringify(imgData));
    } catch (e) {
        res.status(500).send(e);
    }

});
app.get('/img/:hash', async (req, res) => {
    try {
        const imgData = getImage(req.params.hash);
        res.sendFile(imgData.paths[0]);
    } catch (e) {
        res.status(500).send(e);
    }
});


module.exports = app;

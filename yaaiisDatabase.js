const SQLite = require('sqlite3').verbose();
// import SQLite from 'sqlite3';

const { Sequelize, Model, DataTypes } = require('sequelize');

// 'sqlite:yaaiis-database.sqlite'
const sequelize = new Sequelize('database', 'username', 'password', {
    dialect: 'sqlite',
    storage: './yaaiis-database.sqlite',
    dialectOptions: {
        // Your sqlite3 options here
        // for instance, this is how you can configure the database opening mode:
        mode: SQLite.OPEN_READWRITE | SQLite.OPEN_CREATE | SQLite.OPEN_FULLMUTEX,
    },
});

const Image = sequelize.define('Image',
    {
        hash: {
            type:DataTypes.STRING,
            primaryKey: true
        },
        model: DataTypes.TEXT,
        modelHash: DataTypes.TEXT,
        sampler: DataTypes.TEXT,
        prompt: DataTypes.TEXT,
        generationMetadata: DataTypes.JSON,
        paths:  DataTypes.JSON,
        stats:  DataTypes.JSON,
    });

const models = {Image};


let _me;
const yaaiisDatabase = {

    get : async () => {
        if (_me) return _me;

        await Image.sync();

        _me = models;
        _me.get = this.get;
        return _me;
    }
}


module.exports = {yaaiisDatabase};
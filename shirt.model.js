'use strict';

var path = require('path');
var Sequelize = require('sequelize');
var config_ = require(path.join(__dirname, 'config.json'));
var config = config_.db;
var sequelize = new Sequelize(config.database, config.username, config.password, config);
var db = {};

db.shirt = sequelize.define('shirt', {
    id: { type: Sequelize.STRING, primaryKey: true, charset: 'utf8', collate: 'utf8_bin' },
    origin: Sequelize.TEXT,
    caption: Sequelize.TEXT,
    character: Sequelize.TEXT,
    filename: Sequelize.TEXT,
    published: { type: Sequelize.BOOLEAN, defaultValue: false }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
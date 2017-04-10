'use strict';

const path = require('path');
const db = require(path.join(__dirname, 'shirt.model'));
const Shirt = db.shirt;
const Sequelize = require('sequelize');
const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const P = require('bluebird');
const fs = P.promisifyAll(require('fs'));
const exec = P.promisify(require('child_process').exec);

const imgPath = path.join(__dirname, 'images');

exports = module.exports;

function generateId() {
    const length = 8;
    let result = '';
    for (let i = length; i > 0; --i) {
        result += chars[Math.round(Math.random() * (chars.length - 1))];
    }
    return result;
}

function checkExistingIds(shirtData) {
    return P.try(() => {
        const new_id = generateId();
        shirtData.id = new_id;
        return Shirt.findById(new_id)
        .then(result => {
            if (!result) {
                // id doesn't exist
                return shirtData;
            } else {
                // make another id
                return checkExistingIds(shirtData);
            }
        });
    });
}

function validateId(id) {
    return id.match(/^[0-9A-Za-z]+$/);
}

function createThumbnail(inFile, outFile) {
    return exec(`convert -thumbnail x72 ${inFile} ${outFile}`);
}

function internalErr(req, res) {
    return function() {
        if (res.headersSent) {
            return;
        }
        res.status(500).send();
    };
}

function allShirts(req, res, where) {
   Shirt.findAll({
        attributes:['id', 'origin', 'filename'],
        where: where
    })
    .then(result => {
        if (!result) {
            res.status(404).send();
        }
        const allshirts = {};
        result.forEach(shirt => {
            if (allshirts[shirt.origin] === undefined) {
                allshirts[shirt.origin] = [];
            }
            allshirts[shirt.origin].push(shirt);
        });
        res.status(200).send(allshirts);
    })
    .catch(internalErr(req, res)); 
}

exports.createShirt = function createShirt(req, res) {
    if ((req.file.mimetype !== 'image/jpeg' && req.file.mimetype !== 'image/png') ||
        !('origin' in req.body)) {
        res.status(400).send('Invalid file type. Must be JPG or PNG.');
        fs.unlink(req.file);
    }
    checkExistingIds(req.body)
    .then(shirt => {
        let fileExt = '.png';
        if (req.file.mimetype === 'image/jpeg') {
            fileExt = '.jpg';
        }
        const finalName = path.join(imgPath, shirt.id + fileExt);
        const finalThumb = path.join(imgPath, shirt.id + '_thumb.jpg');
        shirt.filename = shirt.id + fileExt;
        Shirt.create(shirt)
        .then(result => fs.rename(req.file.path, finalName))
        .then(() => createThumbnail(finalName, finalThumb))
        .then(() => {
            res.status(201).send();
        })
        .catch(internalErr(req, res));
    });       
};

exports.getShirtById = function getShirtById(req, res) {
    if (!validateId(req.params.id)) {
        res.status(400).send();
    }
    (function getShirt(id) {
        if (id !== 'random') {
            return Shirt.findById(id);
        } else {
            return Shirt.find({
                order: Sequelize.fn('RAND'),
                where: { published: true }
            });
        }
    })(req.params.id)
    .then(result => {
        if (!result) {
            res.status(404).send();
        } else {
            res.status(200).send(result);
        }
    })
    .catch(internalErr(req, res));
};

exports.getAllShirts = function getAllShirts(req, res) {
    return allShirts(req, res, {published: true});
};

exports.getUnpublished = function getUnpublished(req, res) {
    return allShirts(req, res, {published: false});
};

exports.publishShirt = function publishShirt(req, res) {
    if (!validateId(req.params.id)) {
        res.status(400).send();
    }
    const updateQ = { published: true };
    if (req.query && req.query.modify) {
        updateQ.origin = decodeURIComponent(req.query.modify);
    }
    Shirt.update(
        updateQ,
        { where: {id: req.params.id}}
    )
    .then(result => {
        res.status(200).send();
    })
    .catch(internalErr(req, res));
};

exports.deleteShirt = function deleteShirt(req, res) {
    if (!validateId(req.params.id)) {
        res.status(400).send();
    }
    let images = path.join(imgPath, req.params.id + '*');
    exec('rm -f ' + images);
    Shirt.destroy({
        where: {id: req.params.id}
    })
    .then(result => {
        res.status(200).send();
    })
    .catch(internalErr(req, res));
};

exports.initDb = function () {
    return db.sequelize.authenticate()
    .then(err => db.sequelize.sync())
    .catch(function (err) {
        console.log(err);
        process.exit();
    });
};
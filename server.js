#!/bin/env node
'use strict';

const express = require('express');
const path = require('path');
const pug = require('pug');
const fs = require('fs');
const shirts = require(path.join(__dirname, 'shirtsofanime'));
const bodyParser = require('body-parser');
const multer  = require('multer');
const config = require(path.join(__dirname, 'config.json'));
const basicAuth = require('basic-auth');
const minifier = require('minifier');
const argv = require('minimist')(process.argv.slice(2));

function copyScripts() {
    // minify JS
    const scripts = fs.readdirSync(path.join(appRoot, 'scripts'));

    minifier.on('error', (err) => {
        console.log('Error minifying JS: ' + err);
        process.exit();
    });

    scripts.forEach(s => {
        let destFile;
        const absPath = path.join(appRoot, 'scripts', s);
        console.log('Minifying %s...', s);
        if (s.indexOf('admin') > -1) {
            destFile = path.join(appRoot, 'admin', s);
        } else {
            destFile = path.join(appRoot, 'public', s);
        }
        if (argv.dev) {
            const content = fs.readFileSync(absPath);
            fs.writeFileSync(destFile, content);
        } else {
            minifier.minify(absPath, {output: destFile});
        }
    });
}

function compileJade() {
    // compile jade(pug) to html
    const jadeFiles = fs.readdirSync(path.join(appRoot, 'templates'));

    function jadeCompileError(jade) {
        return function (err) {
            if (err) {
                console.log('Error compiling %s: %s', jade, err);
                process.exit();
            }
        };
    }

    jadeFiles.forEach(jade => {
        let htmlFile;
        console.log('Compiling %s...', jade);
        if (jade.indexOf('admin') > -1) {
            htmlFile = path.join(appRoot, 'admin', jade.replace('.jade', '.html'));
        } else {
            htmlFile = path.join(appRoot, 'public', jade.replace('.jade', '.html'));
        }
        const html = pug.renderFile(path.join(appRoot, 'templates', jade));
        fs.writeFile(htmlFile, html, jadeCompileError(jade));
    });
}

function runServer() {
    app.listen(app.get('port'), () => {
        console.log('shirtsofanime now accepting connections on port %d ...',
                    app.get('port'));
    });
}

function auth(req, res, next) {
    // TODO: use stronger auth method and make proper login page
    const username = config.server.username;
    const password = config.server.password;
    const user = basicAuth(req);
    if (!user || user.name !== username || user.pass !== password) {
        res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
        return res.status(401).send('<h1>401 Unauthorized</h1>');
    } 
    next();
}

function sendHTML(file, dir) {
    return function(req, res) {
        if (typeof dir === 'undefined') {
            dir = publicDir;
        }
        res.sendFile(file + '.html', {root: dir});
    };
}

const app = express();

// directory setup
const appRoot = path.join(__dirname, 'app');
const uploadsDir = path.join(__dirname, 'uploads');
const imgDir = path.join(__dirname, 'images');
const publicDir = path.join(appRoot, 'public');
const adminDir = path.join(appRoot, 'admin');
const upload = multer({ dest: uploadsDir });

[uploadsDir, imgDir, adminDir].forEach(d => {
    if (!fs.existsSync(d)) {
        fs.mkdirSync(d);
    }
});

app.set('port', config.server.port);
app.set('trust proxy', 1);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use('/admin', auth);

// -- static content
app.use(express.static(publicDir));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/', express.static(path.join(__dirname, 'bower_components')));
app.use('/admin', express.static(path.join(appRoot, 'admin')));

// -- API routes
app.get('/api/shirts', shirts.getAllShirts);
app.get('/api/shirts/unpublished', auth, shirts.getUnpublished);
app.get('/api/shirts/:id', shirts.getShirtById);
app.post('/api/shirts', upload.single('file'), shirts.createShirt);
app.put('/api/shirts/:id/publish', auth, shirts.publishShirt);
app.delete('/api/shirts/:id/delete', auth, shirts.deleteShirt);

// -- Web UI routes
app.get('/', sendHTML('index'));
app.get('/random', sendHTML('index'));
app.get('/shirt/*', sendHTML('index'));
app.get('/browse', sendHTML('browse'));
app.get('/submit', sendHTML('submit'));
// admin routes... shhh
app.get('/admin', sendHTML('admin', adminDir));
app.get('/admin/*', sendHTML('shirtadmin', adminDir));
// catch-all
app.get('/*', sendHTML('404'));

compileJade();
copyScripts();
shirts.initDb().then(() => runServer());

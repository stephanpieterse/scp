const express = require('express');
const https = require('https');
const app = express();
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
let log = {
    'info': function() {
        console.log(new Date(), JSON.stringify(arguments));
    }
};

const timeLimit = 10;

const config = {
    port: 8093
};

let usersMap = {

};

function getCode(mail, offset, len) {
    mail = mail.toString();
    let ocode = crypto.createHash('sha512').update(mail).digest('hex').substring(offset * len, (offset * len) + len);
    return ocode;
}

function timeCheck(user) {
    return timeLeft(user) <= 0;
}

function timeLeft(user) {
    if (!usersMap[user]) {
        usersMap[user] = {};
        usersMap[user].timeStart = new Date();
        usersMap[user].puzzlesDone = {};
    }
    return timeLimit - parseInt((new Date() - usersMap[user].timeStart) / 1000);
}

function addPuzzleDone(user, num) {
    if (num in usersMap[user].puzzlesDone) {
        // already did this one
    } else {
        usersMap[user].puzzlesDone[num] = 1;
    }
}

function getRandom(mn, mx) {
    return parseInt((Math.random() * mx) + mn);
}

function generatePuzzle() {
    let probI = '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/';
    let types = ['add', 'concat', 'subtract', 'multiply', 'divide', 'base64-encode', 'base64-decode'];

    for (let pix in probI) {
        let pi = probI[pix];
        let mr = parseInt((Math.random() * types.length));
        let d1;
        let d2;
        let str;
        switch (types[mr]) {
            case 'add':
                d1 = getRandom(1, 100);
                d2 = getRandom(1, 100);
                problemMap[pi] = {
                    operation: types[mr],
                    data: "" + d1 + " " + d2,
                    solution: (d1 + d2) + ""
                };
                break;
            case 'concat':
                d1 = getRandom(1, 100);
                d2 = getRandom(1, 100);
                problemMap[pi] = {
                    operation: types[mr],
                    data: "" + d1 + " " + d2,
                    solution: "" + d1 + d2
                };
                break;
            case 'subtract':
                d1 = getRandom(1, 100);
                d2 = getRandom(1 + d1, 100 + d1);
                problemMap[pi] = {
                    operation: types[mr],
                    data: "" + d2 + " " + d1,
                    solution: (d2 - d1) + ""
                };
                break;
            case 'multiply':
                d1 = getRandom(1, 100);
                d2 = getRandom(1, 100);
                problemMap[pi] = {
                    operation: types[mr],
                    data: "" + d2 + " " + d1,
                    solution: (d2 * d1) + ""
                };
                break;
            case 'divide':
                d1 = getRandom(1, 100);
                d2 = getRandom(1, 100);
                problemMap[pi] = {
                    operation: types[mr],
                    data: "" + (d2 * d1) + " " + d1,
                    solution: d2 + ""
                };
                break;
            case 'base64-encode':
                str = getCode(getRandom(1000, 2000), 0, 8);
                problemMap[pi] = {
                    operation: types[mr],
                    data: str,
                    solution: new Buffer.from(str).toString('base64')
                };
                break;
            case 'base64-decode':
                str = getCode(getRandom(1000, 2000), 0, 8);
                problemMap[pi] = {
                    operation: types[mr],
                    data: new Buffer.from(str).toString('base64'),
                    solution: str
                };
                break;
        }
    }
    log.info(problemMap);
}

let problemMap = {

};

app.get('/', function(req, res) {
    res.redirect(302, '/start');
});

app.get('/start', function(req, res) {
    res.send(`
Welcome to this challenge!
<br/>
You will need to use the api /puzzle/{num} to get a puzzle,
and post it to /solve/{num} as 'solution' 
num has to be between 0 and 127
<br/>
Add your name has a header x-username
<br/>
To complete the challenge, you need to complete all the puzzles in ${timeLimit}s
Puzzles may change every now and again to discourage hardcoding
Call /progress to check your status
`);
});

app.use(function(req, res, next) {
    res.set('x-challenge', 'scp-23-07:puzzle3');

    if (!req.headers['x-username']) {
        res.status(400);
        res.json({
            'error': 'Missing username header'
        });
        return;
    }
    req._user = req.headers['x-username'];
    req._code = getCode(req._user, 0, 128);

    if (timeCheck(req._user)) {
        usersMap[req._user] = undefined;
        res.status(400);
        res.json({
            'error': 'Time limit reached, send a new request to try again'
        });
        return;
    }
    next();
});

app.get('/puzzle/:num', function(req, res) {
    let num = req.params['num'];
    num = parseInt(num);
    if (!num || num > 128 || num < 0) {
        res.status(400);
        res.json({
            'error': 'Invalid puzzle number'
        });
        return;
    }
    num = num - 1;
    let up = {
        'op': problemMap[req._code[num]].operation,
        'd': problemMap[req._code[num]].data
    };

    res.json(up);
});

app.use(require('express').json());

app.post('/solve/:num', function(req, res) {

    let num = req.params['num'];

    if (req.headers['content-type'] && req.headers['content-type'].indexOf('application/json') == -1) {
        res.json({
            "error": "Accepts application/json only"
        });
        return;
    }

    num = parseInt(num);

    if (!num || num > 128 || num < 0) {
        res.status(400);
        res.json({
            'error': 'Invalid puzzle number'
        });
    }
    num = num - 1;

    if (!req.body['solution']) {
        res.status(400);
        res.json({
            'error': 'Missing solution'
        });
        return;
    }

    if (req.body['solution'] != problemMap[req._code[num]].solution) {
        res.json({
            'error': 'Solution incorrect!',
            'time-left': timeLeft(req._user)
        });
        return;
    }

    addPuzzleDone(req._user, num);
    res.json({
        'info': 'Solution correct!',
        'time-left': timeLeft(req._user)
    });

});

app.get('/progress', function(req, res) {

    if (!timeCheck(req._user) && Object.keys(usersMap[req._user].puzzlesDone).length == 128) {
        res.status(200);
        res.json({
            "info": "Winner!"
        });
        return;
    } else {
        res.status(200);
        res.json({
            "info": "Still some puzzles to do",
            "time-left": timeLeft(req._user),
            "puzzles-left": 128 - Object.keys(usersMap[req._user].puzzlesDone).length
        });
        return;
    }
});

generatePuzzle();

let genInterval = setInterval(function() {
    generatePuzzle();
}, 15 * 60 * 1000);

https.createServer({
    requestTimeout: 10000,
    headersTimeout: 5000,
    timeout: 10000,
    cert: fs.readFileSync(path.resolve(__dirname, 'servercert.pem')),
    key: fs.readFileSync(path.resolve(__dirname, 'serverkey.pem')),
}, app).listen(config.port, '127.0.0.1', function() {
    log.info('Server started on port ' + config.port);
});

const app = require('express')();
const https = require('https');
const fs = require('fs');
const path = require('path');
process.env["NODE_CONFIG_DIR"] = path.join(__dirname, "./config/");
const config = require('config');
const log = require('bunyan')({
    "name": config['name'],
    "src": true,
});
var crypto = require('crypto');

const PImage = require("pureimage");
const font = PImage.registerFont(
    path.resolve(__dirname, "source-sans-pro.regular.ttf"),
    "Arial",
);
//load font
font.loadSync();

const { PassThrough } = require("stream");

let srvname = "scp2305p1.apollolms";

let mcache = {};

app.get('/start', function (req, res) {
    res.send(`
		Welcome to this challenge!  <br/>
		curl this server on / to get started!
`);
});

app.use(function (req, res, next) {
    res.set('x-challenge', 'scp-23-05:puzzle1');
    if (req.headers['host'].split(':')[0] != srvname) {
        log.debug(req.headers);
        res.set('x-clue', 'puzzle1 has been a great HOST, but it is time to HEAD somewhere else');
        res.json({
            "error": "This servers name is " + srvname
        });
        return;
    }

    if (!req.headers['x-email']) {
        res.json({
            "error": "Tell me who you are with an x-email header"
        });
        return;
    }

    let mail = req.headers['x-email'];
    if (mail.length >= 100) {
        res.json({
            "error": "(X) Doubt : Your email is that long. You compensating for something?"
        });
        return;
    }

    if (mail.indexOf('@') == -1) {
        res.json({
            "error": "Is that a valid address? Where is it at?"
        });
        return;
    }
    req._challenge_mail = mail;

    next();
});

app.get('/', function (req, res) {
    let mail = req._challenge_mail;
    let hash = crypto.createHash('sha256').update(mail).digest('hex').substring(0, 7);

    const WIDTH = 170;
    const HEIGHT = 100;

    const canvas = PImage.make(WIDTH, HEIGHT);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#202020";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = "#f3f3f3";
    ctx.font = "32px Arial";
    ctx.fillText(hash, 13, 35);
    ctx.font = "14px Arial";
    ctx.fillText("/check-some/{h}", 13, 70);

    const passThroughStream = new PassThrough();
    const pngData = [];
    passThroughStream.on("data", (chunk) => pngData.push(chunk));
    passThroughStream.on("end", () => {});
    PImage.encodePNGToStream(canvas, passThroughStream).then(() => {
        let buffer = Buffer.concat(pngData);
        res.set('x-clue', 'Can you decode it?');
        res.json({
            "png": buffer.toString('base64')
        });
    });

});

app.get('/check-some/:hashed', function (req, res) {
    let hs = req.params['hashed'];
    hs = hs.substring(0, 128);
    let mail = req._challenge_mail;
    var ohash = crypto.createHash('sha256').update(mail).digest('hex').substring(0, 7);
    var nhash = crypto.createHash('md5').update(ohash).digest('hex');
    if (hs != nhash) {
        res.set('x-clue', 'I plead the fifth. That sums it up. And nothing new here!');
        res.json({
            "error": "Bad hash"
        });
        return;
    }
    let d = new Date();
    let thash = "" + d.getUTCMilliseconds() + d.getUTCSeconds() + mail;
    let mid = crypto.createHash('sha256').update(thash).digest('hex');
    mcache[mail] = {
        'mid': mid,
        'dt': d
    };
    res.set('x-clue', 'Verbs matter');
    res.json({
        "token": mid,
        "clue": "quickly put it back!"
    });
});

app.post('/check-some/*', function (req, res) {
    res.set('x-clue', 'Verbs matter');
    res.json({
        "error": "Not that one!"
    });
});

app.use(require('express').json());

app.all('/check-some/*/*', function (req, res) {
    res.json({ "error": "Wrong path" });
});

app.put('/check-some/*', function (req, res) {
    if (req.headers['content-type'] && req.headers['content-type'].indexOf('application/json') == -1) {
        res.json({
            "error": "But does it parse that content-type?"
        });
        return;
    }
    let ttok = req.body['token'];
    if (!ttok) {
        res.json({
            "error": "Missing token"
        });
        return;
    }
    ttok = ttok.substring(0, 128);
    if (!mcache[req._challenge_mail]) {
        res.json({
            "error": "Who are you submitting for?"
        });
        return;
    }
    if (ttok != mcache[req._challenge_mail].mid) {
        res.json({
            "error": "Wrong token"
        });
        return;
    }
    if ((new Date()) - mcache[req._challenge_mail].dt >= config['fastTimeout']) {
        res.json({
            "error": "Token expired!"
        });
        return;
    }
    res.json({
        "url": "/submission",
        "message": "Checked and added! patch {token: encode(url+token+email)}"
    });
});


app.get('/submission', function (req, res) {
    res.json({
        "message": "This path exists :)"
    });
});

app.patch('/submission', function (req, res) {
    res.set('x-clue', 'token == dG9rZW4=');

    if (!mcache[req._challenge_mail]) {
        res.set('x-clue', 'Maybe do the challenge');
        res.json({
            "error": "Don't have a record of that mail doing the token part :)"
        });
        return;
    }
    if (req.headers['content-type'] && req.headers['content-type'].indexOf('application/json') == -1) {
        res.json({
            "error": "But does it parse that content-type?"
        });
        return;
    }
    log.debug(req.body);
    let ddat = req.body['token'];
    if (!ddat) {
        res.json({
            "error": "Missing token"
        });
        return;
    }
    let cs = "/submission" + "+" + mcache[req._challenge_mail].mid + "+" + req._challenge_mail;
    ddat = ddat.substring(0, 512);
    if (ddat.indexOf('submission') != -1 || ddat.indexOf(req._challenge_mail) != -1 || ddat.indexOf(mcache[req._challenge_mail].mid) != -1) {
        if (ddat.indexOf('submission') == -1 || ddat.indexOf(req._challenge_mail) == -1 || ddat.indexOf(mcache[req._challenge_mail].mid) == -1) {
            res.json({
                "error": "Not encoded, and some data is missing"
            });
            return;
        }
        res.json({
            "error": "Data is not encoded"
        });
        return;
    }

    let check = Buffer.from(ddat, 'base64').toString();
    var hasMoreThanAscii = check.split("").some(function (char) { return char.charCodeAt(0) > 127; });
    if (hasMoreThanAscii) {
        res.json({
            "error": "Decoding that has some funny characters, likely wrong encoding"
        });
        return;
    }

    if (check.indexOf('/submission') == -1 || check.indexOf(req._challenge_mail) == -1 || check.indexOf(mcache[req._challenge_mail].mid) == -1) {
        res.json({
            "error": "Some data seems to be missing."
        });
        return;
    }

    log.debug(check);
    if (check.indexOf('+') == -1) {
        res.json({
            "error": "Gotta keep that data seperated"
        });
        return;
    }

    if (check != cs) {
        log.debug({
            "submission": check,
            "vs": cs,
            "mail": req._challenge_mail
        });
        res.json({
            "error": "Bad combo, did any values change?"
        });
        return;
    }

    if ((new Date()) - mcache[req._challenge_mail].dt >= config['fastTimeout'] * 2) {
        res.json({
            "error": "Token expired, faster!"
        });
        return;
    }

    log.info("Winner!");
    res.json({
        "message": "Well done on completing this challenge! Thanks for playing :)"
    });

});

app.use(function (req, res, next) {
    res.status(404).send('URI Not found');
});

app.use((err, req, res, next) => {
    log.error(err);
    res.status(500).send('An error occured! Please check for an existing issue, or make one on the main repo.');
});


https.createServer({
    requestTimeout: 2000,
    headersTimeout: 1000,
    timeout: 10000,
    cert: fs.readFileSync(path.resolve(__dirname, 'servercert.pem')),
    key: fs.readFileSync(path.resolve(__dirname, 'serverkey.pem')),
}, app).listen(config['port'], '127.0.0.1', function () {
    log.info('Secure server started on localhost port ' + config['port']);
});

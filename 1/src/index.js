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

let srvname = "scp2305p1.apollolms.co.za";
const rateLimit = require('express-rate-limit');
const storage = require('node-persist');
storage.init({
    dir: "storage",
    writeQueue: false
});

function rateLimKeyGen(req, res) {
    return "" + req.ip + req.headers['x-email'];
}

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 60,
    standardHeaders: false, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: true, // Disable the `X-RateLimit-*` headers,
    keyGenerator: rateLimKeyGen,
});

app.use(limiter);
let mcache = {};

app.get("/stats", function (req, res) {
    if (req.headers['x-auth'] != '22ea5e5afe25dff211b140cbbb179a11') {
        res.status(401).send("Unauthenticated");
        return;
    }
    storage.keys().then(async function (keys) {
        let xx = [];
        for (let k in keys) {
            let x = await storage.getItem(keys[k]);
            x.name = keys[k];
            x.id = crypto.createHash('md5').update(keys[k]).digest('hex');
            xx.push(x);
        }
        let winners = xx.filter(function (a) {
            return a.completed;
        });
        winners = winners.sort(function (a, b) {
            a.timeFinished < b.timeFinished;
        });
        res.json({
            "competing": xx.length,
            "winners": winners.length,
            "wins": winners,
            "stats": xx
        });
    });
});

app.get('/start', function (req, res) {
    res.send(`
		Welcome to this challenge!  <br/>
		Some things before we get started  <br/>
		<br/>
		1) Dont be rude! <br/>
		2) E-mail Address is used for stats. If you aren't into that, use an invalid one.
		<br/>
		<br/>
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

    storage.getItem("stats/" + mail).then(function (stat) {
        if (stat) {
            stat.calls += 1;
            stat.lastSeen = new Date();
            storage.setItem("stats/" + mail, stat);
        } else {
            let pstat = {
                calls: 1,
                timeStarted: new Date(),
                lastSeen: new Date(),
                completed: false
            };
            storage.setItem("stats/" + mail, pstat);
        }
    });
    next();
});

app.get('/', function (req, res) {
    let mail = req._challenge_mail;
    var hash = crypto.createHash('sha256').update(mail).digest('hex').substring(0, 7);
    const {
        createCanvas
    } = require("canvas");

    const WIDTH = 170;
    const HEIGHT = 100;

    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#202020";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = "#f3f3f3";
    ctx.font = "32px Arial";
    ctx.fillText(hash, 13, 35);
    ctx.font = "14px Arial";
    ctx.fillText("/check-some/{h}", 13, 70);

    const buffer = canvas.toBuffer("image/png");
    res.set('x-clue', 'Can you decode it?');
    res.json({
        "png": buffer.toString('base64')
    });
});

app.get('/check-some/:hashed', function (req, res) {
    let hs = req.params['hashed'];
    hs = hs.substring(0, 128);
    let mail = req._challenge_mail;
    var ohash = crypto.createHash('sha256').update(mail).digest('hex').substring(0, 7);
    var nhash = crypto.createHash('md5').update(ohash).digest('hex');
    if (hs != nhash) {
        res.set('x-clue', 'I plead the fifth. That sums it up.');
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
    log.info(req.body);
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

    log.info(check);
    if (check.indexOf('+') == -1) {
        res.json({
            "error": "Gotta keep that data seperated"
        });
        return;
    }

    if (check != cs) {
        log.info({
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

    let mail = req._challenge_mail;

    storage.getItem("stats/" + mail).then(function (stat) {

        if (!stat.completed) {
            stat.timeFinished = new Date();
            stat.completed = true;
            storage.setItem("stats/" + mail, stat);
        }

        res.json({
            "message": "Well done on completing this challenge! Thanks for playing :)",
            "stats": stat,
        });
    });

});

app.use(function (req, res, next) {
    res.status(404).send('URI Not found');
});

app.use((err, req, res, next) => {
    log.error(err);
    res.status(500).send('An error occured! It has been logged and we will look into it');
});


https.createServer({
    requestTimeout: 2000,
    headersTimeout: 1000,
    timeout: 10000,
    cert: fs.readFileSync(path.resolve(__dirname, 'servercert.pem')),
    key: fs.readFileSync(path.resolve(__dirname, 'serverkey.pem')),
}, app).listen(config['port'], '127.0.0.1', function () {
    log.info('Server started on port ' + config['port']);
});

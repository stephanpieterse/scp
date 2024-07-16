const app = require('express')();
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const config = {
    port: 8080,
    sport: 8443,
    totalRequests: 5000
}

const log = {
    error: function () {
        console.error(arguments);
    },
    info: function () {
        console.log(arguments);
    }
}

let mcache = {};
let umap = {};

let timeLimit = 15;

const rateLimit = require('express-rate-limit');

function rateLimKeyGen(req, res) {
    return "" + req.ip + req.path;
}

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 5,
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers,
    keyGenerator: rateLimKeyGen,
});

app.use(limiter);

app.get('/', function (req, res) {
    res.send(`
		Welcome to this challenge!
		curl this server on /start to start the timer.
        See if you can make ${config.totalRequests} requests in under ${timeLimit}s!
        This endpoint does not count toward your total.
`);
});

app.get('/start', function (req, res) {
    mcache[req.ip] = {
        starttime: new Date(),
        count: 0
    };
    res.send(`Timer started! Good luck!`);
});

app.use(function (req, res, next) {
    if (!mcache[req.ip]) {
        res.send('call / first!');
        return;
    }

    if (mcache[req.ip].count >= config.totalRequests) {
        mcache[req.ip].won = true;
    }

    if (mcache[req.ip].won) {
        log.info("Winner!");
        res.send('Congratulations! You beat this challenge!');
        return;
    }

    let timeLeft = timeLimit - ((new Date()) - mcache[req.ip].starttime) / 1000;
    if (timeLeft < 0) {
        res.send(`Sorry, ran out of time! Try again!`);
        return;
    }
    res.set('x-calls-left', config.totalRequests - mcache[req.ip].count);
    res.set('x-time-left', timeLeft);
    next();
});

app.use(function (req, res, next) {
    var ukey = req.path.length;
    if (!umap[ukey]) {
        umap[ukey] = 0;
    }
    umap[ukey] += 1;
    res.set("x-key", umap[ukey]);
    setTimeout(function () {
        mcache[req.ip].count += 1;
        res.send(':-)');
    }, umap[ukey] * 1000);
});

app.use((err, req, res, next) => {
    log.error(err);
    res.status(500).send('An error occured! Please check for an existing issue, or make one on the main repo.');
});

let cleanInterval = setInterval(function () {
    for (let i in umap) {
        umap[i] = Math.max(0, umap[i] - 1);
    }
    console.log(umap);
}, timeLimit * 1000);

https.createServer({
    requestTimeout: 1000,
    headersTimeout: 500,
    timeout: 1000,
    cert: fs.readFileSync(path.resolve(__dirname, 'servercert.pem')),
    key: fs.readFileSync(path.resolve(__dirname, 'serverkey.pem')),
}, app).listen(config['sport'], '127.0.0.1', function () {
    log.info('https server started on port ' + config['sport']);
});

http.createServer({
    requestTimeout: 1000,
    headersTimeout: 500,
    timeout: 1000
}, app).listen(config['port'], '127.0.0.1', function () {
    log.info('http server started on port ' + config['port']);
});

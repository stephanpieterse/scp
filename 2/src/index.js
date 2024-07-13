const express = require('express');
const https = require('https');
const app = express();
const fs = require('fs');
const path = require('path');

const log = require('bunyan')({
    "name": "puzzle2",
    "src": true
});

const crypto = require('crypto');
const thepage = fs.readFileSync(path.resolve(__dirname,'page_template.html')).toString();
const thepageend = fs.readFileSync(path.resolve(__dirname,'page_template_end.html')).toString();

function templater(src, values) {
    log.debug(src);
    let newsrc = src;
    for (let v in values) {
        newsrc = newsrc.replace("{{" + v + "}}", values[v]);
    }
    let mtc = newsrc.match(/{{.*?}}/g);
    for (let n in mtc) {
        newsrc = newsrc.replace(mtc[n], "");
    }
    return newsrc;
}

app.get("/", function (req, res) {
    res.send("Try /start");
});

app.get("/start", function (req, res) {
    let vals = {
        "PAGE_TITLE": "Welcome!",
        "BODY_MESSAGE": "Hi there, what is your name?",
        "BODY_FOOTER": "Your name is used for the challenge. You can provide a fake one if you want",
        "INPUT_NAME": "mail",
        "FORM_ACTION": "/setmail"
    };
    let p = templater(thepage, vals);
    res.send(p);
});


function getCode(mail, offset) {
    let ocode = crypto.createHash('sha512').update(mail).digest('hex').substring(offset * 7, (offset * 7) + 7);
    return ocode;
}

app.use(express.urlencoded({
    extended: true
}));

app.post("/setmail", function (req, res) {
    res.status(302);
    res.set("location", "/" + req.body.mail + "/1");
    res.send("redir");
});

app.get("/:mail/1", function (req, res) {

    let mail = req.params["mail"];
    let msg = req.query["error"] || "";
    let code = getCode(mail, 0);
    let vals = {
        "PAGE_TITLE": "Welcome " + mail,
        "BODY_ERROR": msg,
        "BODY_MESSAGE": "Submit the code<br/>" + code,
        "INPUT_NAME": "code",
        "FORM_ACTION": "/" + mail + "/2"
    };
    let p = templater(thepage, vals);
    res.send(p);
});

app.post("/:mail/2", function (req, res) {

    let mail = req.params["mail"];
    let ocode = getCode(mail, 0);
    if (req.body.code != ocode) {
        res.status(302);
        res.set("location", "/" + mail + "/1?error=Bad+code");
        res.send("redir");
    }
    let code = getCode(mail, 1);
    code = Buffer.from(code).toString('base64');
    let vals = {
        "PAGE_TITLE": "Welcome " + mail,
        "BODY_MESSAGE": "Submit the (de)code<br/>" + code,
        "INPUT_NAME": "code",
        "FORM_ACTION": "/" + mail + "/3"
    };
    let p = templater(thepage, vals);
    res.send(p);
});

app.post("/:mail/3", function (req, res) {

    let mail = req.params["mail"];
    let ocode = getCode(mail, 1);
    if (req.body.code != ocode) {
        res.status(302);
        res.set("location", "/" + mail + "/1?error=Bad+code");
        res.send("redir");
    }
    let code = getCode(mail, 2);
    code = Buffer.from(code).toString('base64');
    let vals = {
        "PAGE_TITLE": "The code is " + code,
        "BODY_MESSAGE": "Submit the (de)code<br/> { code somewhere else }",
        "INPUT_NAME": "code",
        "FORM_ACTION": "/" + mail + "/4"
    };
    let p = templater(thepage, vals);
    res.send(p);
});

app.post("/:mail/4", function (req, res) {

    let mail = req.params["mail"];
    let ocode = crypto.createHash('sha512').update(mail).digest('hex').substring(14, 21);
    if (req.body.code != ocode) {
        res.status(302);
        res.set("location", "/" + mail + "/1?error=Bad+code");
        res.send("redir");
    }
    let code = crypto.createHash('sha512').update(mail).digest('hex').substring(21, 28);
    code = Buffer.from(code).toString('base64');
    let vals = {
        "PAGE_TITLE": "The code is somewhere else again!",
        "BODY_MESSAGE": "Submit the (de)code<br/> { code somewhere else }",
        "INPUT_NAME": "code",
        "BODY_FOOTER": "<span style='display:none;'>code:" + code + "</span>",
        "FORM_ACTION": "/" + mail + "/5"
    };
    let p = templater(thepage, vals);
    res.send(p);
});

app.post("/:mail/5", function (req, res) {

    let mail = req.params["mail"];
    let ocode = crypto.createHash('sha512').update(mail).digest('hex').substring(21, 28);
    if (req.body.code != ocode) {
        res.status(302);
        res.set("location", "/" + mail + "/1?error=Bad+code");
        res.send("redir");
    }
    let code = crypto.createHash('sha512').update(mail).digest('hex').substring(28, 35);
    code = Buffer.from(code).toString('base64');
    let co = code.substring(0, code.length / 2);
    let de = code.substring(code.length / 2);
    let vals = {
        "PAGE_TITLE": "The co.. is somewhere else !",
        "BODY_MESSAGE": "Submit the (..de): " + de + " <br/>",
        "INPUT_NAME": "code",
        "BODY_FOOTER": "<span style='display:none;'>co:" + co + "</span>",
        "FORM_ACTION": "/" + mail + "/6"
    };
    let p = templater(thepage, vals);
    res.send(p);
});

app.post("/:mail/6", function (req, res) {

    let mail = req.params["mail"];
    let ocode = crypto.createHash('sha512').update(mail).digest('hex').substring(28, 35);
    if (req.body.code != ocode) {
        res.status(302);
        res.set("location", "/" + mail + "/1?error=Bad+code");
        res.send("redir");
    }
    let code = crypto.createHash('sha512').update(mail).digest('hex').substring(35, 42);
    code = Buffer.from(code).toString('base64');
    let co = code.substring(0, code.length / 2);
    let c = co.substring(0, co.length / 2);
    let o = co.substring(co.length / 2);
    let de = code.substring(code.length / 2);
    let vals = {
        "PAGE_TITLE": "Is it over?",
        "BODY_MESSAGE": "Congratulations!<br/><span style='color:white;' o='" + o + "' >Not</span>",
        "INPUT_NAME": "code",
        "BODY_FOOTER": "<span style='display:none;'>c:" + c + "</span><span style='display:none;'>Check the network requests too</span>",
        "FORM_ACTION": "/" + mail + "/7"
    };
    let p = templater(thepage, vals);
    res.set("x-part-de", de);
    res.send(p);
});

app.post("/:mail/7", function (req, res) {

    let mail = req.params["mail"];
    let ocode = crypto.createHash('sha512').update(mail).digest('hex').substring(35, 42);
    if (req.body.code != ocode) {
        res.status(302);
        res.set("location", "/" + mail + "/1?error=Bad+code");
        res.send("redir");
    }
    let code = crypto.createHash('sha512').update(mail).digest('hex').substring(35, 42);
    code = Buffer.from(code).toString('base64');
    let vals = {
        "PAGE_TITLE": "Congratulations!",
        "BODY_MESSAGE": "Ultimate Winner!<br/><span style='display:none;' >For real!</span>",
        "BODY_FOOTER": "Feedback: scpchallenge@gmail.com",
    };
    let p = templater(thepageend, vals);
    res.set("x-winning", "true!");
    log.info(mail + " won!");
    //res.send("Ultimate winner!");
    res.send(p);
});

https.createServer({
    requestTimeout: 10000,
    headersTimeout: 5000,
    timeout: 10000,
    key: fs.readFileSync(path.resolve(__dirname, 'serverkey.pem')),
    cert: fs.readFileSync(path.resolve(__dirname, 'servercert.pem')),
}, app).listen(8092, '127.0.0.1', function () {
    log.info('Server started on port 8092');
});

module.exports = {
    getCode: getCode,
};

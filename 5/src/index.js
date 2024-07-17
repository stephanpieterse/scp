const crypto = require('crypto');
const pString = "ourLittleSecret";
const authFlag = process.env["SCP_P5_AUTH"];
const { parseArgs } = require('node:util');

const key = crypto
    .createHash('sha512')
    .update(pString)
    .digest('hex')
    .substring(0, 32);

// Static IVs are very bad and not recommended for use in systems that need to be secure.
// Don't copy paste this for use somewhere else.
const encryptionIV = crypto
    .createHash('sha512')
    .update("1")
    .digest('hex')
    .substring(0, 16);

function encryptData(data) {
    const cipher = crypto.createCipheriv("aes-256-cbc", key, encryptionIV)
    return Buffer.from(
        cipher.update(data, 'utf8', 'hex') + cipher.final('hex')
    ).toString('base64');
}

function decryptData(encryptedData) {
    const buff = Buffer.from(encryptedData, 'base64')
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, encryptionIV)
    return (
        decipher.update(buff.toString('utf8'), 'hex', 'utf8') +
        decipher.final('utf8')
    );
}

const options = {
    submit: {
        type: 'boolean',
        short: 's',
    },
    init: {
        type: 'boolean',
        short: 'i'
    },
    value: {
        type: 'string'
    },
    "get-tokens": {
        type: "boolean"
    },
    help: {
        type: 'boolean',
        short: 'h'
    }
};
const {
    values
} = parseArgs({ args: process.argv, options, strict: false, allowPositionals: true });

// console.log(values, positionals);

if (Object.keys(values).length == 0) {
    console.log("Need some --help?");
    return;
}

if (values["help"]) {
    console.log(`Welcome to the challenge!
    To beat it, you need to pass the correct commands to this tool.
    
    First, you need to "init" the app, by passing your name as a value.
    You will receive an authorization string which you need to pass to the correct environment variable.
    Once this is set, you can retrieve tokens. The tokens need to be concatenated, and then submitted.

    -h, --help:
        Show this message
    
    --value:
        The parameter to be checked by another function. Has no meaning used alone.
        Can be used with --submit or --init
    
    -i, --init:
        Treat the --value flag as a string to generate your challenge state from.
        Returns a value that needs to be used with the SCP_P5_AUTH environment variable.

    --get-tokens:
        Requires authorization.
        Returns a set of tokens for you to use.

    -s, --submit:
        Treat the --value flag as a challenge submission
    `);
    return;
}

if (values["init"]) {
    if (values["value"]) {
        console.log('Init...');
        let authKey = encryptData(values["value"] + ":" + "name" + ":" + (Date.now() + (1000 * 300)));
        console.log(authKey);
        return;
    } else {
        console.log("You need to specify a value.")
        return;
    }
}

if (!authFlag) {
    console.log("Did you specify the SCP auth flag?");
    return;
}
let myAuth;
try {
    myAuth = decryptData(authFlag);
} catch (e) {
    console.log('That does not seem to be a valid auth!')
    return
}
let username = myAuth.split(':')[0]
let tokenValidDate = parseInt(myAuth.split(':')[2])
if (Date.now() > tokenValidDate) {
    console.log('Oh no, looks like the token expired!')
    return
}

if (values["get-tokens"]) {
    
    console.log('Generating tokens for : ' + username);
    let t1 = crypto.createHash('sha512').update(myAuth).digest('hex');
    let t2 = crypto.createHash('sha512').update(myAuth + username).digest('hex');
    console.log(t1, t2);
    return
}

if (values["submit"]) {
    if (!values["value"]) {
        console.log("You need to submit something")
        return;
    }
    let st1 = values["value"].substring(0, 128);
    let st2 = values["value"].substring(128, 256);

    console.log('Checking submission...');
    let ct1 = crypto.createHash('sha512').update(myAuth).digest('hex');
    let ct2 = crypto.createHash('sha512').update(myAuth + username).digest('hex');
    if (st1 == ct1 && st2 == ct2) {
        console.log("Congratulations, you succeeded!");
        return;
    } else {
        console.log('That submission does not appear correct.')
        return;
    }
}
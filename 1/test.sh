#!/bin/bash
if [ -z "${EMAIL}" ];
then
    echo "Need an email"
    exit 1;
fi
HOST=https://puzzle1.apollolms.co.za
EMAIL_HEADER="-H 'x-email: ${EMAIL}'"
curl -k $HOST ${EMAIL_HEADER} -H 'Host:scp2305p1.apollolms.co.za' | jq '.png' -r | base64 -d > /tmp/piet.png
curl -k $HOST/check-some/44987e6f037ff3261f9945cb61355cd1 ${EMAIL_HEADER} -H 'Host: scp2305p1.apollolms.co.za' > /tmp/token
curl -k $HOST/check-some/44987e6f037ff3261f9945cb61355cd1 ${EMAIL_HEADER} -H 'Host: scp2305p1.apollolms.co.za' -XPUT -d '@/tmp/token' -H 'Content-Type: application/json'
TOK=$(cat /tmp/token | jq '.token' -r)
ENC=$(echo -n "/submission+$TOK+${EMAIL}" | base64 -w0)
UNENC=$(echo -n "/submission+$TOK+${EMAIL}")
curl -k $HOST/submission ${EMAIL_HEADER} -H 'Host: scp2305p1.apollolms.co.za' -XPATCH -d '{"token":"'$ENC'"}' -H 'Content-Type: application/json'
curl -k $HOST/submission ${EMAIL_HEADER} -H 'Host: scp2305p1.apollolms.co.za' -XPATCH -d '{"token":"'$UNENC'"}' -H 'Content-Type: application/json' -v
curl -k $HOST/submission ${EMAIL_HEADER} -H 'Host: scp2305p1.apollolms.co.za' -XPATCH -d '{"token":"NULL"}' -H 'Content-Type: application/json' -v

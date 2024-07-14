#!/bin/bash
EMAIL="scpchallenge@gmail.com"
HOST=https://localhost:8091
SRVNAME=scp2305p1.apollolms
EMAIL_HEADER="x-email: ${EMAIL}"
curl -k $HOST -H "${EMAIL_HEADER}" -H "Host: $SRVNAME" | jq '.png' -r | base64 -d > /tmp/piet.png
curl -k $HOST/check-some/1745f7c70c9ed72b1afc03036733ba0f -H "${EMAIL_HEADER}" -H 'Host: '$SRVNAME > /tmp/token

curl -k $HOST/check-some/1745f7c70c9ed72b1afc03036733ba0f -H "${EMAIL_HEADER}" -H 'Host: '$SRVNAME -XPUT -d '@/tmp/token' -H 'Content-Type: application/json'
TOK=$(cat /tmp/token | jq '.token' -r)
ENC=$(echo -n "/submission+$TOK+${EMAIL}" | base64 -w0)
UNENC=$(echo -n "/submission+$TOK+${EMAIL}")
curl -k $HOST/submission -H "${EMAIL_HEADER}" -H 'Host: '$SRVNAME -XPATCH -d '{"token":"'$ENC'"}' -H 'Content-Type: application/json' -v
curl -k $HOST/submission -H "${EMAIL_HEADER}" -H 'Host: '$SRVNAME -XPATCH -d '{"token":"'$UNENC'"}' -H 'Content-Type: application/json' -v
curl -k $HOST/submission -H "${EMAIL_HEADER}" -H 'Host: '$SRVNAME -XPATCH -d '{"token":"NULL"}' -H 'Content-Type: application/json' -v
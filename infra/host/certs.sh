#!/bin/bash
if [ -z $SSHKEY || -z $EMAIL];
then
    echo "need sshkey and email"
    exit 1;
fi
RHOST=puzzle1.apollolms.co.za
ssh -i ${SSHKEY} root@${RHOST} 'systemctl stop nginx'
ssh -i ${SSHKEY} root@${RHOST} 'certbot certonly -d puzzle1.apollolms.co.za -d scp2305p1.apollolms.co.za -n --standalone --preferred-challenges http --agree-tos --email '${EMAIL}
ssh -i ${SSHKEY} root@${RHOST} 'certbot certonly -d scp2305p1.apollolms.co.za -n --standalone --preferred-challenges http --agree-tos --email '${EMAIL}
ssh -i ${SSHKEY} root@${RHOST} 'certbot certonly -d puzzle2.apollolms.co.za -d scp2306p2.apollolms.co.za -n --standalone --preferred-challenges http --agree-tos --email '${EMAIL}
ssh -i ${SSHKEY} root@${RHOST} 'certbot certonly -d puzzle3.apollolms.co.za -d scp2307p3.apollolms.co.za -n --standalone --preferred-challenges http --agree-tos --email '${EMAIL}
ssh -i ${SSHKEY} root@${RHOST} 'systemctl start nginx'
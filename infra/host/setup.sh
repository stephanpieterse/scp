#!/bin/bash
if [ -z $SSHKEY ];
then
    echo "need SSHKEY"
    exit 1;
fi
SSHFLAGS="ssh -i $SSHKEY root@puzzle1.apollolms.co.za"
if [ -z "$1" ];
then
    $SSHFLAGS 'apt-get update'
    $SSHFLAGS 'apt-get install -y htop vim tcpdump nginx'
    $SSHFLAGS 'apt-get install -y npm nodejs'
    $SSHFLAGS 'apt-get install -y certbot'
    $SSHFLAGS 'apt-get install -y make fail2ban'
    $SSHFLAGS 'rm /etc/nginx/sites-enabled/default'
    $SSHFLAGS 'systemctl enable fail2ban; systemctl start fail2ban'
    $SSHFLAGS 'systemctl enable nginx; systemctl start nginx; systemctl reload nginx'
    $SSHFLAGS 'adduser --disabled-login --disabled-password --gecos "" node'
fi

if [ "$1" == "swap" ];
then
    $SSHFLAGS ' file /swap.1g' | grep 'Linux swap file' 
    if [ "$?" == "0" ];
    then
        echo "Swap already exists"
        exit 0
    fi
    $SSHFLAGS 'dd if=/dev/zero of=/swap.1g bs=1k count=1M'
    $SSHFLAGS 'mkswap /swap.1g'
    $SSHFLAGS 'swapon /swap.1g'
    $SSHFLAGS 'echo "/swap.1g  none  swap  sw  0  0" >> /etc/fstab'
fi
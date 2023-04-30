HOSTDOMAIN=puzzle1.apollolms.co.za
include .env

certs:
	bash certs.sh

nginxcert:
	mkdir -p nginx-certs; cd nginx-certs; openssl req -x509 -newkey rsa:4096 -keyout default-key.pem -out default-cert.pem -days 365 -subj "/C=ZA/CN=apollolms.co.za" -nodes

nginxsites:
	scp -r -i ${SSHKEY} nginx-sites/* root@${HOSTDOMAIN}:/etc/nginx/sites-enabled/
	scp -r -i ${SSHKEY} nginx-certs/* root@${HOSTDOMAIN}:/opt/
	ssh -i ${SSHKEY} root@${HOSTDOMAIN} 'systemctl reload nginx' 

setup:
	bash setup.sh
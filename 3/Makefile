PNAME=puzzle3
CERTNAME=scp2307p3.apollolms.co.za

clean:
	cd src; rm -rf node_modules || true;

install:
	cd src; npm install

run: install
	cd src; npm run start

makecert:
	cd src; openssl req -x509 -newkey rsa:4096 -keyout serverkey.pem -out servercert.pem -days 3650 -subj "/C=ZA/CN=${CERTNAME}" -nodes 

build: makecert
	$(MAKE) install
	cd src && npx pkg --compress GZip .

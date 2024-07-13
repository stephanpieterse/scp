PNAME=puzzle2
CERTNAME=scp2306p2.apollolms.co.za
include ../Makebasefile

clean:
	cd src; rm -rf node_modules || true;

wipe:
	cd src; rm -rf storage || true
	
install:
	cd src; npm install

run: install
	cd src; npm run start

build:
	$(MAKE) install
	cd src && npx pkg index.js
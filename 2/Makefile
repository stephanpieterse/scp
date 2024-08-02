PNAME=puzzle2
CERTNAME=scp2306p2.apollolms.co.za

clean:
	cd src; rm -rf node_modules || true;
	
install:
	cd src; npm install

run: install
	cd src; npm run start

build:
	$(MAKE) install
	cd src && npx pkg --compress GZip .

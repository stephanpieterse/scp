PNAME=puzzle6-kubedev

clean:
	cd src; rm -rf node_modules || true;
	rm -rf dist || true

install:
	cd src; npm install

run: install
	cd src; npm run start

build:
	$(MAKE) install
	cd src && npx pkg --compress GZip .

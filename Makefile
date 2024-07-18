GH_OWNER=stephanpieterse
GH_REPO=scp
GH_RELEASE_VERSION=${RELEASEPREFIX}-$(shell date +%Y-%m-%d-%s)

release-single:
	if [ -z "$$PUZZLE" ]; then echo "No PUZZLE !"; exit 1 ; fi
	export RELEASEPREFIX="puzzle-"$$PUZZLE; $(MAKE) create-release
	cd $$PUZZLE && $(MAKE) build && $(MAKE) -f ../Makefile release-gh

create-release:
	if [ -z "$$GH_TOKEN" ]; then echo No token !; exit 1; fi
	curl -L -X POST -H "Accept: application/vnd.github+json" -H "Authorization: Bearer ${GH_TOKEN}" -H "X-GitHub-Api-Version: 2022-11-28"  https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/releases \
	  -d '{"tag_name":"${GH_RELEASE_VERSION}","target_commitish":"main","name":"${GH_RELEASE_VERSION}","body":"${GH_RELEASE_VERSION} Release","draft":false,"prerelease":false,"generate_release_notes":false}' > _release_details.txt

build-all:
	for p in 1 2 3 4 5; do \
		echo $$p; \
		cd $$p && $(MAKE) build; \
		cd ..; \
		done

release-all:
	for p in 1 2 3 4 5; do \
	echo $$p; \
	export PUZZLE=$$p; \
	$(MAKE) release-single; \
	rm -f _release_details.txt || true; \
	done
	

release-gh:
	export GH_RELEASEID=$$(cat ../_release_details.txt  | jq '.id'); \
	for filename in $$(ls dist); do \
	echo $$filename ; \
	curl -L -X POST -H "Accept: application/vnd.github+json"  -H "Authorization: Bearer ${GH_TOKEN}" -H "X-GitHub-Api-Version: 2022-11-28" -H "Content-Type: application/octet-stream" "https://uploads.github.com/repos/${GH_OWNER}/${GH_REPO}/releases/$${GH_RELEASEID}/assets?name=$$filename" --data-binary "@dist/$$filename"; \
	done
	

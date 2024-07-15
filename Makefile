GH_OWNER=stephanpieterse
GH_REPO=scp
GH_RELEASE_VERSION=2024-07-15-B

release-all:
	if [ -z "$$GH_TOKEN" ]; then echo No token !; exit 1; fi
	curl -L -X POST -H "Accept: application/vnd.github+json" -H "Authorization: Bearer ${GH_TOKEN}" -H "X-GitHub-Api-Version: 2022-11-28"  https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/releases \
	  -d '{"tag_name":"${GH_RELEASE_VERSION}","target_commitish":"main","name":"${GH_RELEASE_VERSION}","body":"${GH_RELEASE_VERSION} Release","draft":false,"prerelease":false,"generate_release_notes":false}' > _release_details.txt

	cd 1 && $(MAKE) build && $(MAKE) -f ../Makefile release-gh
	cd 2 && $(MAKE) build && $(MAKE) -f ../Makefile release-gh
	cd 3 && $(MAKE) build && $(MAKE) -f ../Makefile release-gh
	cd 4 && $(MAKE) build && $(MAKE) -f ../Makefile release-gh
	rm -f _release_details.txt || true

release-gh:
	export GH_RELEASEID=$$(cat ../_release_details.txt  | jq '.id'); \
	for filename in $$(ls dist); do \
	echo $$filename ; \
	curl -L -X POST -H "Accept: application/vnd.github+json"  -H "Authorization: Bearer ${GH_TOKEN}" -H "X-GitHub-Api-Version: 2022-11-28" -H "Content-Type: application/octet-stream" "https://uploads.github.com/repos/${GH_OWNER}/${GH_REPO}/releases/$${GH_RELEASEID}/assets?name=$$filename" --data-binary "@dist/$$filename"; \
	done
	
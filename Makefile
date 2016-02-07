OUT=build/webvr-polyfill.js

default:
	mkdir -p `dirname $(OUT)`
	browserify src/main.js | derequire > $(OUT)

watch:
	watchify src/main.js -v -d -o build/webvr-polyfill.js

lint:
	jscs src/*.js

.PHONY: make-images push clean

MAIN_SRC = $(wildcard src/**/*.tsx) $(wildcard src/**/*.ts)
MAIN_CSS = $(wildcard src/styles/*.scss)

# The target image is not built without SHORT_VERSION variable.
# Run $ cd ../ make build_front_all && make push_front

all: build-deps build make-images

build/index.html: $(MAIN_SRC) $(MAIN_CSS)
	npm run build:production

build: build/index.html

build-deps:
	npm i

make-images:
	docker build . -t tinkermode/sensor_cloud_eval:$(SHORT_VERSION) -f devops/Dockerfile

push:
	docker push tinkermode/sensor_cloud_eval:$(SHORT_VERSION)

clean:
	rm -rf node_modules
	rm -rf build

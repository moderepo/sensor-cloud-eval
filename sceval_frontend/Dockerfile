# base image
FROM node:12.9.0-alpine as build-stage

RUN mkdir -p /usr/src/sceval
# set working directory
WORKDIR /usr/src/sceval
COPY package*.json /usr/src/sceval/
# install and cache app dependencies
RUN npm install --production
# copy files
COPY . /usr/src/sceval
# create production build
RUN npm run-script build:production
# start app
FROM nginx:1.17.3-alpine

COPY --from=build-stage /usr/src/sceval/build/ /usr/share/nginx/html
COPY --from=build-stage /usr/src/sceval/nginx.conf /etc/nginx/conf.d/default.conf

CMD ["nginx-debug", "-g","daemon off;"]

# base image
FROM node:latest

RUN mkdir -p /usr/src/sceval
# set working directory
WORKDIR /usr/src/sceval
# copy files
COPY . /usr/src/sceval
# install and cache app dependencies
RUN npm install --production
# create production build
RUN npm run-script build:production
# start app
CMD ["npm", "start"]
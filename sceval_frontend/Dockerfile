# base image
FROM node

# set working directory
WORKDIR /

# copy files
COPY build/ /build
COPY package.json ./
COPY server.js ./
COPY app_config.js ./
COPY .env ./
COPY views/index.mustache ./views/

# install and cache app dependencies
RUN npm install --production
# start app
CMD ["npm", "start"]
ENTRYPOINT BRAND_ID=$BRAND_ID RELEASE=$RELEASE node server.js
EXPOSE 8080

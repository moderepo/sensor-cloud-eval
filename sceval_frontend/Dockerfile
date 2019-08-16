# base image
FROM node as build

# set working directory
WORKDIR /

# copy files
COPY . /
# install and cache app dependencies
RUN npm install --production
# run build script
RUN npm run-script build:production
# start app
FROM nginx:1.16.0
COPY --from=build /build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
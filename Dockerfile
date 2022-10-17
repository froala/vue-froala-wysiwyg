FROM node:14 as build

LABEL maintainer="rizwan@celestialsys.com"

ARG PackageName
ARG PackageVersion
ARG NexusUser
ARG NexusPassword


WORKDIR /app
COPY . .

RUN apt update -y \
    && apt install -y jq unzip wget
RUN wget --no-check-certificate --user ${NexusUser}  --password ${NexusPassword} https://nexus.tools.froala-infra.com/repository/Froala-npm/${PackageName}/-/${PackageName}-${PackageVersion}.tgz
RUN npm install -g bower
RUN npm install
RUN bower install

#RUN npm run demo.build

RUN rm -rf node_modules/froala-editor/
RUN rm -rf bower_components/froala-wysiwyg-editor/
#RUN wget --no-check-certificate --user ${NexusUser}  --password ${NexusPassword} https://nexus.tools.froala-infra.com/repository/Froala-npm/${PackageName}/-/${PackageName}-${PackageVersion}.tgz
RUN tar -xvf ${PackageName}-${PackageVersion}.tgz

RUN mkdir node_modules/froala-editor/ \
   && cp -a package/. node_modules/froala-editor/
RUN mkdir bower_components/froala-wysiwyg-editor/ \
   && cp -a package/. bower_components/froala-wysiwyg-editor/
RUN rm -rf package/ ${PackageName}-${PackageVersion}.tgz

FROM nginx:alpine
copy --from=build /app /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]


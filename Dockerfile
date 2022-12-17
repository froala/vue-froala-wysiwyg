FROM node:14.17.3
LABEL maintainer="froala_git_travis_bot@idera.com"
ARG PackageName
ARG PackageVersion
ARG NexusUser
ARG NexusPassword
RUN apt update -y \
    && apt install -y jq unzip wget
WORKDIR /app/
COPY . .
RUN wget --no-check-certificate --user ${NexusUser}  --password ${NexusPassword} https://nexus.tools.froala-infra.com/repository/Froala-npm/${PackageName}/-/${PackageName}-${PackageVersion}.tgz
RUN npm install
RUN npm build

EXPOSE 8080
ENTRYPOINT npm run dev --host 0.0.0.0 --port 8080
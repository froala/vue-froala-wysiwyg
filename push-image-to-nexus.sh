#!/bin/bash
 
#
#  Build & upload docker image to Nexus
#
#
#  Validate that this is a valid branch for CI/CD
#


export BRANCH_NAME=`echo "${TRAVIS_BRANCH}" | tr '[:upper:]' '[:lower:]'`
case "${BRANCH_NAME}" in
        dev*) echo "Branch ${TRAVIS_BRANCH} is eligible for CI/CD" ;;
	       ao-dev*)echo "Branch ${TRAVIS_BRANCH} is eligible for CI/CD"  ;;
        qa*) echo "Branch ${TRAVIS_BRANCH} is eligible for CI/CD"  ;;
	       qe*) echo "Branch ${TRAVIS_BRANCH} is eligible for CI/CD"  ;;
	       rc*) echo "Branch ${TRAVIS_BRANCH} is eligible for CI/CD"  ;;
	       release-master*) echo "Branch ${TRAVIS_BRANCH} is eligible for CI/CD"  ;;
        ft*) echo "Branch ${TRAVIS_BRANCH} is eligible for CI" ;;
        bf*) echo "Branch ${TRAVIS_BRANCH} is eligible for CI" ;;
        *) echo "Not a valid branch name for CI/CD" && exit -1;;
esac

echo $TRAVIS_BRANCH
echo ${DEPLOYMENT_SERVER}

# get the short commit ID to use it as docker image tag
export SHORT_COMMIT=`git rev-parse --short=7 ${TRAVIS_COMMIT}`
echo "short commit $SHORT_COMMIT"

sudo apt-get update
sudo apt-get install -y jq

#IMAGE_NAME=`echo "${BUILD_REPO_NAME}_${TRAVIS_BRANCH}" | tr '[:upper:]' '[:lower:]'`
DJANGO_IMAGE_NAME=`echo "${BUILD_REPO_NAME}_${TRAVIS_BRANCH}_${DJANGO_CONTAINER_SERVICE_NAME}" | tr '[:upper:]' '[:lower:]'`
FLASK_IMAGE_NAME=`echo "${BUILD_REPO_NAME}_${TRAVIS_BRANCH}_${FLASK_CONTAINER_SERVICE_NAME}" | tr '[:upper:]' '[:lower:]'`

PACKAGE_NAME=`jq '.name' version.json | tr -d '"'` 
PACKAGE_VERSION=`jq '.version' version.json | tr -d '"'`
echo "Package name & version : ${PACKAGE_NAME} $PACKAGE_VERSION "
#
# Update package.json with wright froala editor name & version
#
#  no package.json in this repo
#jq --arg froalaeditor "file:${PACKAGE_NAME}-${PACKAGE_VERSION}.tgz" '.dependencies["froala-editor"] |= $froalaeditor' package.json  > new.file && cat new.file > package.json && rm -f new.file
#echo "verify package"
#cat package.json

docker build -t  ${DJANGO_IMAGE_NAME}:${SHORT_COMMIT} --build-arg PackageName=${PACKAGE_NAME} --build-arg PackageVersion=${PACKAGE_VERSION} --build-arg NexusUser=${NEXUS_USER} --build-arg NexusPassword=${NEXUS_USER_PWD} -f Dockerfile_django .
sleep 3
docker image ls 
#
#  don't upload for new PR
#
if [ ${TRAVIS_PULL_REQUEST} != "false" ];  then echo "Not publishing a pull request !!!" && exit 0; fi

echo "uploading to DJANGO_IMAGE_NAME nexus" ${PACKAGE_NAME}

docker login -u ${NEXUS_USER} -p ${NEXUS_USER_PWD} ${NEXUS_CR_TOOLS_URL}
docker tag  ${DJANGO_IMAGE_NAME}:${SHORT_COMMIT} ${NEXUS_CR_TOOLS_URL}/froala-${DJANGO_IMAGE_NAME}:${PACKAGE_VERSION}
docker push ${NEXUS_CR_TOOLS_URL}/froala-${DJANGO_IMAGE_NAME}:${PACKAGE_VERSION}

docker build -t  ${FLASK_IMAGE_NAME}:${SHORT_COMMIT} --build-arg PackageName=${PACKAGE_NAME} --build-arg PackageVersion=${PACKAGE_VERSION} --build-arg NexusUser=${NEXUS_USER} --build-arg NexusPassword=${NEXUS_USER_PWD} -f Dockerfile_django .
sleep 3
docker image ls 
echo "uploading to FLASK_IMAGE_NAME nexus" ${PACKAGE_NAME}

docker tag  ${FLASK_IMAGE_NAME}:${SHORT_COMMIT} ${NEXUS_CR_TOOLS_URL}/froala-${FLASK_IMAGE_NAME}:${PACKAGE_VERSION}
docker push ${NEXUS_CR_TOOLS_URL}/froala-${FLASK_IMAGE_NAME}:${PACKAGE_VERSION}




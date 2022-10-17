#!/bin/bash
if [ ${TRAVIS_PULL_REQUEST} != "false" ];  then echo "Not deploying on a pull request !!!" && exit 0; fi
PACKAGE_VERSION=`jq '.version' version.json | tr -d '"'`
export IMAGE_NAME=`echo "froala-${BUILD_REPO_NAME}_${TRAVIS_BRANCH}:${PACKAGE_VERSION}" | tr '[:upper:]' '[:lower:]'`
export BASE_DOMAIN="froala-infra.com"
export SDK_ENVIRONMENT=""
export DEPLOYMENT_SERVER=""
SERVICE_NAME=""
CONTAINER_NAME=""
CT_INDEX=0
AO_IDENTIFIER=`echo ${TRAVIS_BRANCH}
echo "${AO_IDENTIFIER}"
OLDEST_CONTAINER=""
echo "${SSH_KEY}"  | base64 --decode > /tmp/sshkey.pem
chmod 400 /tmp/sshkey.pem
export MAX_DEPLOYMENTS_NR=0 
function get_max_deployments_per_env(){
	local ENVIRONMENT=$1
	echo "getting max deployments for environment ${ENVIRONMENT}"
	MAX_DEPLOYMENTS_NR=`jq --arg sdkenvironment ${ENVIRONMENT}  '.[$sdkenvironment]' version.json | tr -d '"'`
	echo "detected max deployments: ${MAX_DEPLOYMENTS_NR}"
}
function generate_container_name(){
	local LW_REPO_NAME=$1
	local LW_SHORT_TRAVIS_BRANCH=$2
	local SDK_ENVIRONMENT=$3
	local DEPLOYMENT_SERVER=$4
	echo "searching for ${LW_REPO_NAME} depl..."
	sleep 1
	RUNNING_DEPL=`ssh -o "StrictHostKeyChecking no" -i  /tmp/sshkey.pem ${SSH_USER}@${DEPLOYMENT_SERVER} " sudo docker ps | grep -i ${LW_REPO_NAME}"`
	echo "running depl var: ${RUNNING_DEPL}"
	echo "looking for ${LW_REPO_NAME} deployments"
	echo "getting indexes for oldest and latest deployed container"
	DEPL='ssh -o "StrictHostKeyChecking no" -i  /tmp/sshkey.pem '
	DEPL="${DEPL}  ${SSH_USER}@${DEPLOYMENT_SERVER} "
	REL=' " sudo docker ps | grep -i ' 
	DEPL="${DEPL} ${REL} "
	DEPL="${DEPL} ${LW_REPO_NAME}-${AO_IDENTIFIER} "
	REL='"'
	DEPL="${DEPL} ${REL} "
	echo "show docker containers ssh cmd:  $DEPL"
	echo   ${DEPL}  | bash > file.txt
	echo "running conatiners: "
	cat file.txt
	CT_LOWER_INDEX=`cat file.txt | awk -F'-' '{print $NF }' | sort -nk1 | head -1`
	CT_HIGHER_INDEX=`cat file.txt | awk -F'-' '{print $NF }' | sort -nk1 | tail -1`
	echo "lowest index : ${CT_LOWER_INDEX} ; and highest index : ${CT_HIGHER_INDEX}"
	if [ -z "${RUNNING_DEPL}" ]; then
		echo "first deployment"
		CT_INDEX=1
		CONTAINER_NAME="${LW_REPO_NAME}-${AO_IDENTIFIER}-${CT_INDEX}"
		SERVICE_NAME="${LW_REPO_NAME}-${LW_SHORT_TRAVIS_BRANCH}" 
	else
		echo "multiple deployments"
		CT_INDEX=${CT_HIGHER_INDEX} && CT_INDEX=$((CT_INDEX+1))
		OLDEST_CONTAINER="${LW_REPO_NAME}-${AO_IDENTIFIER}-${CT_LOWER_INDEX}"
		CONTAINER_NAME="${LW_REPO_NAME}-${AO_IDENTIFIER}-${CT_INDEX}"
		SERVICE_NAME="${LW_REPO_NAME}-${LW_SHORT_TRAVIS_BRANCH}-${CT_INDEX}"
		echo "new index: ${CT_INDEX}  & oldest horse out there: ${OLDEST_CONTAINER}"
	fi
}
echo " Container port: ${CONTAINER_SERVICE_PORTNO}"
export BRANCH_NAME=`echo "${TRAVIS_BRANCH}" | tr '[:upper:]' '[:lower:]'`
case "${BRANCH_NAME}" in
	dev*) SDK_ENVIRONMENT="dev" && DEPLOYMENT_SERVER=${FROALA_SRV_DEV}  ;;
	ao-dev*) SDK_ENVIRONMENT="dev" && DEPLOYMENT_SERVER=${FROALA_SRV_DEV} ;;
	ao*) SDK_ENVIRONMENT="dev" && DEPLOYMENT_SERVER=${FROALA_SRV_DEV} ;;
	qa*) SDK_ENVIRONMENT="qa" && DEPLOYMENT_SERVER=${FROALA_SRV_QA}  ;;
	qe*) SDK_ENVIRONMENT="qe" && DEPLOYMENT_SERVER=${FROALA_SRV_QE} ;;
	rc*) SDK_ENVIRONMENT="stg" && DEPLOYMENT_SERVER=${FROALA_SRV_STAGING}  ;;
	release-master*) SDK_ENVIRONMENT="stg" && DEPLOYMENT_SERVER=${FROALA_SRV_STAGING}  ;;
	ft*) echo "Building only on feature branch ${TRAVIS_BRANCH}... will not deploy..."  && exit 0;;
	bf*) echo "Building only on bugfix branch ${TRAVIS_BRANCH}... will not deploy..."  && exit 0;;
	test*) echo "Building only on bugfix branch ${TRAVIS_BRANCH}... will not deploy..."  && exit 0;;
	*) echo "Not a deployment branch" && exit -1;;
esac
get_max_deployments_per_env $SDK_ENVIRONMENT 
echo "deploying on environment :${SDK_ENVIRONMENT}, on server ${DEPLOYMENT_SERVER}, max deployments: ${MAX_DEPLOYMENTS_NR}"
export BASE_DOMAIN="froala-infra.com"
SHORT_REPO_NAME="${BUILD_REPO_NAME:0:17}"
BRANCH_LENGHT=`echo ${TRAVIS_BRANCH} |awk '{print length}'`
if [ ${BRANCH_LENGHT} -lt 18 ]; then 
	SHORT_TRAVIS_BRANCH=${TRAVIS_BRANCH}
else
	SHORT_TRAVIS_BRANCH="${TRAVIS_BRANCH:0:8}${TRAVIS_BRANCH: -8}"
fi
echo " short branch name : ${SHORT_TRAVIS_BRANCH}"
SHORT_TRAVIS_BRANCH=`echo ${SHORT_TRAVIS_BRANCH} | sed -r 's/-//g'`
SHORT_TRAVIS_BRANCH=`echo ${SHORT_TRAVIS_BRANCH} | sed -r 's/\.//g'`
SHORT_TRAVIS_BRANCH=`echo ${SHORT_TRAVIS_BRANCH} | sed -r 's/_//g'`
echo " short branch name : ${SHORT_TRAVIS_BRANCH}"
DEPLOYMENT_URL="${SHORT_REPO_NAME}-${SHORT_TRAVIS_BRANCH}.${SDK_ENVIRONMENT}.${BASE_DOMAIN}"
echo " deployment URL: https://${DEPLOYMENT_URL}"
cp docker-compose.yml.template docker-compose.yml
LW_REPO_NAME=`echo "${BUILD_REPO_NAME}" | tr '[:upper:]' '[:lower:]'`
LW_REPO_NAME=`echo ${LW_REPO_NAME} | sed -r 's/_//g'`  
LW_REPO_NAME=`echo ${LW_REPO_NAME} | sed -r 's/-//g'`  
LW_REPO_NAME=`echo ${LW_REPO_NAME} | sed -r 's/\.//g'` 
LW_SHORT_TRAVIS_BRANCH=`echo "${SHORT_TRAVIS_BRANCH}" | tr '[:upper:]' '[:lower:]'`
generate_container_name ${LW_REPO_NAME} ${LW_SHORT_TRAVIS_BRANCH} ${DEPLOYMENT_SERVER} ${DEPLOYMENT_SERVER} 
echo "service name : ${SERVICE_NAME} & container name : ${CONTAINER_NAME}"
sed -i "s/ImageName/${NEXUS_CR_TOOLS_URL}\/${IMAGE_NAME}/g" docker-compose.yml
sed -i "s/UrlName/${DEPLOYMENT_URL}/g" docker-compose.yml
sed -i "s/ServiceName/${SERVICE_NAME}/g" docker-compose.yml
sed -i "s/PortNum/${CONTAINER_SERVICE_PORTNO}/g" docker-compose.yml
sed -i "s/ContainerName/${CONTAINER_NAME}/g" docker-compose.yml
cat docker-compose.yml
LW_REPO_NAME_LENGTH=`echo ${LW_REPO_NAME} |awk '{print length}'`
SHORT_SERVICE_NAME="${SERVICE_NAME:0:$LW_REPO_NAME_LENGTH}"
echo "short service name: ${SHORT_SERVICE_NAME}"
function deploy_service(){
	ssh -o "StrictHostKeyChecking no" -i  /tmp/sshkey.pem ${SSH_USER}@${DEPLOYMENT_SERVER} "if [ -d /services/${SERVICE_NAME} ];  then rm -rf /services/${SERVICE_NAME}; fi && mkdir /services/${SERVICE_NAME}"
	scp  -o "StrictHostKeyChecking no" -i  /tmp/sshkey.pem docker-compose.yml ${SSH_USER}@${DEPLOYMENT_SERVER}:/services/${SERVICE_NAME}/docker-compose.yml
	ssh -o "StrictHostKeyChecking no" -i  /tmp/sshkey.pem ${SSH_USER}@${DEPLOYMENT_SERVER} " cd /services/${SERVICE_NAME}/ && sudo docker-compose pull"
	ssh -o "StrictHostKeyChecking no" -i  /tmp/sshkey.pem ${SSH_USER}@${DEPLOYMENT_SERVER} " cd /services/${SERVICE_NAME}/ && sudo docker-compose up -d"
	sleep 10 && ssh -o "StrictHostKeyChecking no" -i  /tmp/sshkey.pem ${SSH_USER}@${DEPLOYMENT_SERVER} " sudo docker ps -a | grep -i ${SERVICE_NAME}" 
	echo "Docker-compose is in : /services/${SERVICE_NAME} "
	sleep 30
	RET_CODE=`curl -k -s -o /tmp/notimportant.txt -w "%{http_code}" https://${DEPLOYMENT_URL}/demo/index.html`
	echo "validation code: $RET_CODE for  https://${DEPLOYMENT_URL}/demo/index.html"
	if [ $RET_CODE -ne 200 ]; then 
		echo "Deployment validation failed!!! Please check pipeline logs." 
		exit -1 
	else 
		echo " Service available at URL: https://${DEPLOYMENT_URL}/demo/index.html"

	fi
}  
DEPLOYMENT_IS_RUNNING=`echo "${LW_REPO_NAME}-${AO_IDENTIFIER}-${CT_LOWER_INDEX}" | tr '[:upper:]' '[:lower:]'`
REDEPLOYMENT=`ssh -o "StrictHostKeyChecking no" -i  /tmp/sshkey.pem ${SSH_USER}@${DEPLOYMENT_SERVER} " sudo docker ps -a | grep -i "${DEPLOYMENT_IS_RUNNING}" | wc -l" `
echo "${DEPLOYMENT_IS_RUNNING}"
echo "checking if this PRD exists & do redeploy: ${REDEPLOYMENT}"
if [ ${REDEPLOYMENT} -eq 1 ]; then 
	echo "Redeploying service: ${SERVICE_NAME} ..."
	deploy_service  
fi
EXISTING_DEPLOYMENTS=`ssh -o "StrictHostKeyChecking no" -i  /tmp/sshkey.pem ${SSH_USER}@${DEPLOYMENT_SERVER} " sudo docker ps  | grep -i "${LW_REPO_NAME}-${AO_IDENTIFIER}" | wc -l" `
if [ ${EXISTING_DEPLOYMENTS} -gt ${MAX_DEPLOYMENTS_NR} ]; then
	echo "Maximum deployments reached  on ${SDK_ENVIRONMENT} environment for ${BUILD_REPO_NAME}  ; existing deployments: ${EXISTING_DEPLOYMENTS} ; max depl: ${MAX_DEPLOYMENTS_NR} "
	echo "Stopping container  ${OLDEST_CONTAINER} ..."
	RCMD='ssh -o "StrictHostKeyChecking no" -i  /tmp/sshkey.pem  '
	RCMD="${RCMD} ${SSH_USER}@${DEPLOYMENT_SERVER} "
	REM='" sudo docker stop '
	RCMD="${RCMD} $REM ${OLDEST_CONTAINER}"'"'
	echo $RCMD | bash
	sleep 12
	RCMD='ssh -o "StrictHostKeyChecking no" -i  /tmp/sshkey.pem  '
	RCMD="${RCMD} ${SSH_USER}@${DEPLOYMENT_SERVER} "
	REM='" sudo docker rm '
	RCMD="${RCMD} $REM ${OLDEST_CONTAINER}"'"'	
	echo $RCMD | bash
else 
	echo "Deploying service ..."
	deploy_service 
fi
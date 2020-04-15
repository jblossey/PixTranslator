#!/bin/bash

cd backend
echo "enter backend"

echo "start maven"
mvn clean install package

echo "move files"
mv ./metadatahandler/target/*{.jar,.exe} ../frontend
mv ./databasehandler/target/*{.jar,.exe} ../frontend

echo "entering frontend"
cd ../frontend

echo "starting frontend build"
docker run --rm \
    --env-file <(env | grep -iE 'DEBUG|NODE_|ELECTRON_|YARN_|NPM_|CI|CIRCLE|TRAVIS|APPVEYOR_|CSC_|_TOKEN|_KEY|AWS_|STRIP|BUILD_') \
    -v ${PWD}:/project \
    -v ~/.cache/electron:/root/.cache/electron \
    -v ~/.cache/electron-builder:/root/.cache/electron-builder \
    electronuserland/builder:wine \
    /bin/bash -c "yarn && yarn dist && chown -R 1000:1000 . && yarn release"

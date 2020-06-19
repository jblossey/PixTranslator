#!/bin/bash

cd backend
echo "enter backend"

echo "start maven"
mvn clean install package -DskipTests

echo "move files"
mv ./metadatahandler/target/*{.jar,.exe} ../frontend
mv ./databasehandler/target/*{.jar,.exe} ../frontend
mvn clean
#!/bin/bash

HOME_PATH=terria
TRANSFER_PATH=$HOME_PATH/tmp
ENV_CONF=$HOME_PATH/env
DEPLOY_TARGET_PATH=/servers/static/aplicaciones/appsistac/atlas

scp -o "StrictHostKeyChecking=no" -r etc/deploy/config/pro/* deploy@mgcrinaco.gobiernodecanarias.net:$ENV_CONF
scp -o "StrictHostKeyChecking=no" -r target/terria-*.jar deploy@mgcrinaco.gobiernodecanarias.net:$TRANSFER_PATH/terria.jar
ssh -o "StrictHostKeyChecking=no" deploy@mgcrinaco.gobiernodecanarias.net <<EOF

    ###
    # TERRIA
    ###
    
    # Update Process
    sudo rm -Rf $DEPLOY_TARGET_PATH/*
    sudo unzip $TRANSFER_PATH/terria.jar -d $DEPLOY_TARGET_PATH
    
    # Restore Configuration
    sudo cp -rf $ENV_CONF/* $DEPLOY_TARGET_PATH
    
    sudo chown -R apache:apache $DEPLOY_TARGET_PATH
    rm -rf $TRANSFER_PATH/*
    rm -rf $ENV_CONF/*

    echo "Finished deploy"

EOF
#!/bin/bash

HOME_PATH=terria
TRANSFER_PATH=$HOME_PATH/tmp
ENV_CONF=$HOME_PATH/env
DEPLOY_TARGET_PATH=/servers/estadisticas/terria

scp -o ProxyCommand="ssh -W %h:%p deploy@estadisticas.arte-consultores.com" -r etc/deploy/config/demo/* deploy@192.168.10.16:$ENV_CONF
scp -o ProxyCommand="ssh -W %h:%p deploy@estadisticas.arte-consultores.com" -r target/terria-*.jar deploy@192.168.10.16:$TRANSFER_PATH/terria.jar
ssh -o ProxyCommand="ssh -W %h:%p deploy@estadisticas.arte-consultores.com" deploy@192.168.10.16 <<EOF

    ###
    # TERRIA
    ###
    
    # Update Process
    sudo rm -Rf $DEPLOY_TARGET_PATH/*
    sudo unzip $TRANSFER_PATH/terria.jar -d $DEPLOY_TARGET_PATH
    
    # Restore Configuration
    sudo cp -rf $ENV_CONF/* $DEPLOY_TARGET_PATH
    
    sudo chown -R www-data:www-data $DEPLOY_TARGET_PATH
    rm -rf $TRANSFER_PATH/*
    rm -rf $ENV_CONF/*

    echo "Finished deploy"

EOF
#!/bin/bash

HOME_PATH=terria
TRANSFER_PATH=$HOME_PATH/tmp
DEPLOY_TARGET_PATH=/servers/estadisticas/terria

scp -o ProxyCommand="ssh -W %h:%p deploy@estadisticas.arte-consultores.com" -r ./wwwroot/* deploy@192.168.10.16:$TRANSFER_PATH
ssh -o ProxyCommand="ssh -W %h:%p deploy@estadisticas.arte-consultores.com" deploy@192.168.10.16 <<EOF

    ###
    # TERRIA
    ###
    
    # Update Process
    sudo rm -Rf $DEPLOY_TARGET_PATH/*
    sudo mv $TRANSFER_PATH/* $DEPLOY_TARGET_PATH
    sudo chown -R www-data:www-data $DEPLOY_TARGET_PATH
    rm -rf $TRANSFER_PATH/*

    echo "Finished deploy"

EOF
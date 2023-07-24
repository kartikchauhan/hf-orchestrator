#!/bin/sh
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#
#export PATH=$GOPATH/src/github.com/hyperledger/fabric/build/bin:${PWD}/bin:${PWD}:$PATH
export PATH=${PWD}/bin:${PWD}/generatedYamls:${PWD}:$PATH
export FABRIC_CFG_PATH=${PWD}

CHANNEL_NAME=mychannel

# remove previous crypto material and config transactions
rm -rf channel-artifacts/*
rm -rf crypto-config/*

# generate crypto material
cryptogen generate --config=${PWD}/generatedYamls/crypto-config.yaml
if [ "$?" -ne 0 ]; then
  echo "Failed to generate crypto material..."
  exit 1
fi

# @Todo: Fix error `could not create orderer group. Error loading MSP configuration for org: OrdererOrg: could not load a valid ca certificate from directory /home/ec2-user/hf-orchestrator/generatedYamls/crypto-config/ordererOrganizations/example.com/msp/cacerts`
# generate genesis block for orderer
configtxgen -profile OneOrgsOrdererGenesis -outputBlock ${PWD}/channel-artifacts/genesis.block
if [ "$?" -ne 0 ]; then
  echo "Failed to generate orderer genesis block..."
  exit 1
fi

# generate channel configuration transaction
configtxgen -profile OneOrgChannel -outputCreateChannelTx ${PWD}/channel-artifacts/channel.tx -channelID $CHANNEL_NAME
if [ "$?" -ne 0 ]; then
  echo "Failed to generate channel configuration transaction..."
  exit 1
fi

# generate anchor peer transaction
configtxgen -profile OneOrgChannel -outputAnchorPeersUpdate ${PWD}/channel-artifacts/Org1MSPanchors.tx -channelID $CHANNEL_NAME -asOrg Org1MSP
if [ "$?" -ne 0 ]; then
  echo "Failed to generate anchor peer update for Org1MSP..."
  exit 1
fi

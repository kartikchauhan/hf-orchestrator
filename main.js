#!usr/bin/env node

const inquirer = require('inquirer');
const _        = require('lodash');

const generateYaml = require('./services/generate-yaml');

// question structure for taking input from user
const questions = [
    {
        name: 'networkType',
        type: 'list',
        message: 'network type',
        choices: [
            { name: 'solo' },
            { name: 'kafka', disabled: true }
        ],
        default: 'solo'
    },
    {
        name: 'networkName',
        type: 'input',
        message: 'network name',
        default: 'hf-basic',
        validate: function (val) {
            if (val.length) {
                return true;
            } else {
                return 'Please enter a valid network name'
            }
        }
    },
    {
        name: 'domainName',
        type: 'input',
        message: 'domain name',
        default: 'example.com',
        validate: (val) => {
            if (val.length) {
                return true;
            } else {
                return 'Please enter a valid domain name'
            }
        }
    },
    {
        name: 'ordererLoggingLevel',
        type: 'list',
        message: 'orderer logging level',
        choices: [ 'info', 'debug', 'error' ],
        default: 'info'
    },
    {
        name: 'peerLoggingLevel',
        type: 'list',
        message: 'peer logging level',
        choices: [ 'info', 'debug', 'error' ],
        default: 'info'
    },
    {
        name: 'chaincodeLoggingLevel',
        type: 'list',
        message: 'chaincode logging level',
        choices: [ 'info', 'debug', 'error' ],
        default: 'info'
    },
    {
        name: 'fabricImageVersion',
        type: 'input',
        message: 'fabric images version',
        default: '1.4.2',
        validate: function (val) {
            if (val.length) {
                return true;
            } else {
                return 'Please enter a valid image version'
            }
        }
    },
    {
        name: 'thirdPartyImageVersion',
        type: 'input',
        message: 'third party image version',
        default: '0.4.22',
        validate: function (val) {
            if (val.length) {
                return true;
            } else {
                return 'Please enter a valid image version for third parties'
            }
        }
    },
    {
        name: 'organizations',
        type: 'input',
        message: 'number of organizations',
        validate: (val) => {
            if (/^[1-9][0-9]*$/.test(val)) {
                return true;
            } else {
                return 'Please enter a valid number';
            }
        }
    }
];

// question structure for peer in an organization
const questionPeer = [
    {
        name: 'peer',
        type: 'input',
        message: 'number of peer in this organization',
        validate: (val) => {
            if (/^[1-9][0-9]*$/.test(val)) {
                return true;
            } else {
                return 'Please enter a numeric value';
            }
        }
    }
];

// question structure for kafka type network
const questionsKafkaNetwork = [
    {
        name: 'zookeepers',
        type: 'input',
        message: 'number of zookeepers, value must be odd and greater than 1',
        validate: (val) => {
            if (/^[0-9]*$/.test(val)) {
                if (parseInt(val) % 2 !== 0) {
                    if (parseInt(val) > 1) {
                        return true;
                    } else {
                        return 'Please enter a value > 1';
                    }
                } else {
                    return 'Please enter an odd value';
                }
            } else {
                return 'Please enter a numeric value';
            }
        }
    },
    {
        name: 'kafkas',
        type: 'input',
        message: 'number of kafkas, value must be > 3',
        validate: (val) => {
            if (/^[0-9]*$/.test(val)) {
                if (parseInt(val) > 3) {
                    return true;
                } else {
                    return 'Please enter a value > 3';
                }
            } else {
                return 'Please enter a numeric value';
            }
        }
    },
    {
        name: 'orderers',
        type: 'input',
        message: 'number of orderers, value must be >= 2',
        validate: (val) => {
            if (/^[0-9]*$/.test(val)) {
                if (parseInt(val) >= 2) {
                    return true;
                } else {
                    return 'Please enter a value >= 2';
                }
            } else {
                return 'Please enter a numeric value';
            }
        }
    }
];

const numPeers = [];

const inputPeer = (remainingOrgs) => {
    remainingOrgs = parseInt(remainingOrgs);

    if (remainingOrgs === 0) {
        configObj.peerPerOrgsArr = numPeers;
        return Promise.resolve(numPeers);
    } else {
        return inquirer.prompt(questionPeer)
            .then(val => {
                numPeers.push(parseInt(val.peer));
                return inputPeer(remainingOrgs - 1);
            })
    }
}

let configObj = {};

inquirer.prompt(questions)
    .then(response => {
        
        configObj = response;
        configObj.organizations      = _.parseInt(configObj.organizations);
        configObj.peerPerOrgsArr     = _.map(configObj.peerPerOrgsArr, _.parseInt);
        configObj.organizations      = _.parseInt(configObj.organizations);
        configObj.orderers           = _.parseInt(configObj.orderers);
        configObj.cryptoLocation     = 'crypto-config';
        configObj.channelArtifacts   = 'channel-artifacts';
        configObj.imageTag           = configObj.fabricImageVersion;
        configObj.thirdPartyImageTag = configObj.thirdPartyImageVersion;

        /**
         * Orderers will be 1 for `solo` network and for `kafka`, value will be taken as input from the user
         */
        const numOrgs = _.parseInt(response.organizations);

        inputPeer(numOrgs)
            .then(() => {
                if (response.networkType === 'kafka') {
                    configObj.zookeepers = _.parseInt(configObj.zookeepers);
                    configObj.kafkas     = _.parseInt(configObj.kafkas);
                    
                    inquirer.prompt(questionsKafkaNetwork)
                        .then(responseKafkaNetwork => {
                            configObj.zookeepers = responseKafkaNetwork.zookeepers;
                            configObj.kafkas     = responseKafkaNetwork.kafkas;
                            configObj.orderers   = responseKafkaNetwork.orderers;

                            const generateYamlObj = new generateYaml(configObj);
                            generateYamlObj.genNetworkYamls();
                        })
                } else {
                    orderers = 1;
                    configObj.orderers = orderers;

                    console.log('Generating yaml files with this configuration', JSON.stringify(configObj, null, 4));

                    const generateYamlObj = new generateYaml(configObj);
                    generateYamlObj.genNetworkYamls();
                }
            })
    })
    
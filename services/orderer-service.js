const _ = require('lodash');

const baseConfig        = require('../base-config/orderer.json');
const baseDockerService = require('./base-docker-service');
const userConfig        = require('../user-config/orderer');

const baseConfigEnv      = baseConfig.environment;
const baseConfigKafkaEnv = baseConfig.kafka;
const userConfigEnv      = userConfig.environment;

class OrdererService {
    constructor (networkName, numOrderer, numKafka, domainName, imageTag, ordererType, logLevel, cryptoLocation, channelArtifacts) {
        const baseDockerServiceObj = new baseDockerService(networkName);

        this.baseObj          = baseDockerServiceObj.genBaseDockerJson();
        this.networkName      = networkName;
        this.numOrderer       = numOrderer;
        this.domainName       = domainName;
        this.numKafka         = numKafka;
        this.imageTag         = imageTag;
        this.ordererType      = ordererType;
        this.logLevel         = logLevel;
        this.cryptoLocation   = cryptoLocation;
        this.channelArtifacts = channelArtifacts;
    }

    genOrderer () {
        const ordererJson = this.baseObj;
        ordererJson['services'] = this.genOrdererServices();

        return ordererJson;
    }

    genOrdererServices () {
        const ordererServices = {};
        let ordererName = '';

        for (let i = 0; i < this.numOrderer; i++) {
            if (this.ordererType === 'kafka') {
                ordererName = `orderer${i}.example.com`;
            } else {
                ordererName = `orderer.example.com`;
            }

            ordererServices[ordererName] = this.genOrdererServiceElement(i);
        }

        return ordererServices;
    }

    genOrdererServiceElement (id) {
        // let ordererName = '';
        // ordererName = `orderer${id}.${this.domainName}`;
        // ordererName = `orderer${id}.${this.domainName}`;

        const ordererServiceElement = {
            // 'deploy': this.genDeployElement(),
            // 'hostname': ordererName,
            'image': `hyperledger/fabric-orderer:${this.imageTag}`,
            'container_name': `orderer.example.com`,
            'environment': this.genEnvironmentElement(id),
            'working_dir': '/opt/gopath/src/github.com/hyperledger/fabric/orderer',
            'command': 'orderer',
            'ports': this.genPorts(id),
            'volumes': this.genVolumes(id),
            'networks': [ this.networkName ],
            // 'networks': this.genNetworkElement(id),
        };

        return ordererServiceElement;
    }

    genPorts (id) {
        const portElement = [
            `${7 + id}050:7050`
        ];

        return portElement;
    } 

    genDeployElement () {
        const deployElement = {
            'replicas': 1,
            'restart_policy': {
                'condition': 'on-failure',
                'delay': '5s',
                'max_attempts': 3
            }
        };

        return deployElement;
    }

    /**
     * @deprecated
    */
    genNetworkElement (id) {
        const networkElement = {};
        let ordererName = '';

        if (this.ordererType === 'kafka') {
            ordererName = `orderer${id}.${this.domainName}`;
        } else {
            ordererName = `orderer.${this.domainName}`;
        }

        networkElement[this.networkName] = {
            'aliases': [
                ordererName
            ]
        };

        return networkElement;
    }

    genEnvironmentElement (id) {
        const environmentElement = [
            `CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=${this.networkName}`,
            `FABRIC_LOGGING_SPEC=${this.logLevel}`
        ];

        environmentElement.push(...userConfigEnv);
        environmentElement.push(...baseConfigEnv);

        if (this.ordererType === 'kafka') {
            environmentElement.push(this.genConfigtxOrdererKafkaBrokers());
            environmentElement.push(...baseConfigKafkaEnv);
        }

        return environmentElement;
    }

    genConfigtxOrdererKafkaBrokers () {
        let zookeeperServerEnv = 'CONFIGT_ORDERER_KAFKA_BROKERS=[';

        for (let i = 0; i < this.numKafka; i++) {
            zookeeperServerEnv += `kafka${i}:9092,`;
        }

        return zookeeperServerEnv.slice(0, -1) + ']';
    }

    genVolumes (id) {
        const volumeList = [
            // `./${this.channelArtifacts}/genesis.block:/var/hyperledger/orderer/orderer.genesis.block`,
            `./../${this.channelArtifacts}/:/etc/hyperledger/configtx`,
            `./../${this.cryptoLocation}/ordererOrganizations/${this.domainName}/orderers/orderer.${this.domainName}/:/etc/hyperledger/msp/orderer`,
            // `./${this.cryptoLocation}/peerOrganizations/${id}.${this.domainName}/peers/orderer${id}.${this.domainName}/msp:/etc/hyperledger/msp/orderer`,
            // `./${this.cryptoLocation}/ordererOrganizations/${this.domainName}/orderers/orderer${id}.${this.domainName}/tls/:/var/hyperledger/orderer/tls`,
        ];

        return volumeList;
    }
}

module.exports = OrdererService;
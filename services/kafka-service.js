const _ = require('lodash');

const baseConfig        = require('../base-config/kafka.json');
const baseDockerService = require('./base-docker-service');

const baseConfigEnv = baseConfig.environment;

class KafkaService {
    constructor (networkName, numKafka, numZookeeper, domainName, imageTag) {
        const baseDockerServiceObj = new baseDockerService(networkName);

        this.baseObj      = baseDockerServiceObj.genBaseDockerJson();
        this.networkName  = networkName;
        this.numKafka     = numKafka;
        this.domainName   = domainName;
        this.numZookeeper = numZookeeper;

        if (_.isEmpty(imageTag)) {
            this.imageTag = 'latest';
        } else {
            this.imageTag = imageTag;
        }
    }

    genKafka () {
        const kafkaJson = this.baseObj;
        kafkaJson['services'] = this.genKafkaServices();

        return kafkaJson;
    }

    genKafkaServices () {
        const kafkaServices = {};

        for (let i = 0; i < this.numKafka; i++) {
            const kafkaName = `kafka${i}`;
            kafkaServices[kafkaName] = this.genKafkaServiceElement(i);
        }

        return kafkaServices;
    }

    genKafkaServiceElement (id) {
        const kafkaServiceElement = {
            'deploy': this.genDeployElement(),
            'hostname': `kafka${id}.${this.domainName}`,
            'image': `hyperledger/fabric-kafka:${this.imageTag}`,
            'networks': this.genNetworkElement(id),
            'environment': this.genEnvironmentElement(id)
        };

        return kafkaServiceElement;
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

    genNetworkElement (id) {
        const networkElement = {};
        networkElement[this.networkName] = {
            'aliases': [
                `kafka${id}.${this.domainName}`
            ]
        };

        return networkElement;
    }

    genEnvironmentElement (id) {
        const environmentElement = [
            `CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=${this.networkName}`,
            `KAFKA_BROKER_ID=${id}`
        ];

        environmentElement.push(this.genKafkaZookeeperConnect());
        environmentElement.push(...baseConfigEnv);

        return environmentElement;
    }

    genKafkaZookeeperConnect () {
        let zookeeperServerEnv = 'KAFKA_ZOOKEEPER_CONNECT=';

        for (let i = 0; i < this.numZookeeper; i++) {
            zookeeperServerEnv += `zookeeper${i}:2181,`;
        }

        return zookeeperServerEnv.slice(0, -1);
    }
}

module.exports = KafkaService;
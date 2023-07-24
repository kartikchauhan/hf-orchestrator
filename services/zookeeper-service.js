const _ = require('lodash');

const baseDockerService = require('./base-docker-service');

class ZookeeperService {
    constructor (networkName, numZookeeper, domainName, imageTag) {
        const baseDockerServiceObj = new baseDockerService(networkName);

        this.baseObj      = baseDockerServiceObj.genBaseDockerJson();
        this.networkName  = networkName;
        this.numZookeeper = numZookeeper;
        this.domainName   = domainName;

        if (_.isEmpty(imageTag)) {
            this.imageTag = 'latest';
        } else {
            this.imageTag = imageTag;
        }
    }

    genZookeeper () {
        const zookeeperJson = this.baseObj;
        zookeeperJson['services'] = this.genZookeeperServices();

        return zookeeperJson;
    }

    genZookeeperServices () {
        const zookeeperServices = {};

        for (let i = 0; i < this.numZookeeper; i++) {
            const zookeeperName = `zookeeper${i}`;
            zookeeperServices[zookeeperName] = this.genZookeeperServiceElement(i);
        }

        return zookeeperServices;
    }

    genZookeeperServiceElement (id) {
        const zookeeperServiceElement = {
            'deploy': this.genDeployElement(),
            'hostname': `zookeeper${id}`,
            'image': `hyperledger/fabric-zookeeper:${this.imageTag}`,
            'networks': this.genDeployElement(id),
            'environment': this.genEnvironmentElement(id)
        };

        return zookeeperServiceElement;
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
                `zookeeper${id}.${this.domainName}`
            ]
        };

        return networkElement;
    }

    genEnvironmentElement (id) {
        const environmentElement = [
            `CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=${this.networkName}`,
            `ZOO_MY_ID=${id}`
        ];

        environmentElement.push(this.genZookeeperServers());

        return environmentElement;
    }

    genZookeeperServers () {
        let zookeeperServerEnv = 'ZOO_SERVERS=';

        for (let i = 0; i < this.numZookeeper; i++) {
            zookeeperServerEnv += `server.${i + 1}=zookeeper${i}:2888:3888 `;
        }

        return zookeeperServerEnv.trim();
    }
}

module.exports = ZookeeperService;

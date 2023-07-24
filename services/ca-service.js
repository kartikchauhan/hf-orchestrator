const _ = require('lodash');

const baseConfig        = require('../base-config/ca.json');
const baseDockerService = require('./base-docker-service');

const baseConfigEnv = baseConfig.environment;

class CaService {
    constructor (networkName, numOrgs, domainName, imageTag, cryptoLocation) {
        const baseDockerServiceObj = new baseDockerService(networkName);

        this.baseObj        = baseDockerServiceObj.genBaseDockerJson();
        this.networkName    = networkName;
        this.numOrgs        = numOrgs;
        this.domainName     = domainName;
        this.imageTag       = imageTag;
        this.cryptoLocation = cryptoLocation;
    }

    genCa () {
        const caJson = this.baseObj;
        caJson['services'] = this.genCaServices();

        return caJson;
    }

    genCaServices () {
        const caServices = {};

        for (let orgIndex = 1; orgIndex <= this.numOrgs.length; orgIndex++) {
            const caName = `ca.org${orgIndex}.${this.domainName}`;
            caServices[caName] = this.genCaServicesElement(orgIndex);
        }

        return caServices;
    }

    genCaServicesElement (orgId) {
        const caId = orgId - 1;

        const caServiceElement = {
            // 'deploy': this.genDeployElement(),
            // 'hostname': `ca${orgId - 1}.${this.domainName}`,
            'image': `hyperledger/fabric-ca:${this.imageTag}`,
            'container_name': `ca.org${orgId}.${this.domainName}`,
            'environment': this.genEnvironmentElement(orgId),
            'ports': this.genPorts(orgId),
            'command': `sh -c 'fabric-ca-server start -b admin:adminpw'`,
            'volumes': this.genVolumes(orgId),
            'networks': [ this.networkName ]
            // 'networks': this.genNetworkElement(orgId),
        };

        return caServiceElement;
    }

    genPorts (orgId) {
        const portElement = [
            `${7 + orgId - 1}054:7054`
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
    genNetworkElement (orgId) {
        const networkElement = {};

        networkElement[this.networkName] = {
            'aliases': [
                `ca_Org${orgId}`
            ]
        };

        return networkElement;
    }

    genEnvironmentElement (orgId) {
        const envElement = [
            `FABRIC_CA_SERVER_CA_NAME=ca.org${orgId}.${this.domainName}`,
            `FABRIC_CA_SERVER_CA_CERTFILE=/etc/hyperledger/fabric-ca-server-config/ca.org${orgId}.${this.domainName}-cert.pem`,
            `FABRIC_CA_SERVER_CA_KEYFILE=/etc/hyperledger/fabric-ca-server-config/_sk`
        ];

        envElement.push(...baseConfigEnv);

        return envElement;
    }

    genVolumes (orgId) {
        const volumesList = [];

        volumesList.push(
            `./../${this.cryptoLocation}/peerOrganizations/org${orgId}.${this.domainName}/ca/:/etc/hyperledger/fabric-ca-server-config`
        );

        return volumesList;
    }
}

module.exports = CaService;

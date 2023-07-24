const _ = require('lodash');

const baseDockerService = require('./base-docker-service');

class CouchDbService {
    constructor (networkName, peerPerOrgsArr, domainName, imageTag) {
        const baseDockerServiceObj = new baseDockerService(networkName);

        this.baseObj        = baseDockerServiceObj.genBaseDockerJson();
        this.networkName    = networkName;
        this.peerPerOrgsArr = peerPerOrgsArr;
        this.domainName     = domainName;
        this.imageTag       = imageTag;
    }

    genCouchDb () {
        const couchDbJs = this.baseObj;
        couchDbJs['services'] = this.genCouchDbServices();

        return couchDbJs;
    }

    genCouchDbServices () {
        const couchDbServices = {};

        for (let orgIndex = 1; orgIndex <= this.peerPerOrgsArr.length; orgIndex++) {
            const numPeerInCurrentOrg = this.peerPerOrgsArr[orgIndex - 1];

            for (let couchIndex = 0; couchIndex < numPeerInCurrentOrg; couchIndex++) {
                const couchName = `couch${couchIndex}.org${orgIndex}.${this.domainName}`;
                couchDbServices[couchName] = this.genCouchDbServiceElement(couchIndex, orgIndex);
            }
        }

        // const numCouchDbInstances = this.peerPerOrgsArr.reduce((a, b) => a + b);

        // for (let couchDbInstanceIndex = 0; couchDbInstanceIndex < numCouchDbInstances; couchDbInstanceIndex++) {
            // const couchDbInstanceName = `couchdb${couchDbInstanceIndex}`;
            // couchDbServices[couchDbInstanceName] = this.genCouchDbServiceElement(couchDbInstanceIndex);
        // }

        return couchDbServices;
    }

    genCouchDbServiceElement (couchDbId, orgId) {
        const couchDbServiceElement = {
            // 'deploy': this.genDeployElement(),
            // 'hostname': `couchdb${couchDbId}.${this.domainName}`,
            'image': `hyperledger/fabric-couchdb:${this.imageTag}`,
            'container_name': `couchdb${couchDbId}.org${orgId}.${this.domainName}`,
            'ports': this.genPorts(couchDbId, orgId),
            'networks': [ this.networkName ]
            // 'networks': this.genNetworkElement(couchDbId)
        };

        return couchDbServiceElement;
    }

    genPorts (couchId, orgId) {
        let portsAllocated = this.peerPerOrgsArr.slice(0, orgId - 1).reduce((a, b) => a + b, 0);
        
        return [
            `${5 + couchId + portsAllocated}984:5984`
        ];
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
    genNetworkElement (couchDbId) {
        const networkElement = {};
        networkElement[this.networkName] = {
            'aliases': [
                `couchdb${couchDbId}`
            ]
        };

        return networkElement;
    }
}

module.exports = CouchDbService;

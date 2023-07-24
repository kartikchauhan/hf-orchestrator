const _ = require('lodash');

const baseConfig        = require('../base-config/peer.json');
const userConfig        = require('../user-config/peer.json');
const baseDockerService = require('./base-docker-service');

const baseConfigEnv     = baseConfig.environment;
const baseConfigVolumes = baseConfig.volumes;
const userConfigEnv     = userConfig.environment;

class PeerService {
    constructor (networkName, peerPerOrgsArr, domainName, imageTag, peerLoggingLevel, chaincodeLoggingLevel, cryptoLocation, channelArtifacts) {
        const baseDockerServiceObj = new baseDockerService(networkName);

        this.baseObj               = baseDockerServiceObj.genBaseDockerJson();
        this.networkName           = networkName;
        this.peerPerOrgsArr        = peerPerOrgsArr;
        this.domainName            = domainName;
        this.imageTag              = imageTag;
        this.peerLoggingLevel      = _.toUpper(peerLoggingLevel);
        this.chaincodeLoggingLevel = chaincodeLoggingLevel;
        this.cryptoLocation        = cryptoLocation;
        this.channelArtifacts      = channelArtifacts;
    }

    genPeer () {
        const peerJs = this.baseObj;
        peerJs['services'] = this.genPeerServices();

        return peerJs;
    }

    genPeerServices () {
        const peerServices = {};

        for (let orgIndex = 1; orgIndex <= this.peerPerOrgsArr.length; orgIndex++) {
            const numPeerInCurrentOrg = this.peerPerOrgsArr[orgIndex - 1];

            for (let peerIndex = 0; peerIndex < numPeerInCurrentOrg; peerIndex++) {
                const peerName = `peer${peerIndex}.org${orgIndex}.${this.domainName}`;
                peerServices[peerName] = this.genPeerServiceElement(peerIndex, orgIndex);
            }
        }

        return peerServices;
    }

    genPeerServiceElement (peerId, orgId) {
        const peerServiceElement = {
            // 'deploy': this.genDeployElement(),
            // 'hostname': `peer${peerId}.org${orgId}.${this.domainName}`,
            'image': `hyperledger/fabric-peer:${this.imageTag}`,
            'container_name': `peer${peerId}.org${orgId}.${this.domainName}`,
            'environment': this.genEnvironmentElement(peerId, orgId),
            'working_dir': '/opt/gopath/src/github.com/hyperledger/fabric/peer',
            'command': 'peer node start',
            'ports': this.genPorts(peerId, orgId),
            'volumes': this.genVolumes(peerId, orgId),
            'networks': [ this.networkName ]
            // 'networks': this.genNetworkElement(peerId, orgId),
        };

        return peerServiceElement;
    }

    genPorts (peerId, orgId) {
        let portsAllocated = this.peerPerOrgsArr.slice(0, orgId - 1).reduce((a, b) => a + b, 0);
        
        const peerPort = `${7 + peerId + portsAllocated}051:7051`;
        const grpcPort = `${7 + peerId + portsAllocated}053:7053`;

        return [ peerPort, grpcPort ];
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
    genNetworkElement (peerId, orgId) {
        const networkElement = {};

        networkElement[this.networkName] = {
            'aliases': [
                `peer${peerId}.org${orgId}.${this.domainName}`
            ]
        };

        return networkElement;
    }

    genEnvironmentElement (peerId, orgId) {
        const environmentElement = [
            `FABRIC_LOGGIN_SPEC=${this.peerLoggingLevel}`,
            `CORE_PEER_ID=peer${peerId}.org${orgId}.${this.domainName}`,
            `CORE_PEER_ADDRESS=peer${peerId}.org${orgId}.${this.domainName}:7051`,
            // `CORE_PEER_GOSSIP_EXTERNALENDPOINT=peer${peerId}.org${orgId}.${this.domainName}:7051`,
            `CORE_PEER_LOCALMSPID=Org${orgId}MSP`,
            `CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=${this.networkName}`,
            `CORE_LEDGER_STATE_COUCHDBCONFIG_COUCHDBADDRESS=couchdb${peerId}.org${orgId}.${this.domainName}:5984`
            // `CORE_PEER_GOSSIP_BOOTSTRAP=peer${peerId}.org${orgId}.${this.domainName}`
        ];

        environmentElement.push(...baseConfigEnv);

        return environmentElement;
    }

    genVolumes (peerId, orgId) {
        const volumeList = [];
        volumeList.push(baseConfigVolumes[0]);

        volumeList.push(
            `./../${this.cryptoLocation}/peerOrganizations/org${orgId}.${this.domainName}/peers/peer${peerId}.org${orgId}.${this.domainName}/msp:/etc/hyperledger/msp/peer`,
            `./../${this.cryptoLocation}/peerOrganizations/org${orgId}.${this.domainName}/users:/etc/hyperledger/msp/users`,
            `./../${this.channelArtifacts}:/etc/hyperledger/configtx`
            // `./${this.cryptoLocation}/peerOrganizations/org${orgId}.${this.domainName}/peers/peer${peerId}.org${orgId}.${this.domainName}/tls:/etc/hyperledger/fabric/tls`
        );

        return volumeList;
    }
}

module.exports = PeerService;
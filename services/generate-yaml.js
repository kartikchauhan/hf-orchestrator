const _    = require('lodash');
const path = require('path');

const Yaml         = require('./yaml-service');
const File         = require('./file-service');
const CryptoConfig = require('./crypto-config-service');
const Configtx     = require('./configtx-service');
const Zookeeper    = require('./zookeeper-service');
const Kafka        = require('./kafka-service');
const Orderer      = require('./orderer-service');
const Peer         = require('./peer-service');
const Couch        = require('./couchdb-service');
const Ca           = require('./ca-service');

class YamlGenerateService {
    constructor (configObj) {
        this.networkName              = configObj.networkName;
        this.numOrderers              = configObj.orderers;
        this.peerPerOrgsArr           = configObj.peerPerOrgsArr;
        this.domainName               = configObj.domainName;
        this.imageTag                 = configObj.imageTag;
        this.peerLoggingLevel      = configObj.peerLoggingLevel;
        this.ordererLoggingLevel      = configObj.ordererLoggingLevel;
        this.chaincodeLoggingLevel    = configObj.chaincodeLoggingLevel;
        this.cryptoLocation           = configObj.cryptoLocation;
        this.channelArtifactsLocation = configObj.channelArtifacts;
        this.ordererType              = configObj.networkType;
        this.thirdPartyImageTag       = configObj.thirdPartyImageTag;

        if (this.ordererType === 'kafka') {
            this.numZookeeper = configObj.zookeepers;
            this.numKafka = configObj.kafkas;
        }

        this.genYamlDir = path.join(__dirname, '../', 'generatedYamls');
        this.yamlObj = new Yaml();
    }

    async writeToFile(yamlObj, filename) {
        try {
            const fileObj = new File();
            const pathFile = path.join(this.genYamlDir, filename);
            
            await fileObj.saveToFile(yamlObj, pathFile);
        } catch (err) {
            console.error('Exception occurred', err);
        }
    }

    async genNetworkYamls () {
        await this.genCryptoConfigYaml();
        await this.genConfigtxYaml();

        if (this.ordererType === 'kafka') {
            await this.genZookeeperYaml();
            await this.genKafkaYaml();
        }

        await this.genOrdererYaml();
        await this.genCouchDbYaml();
        await this.genPeerYaml();
        await this.genCaYaml();
    }

    async genCryptoConfigYaml () {
        const cryptoConfigObj  = new CryptoConfig(this.peerPerOrgsArr, this.numOrderers, this.domainName, this.ordererType);
        const cryptoConfigJs   = cryptoConfigObj.genCryptoConfig();
        const yamlGeneratedObj = this.yamlObj.yamlGenerator(cryptoConfigJs);

        await this.writeToFile(yamlGeneratedObj, 'crypto-config.yaml');
    }

    async genConfigtxYaml () {
        const configtxObj      = new Configtx(this.domainName, this.numKafka, this.numOrderers, this.peerPerOrgsArr.length, this.cryptoLocation, this.ordererType);
        const configtxJs       = configtxObj.configtxGen();
        const yamlGeneratedObj = this.yamlObj.yamlGenerator(configtxJs);

        await this.writeToFile(yamlGeneratedObj, 'configtx.yaml');
    }

    async genZookeeperYaml () {
        const zookeeperObj = new Zookeeper(this.networkName, this.numZookeeper, this.domainName, this.imageTag);
        const zookeeperJs  = zookeeperObj.genZookeeper();
        const yamlGeneratedObj = this.yamlObj.yamlGenerator(zookeeperJs);

        await this.writeToFile(yamlGeneratedObj, 'zookeeper.yaml');
    }

    async genKafkaYaml () {
        const kafkaObj = new Kafka(this.networkName, this.numKafka, this.numZookeeper, this.domainName, this.imageTag);
        const kafkaJs  = kafkaObj.genKafka();
        const yamlGeneratedObj = this.yamlObj.yamlGenerator(kafkaJs);

        await this.writeToFile(yamlGeneratedObj, 'kafka.yaml');
    }

    async genOrdererYaml () {
        const ordererObj = new Orderer(this.networkName, this.numOrderers, this.numKafka, this.domainName, this.imageTag, this.ordererType, this.ordererLoggingLevel, this.cryptoLocation, this.channelArtifactsLocation);
        const ordererJs  = ordererObj.genOrderer();
        const yamlGeneratedObj = this.yamlObj.yamlGenerator(ordererJs);

        await this.writeToFile(yamlGeneratedObj, 'orderer.yaml');
    }

    async genPeerYaml () {
        const peerObj = new Peer(this.networkName, this.peerPerOrgsArr, this.domainName, this.imageTag, this.peerLoggingLevel, this.ordererLoggingLevel, this.cryptoLocation, this.channelArtifactsLocation);
        const peerJs  = peerObj.genPeer();
        const yamlGeneratedObj = this.yamlObj.yamlGenerator(peerJs);

        await this.writeToFile(yamlGeneratedObj, 'peer.yaml');
    }

    async genCouchDbYaml () {
        const couchDbObj = new Couch(this.networkName, this.peerPerOrgsArr, this.domainName, this.thirdPartyImageTag);
        const couchDbJs  = couchDbObj.genCouchDb();
        const yamlGeneratedObj = this.yamlObj.yamlGenerator(couchDbJs);

        await this.writeToFile(yamlGeneratedObj, 'couchdb.yaml');
    }

    async genCaYaml () {
        const caObj = new Ca(this.networkName, this.peerPerOrgsArr, this.domainName, this.imageTag, this.cryptoLocation);
        const caJs  = caObj.genCa();
        const yamlGeneratedObj = this.yamlObj.yamlGenerator(caJs);

        await this.writeToFile(yamlGeneratedObj, 'ca.yaml');
    }
}

module.exports = YamlGenerateService;

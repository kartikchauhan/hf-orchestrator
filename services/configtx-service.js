const _         = require('lodash');
const converter = require('number-to-words');

class ConfigtxService {
    constructor (domainName, numKafka, numOrderer, numOrgs, cryptoLocation, ordererType) {
        this.domainName     = domainName;
        this.numKafka       = numKafka;
        this.numOrderer     = numOrderer;
        this.numOrgs        = numOrgs;
        this.cryptoLocation = cryptoLocation;
        this.ordererType    = _.isEmpty(ordererType) ? `solo` : ordererType;
    }

    configtxGen () {
        const configtxGenElement = {
            'Profiles': this.genProfiles(),
            'Organizations': this.genOrganizations(),
            'Orderer': this.genOrderer()
        };

        return configtxGenElement;
    }

    genProfiles () {
        const profileElement = this.genChannelProfileCombinationLists();
        const nameGenesis = _.capitalize(converter.toWords(this.numOrgs)) + 'OrgsOrdererGenesis';
        profileElement[nameGenesis] = this.genOrgsOrdererGenesis();

        return profileElement;
    }

    genOrganizations () {
        const orgsElementList = [];
        orgsElementList.push(this.genOrdererOrg());

        const orgsList = this.genOrganizationsList(_.range(1, this.numOrgs + 1));

        return orgsElementList.concat(orgsList);
    }

    genOrderer () {
        const ordererElement = {
            'OrdererType': this.ordererType,
            'Addresses': this.genOrdererList(),
            'BatchTimeout': '2s',
            'BatchSize': {
                'MaxMessageCount': 10,
                'AbsoluteMaxBytes': 103809024,
                'PreferredMaxBytes': 524288
            },
            'Kafka': {
                'Brokers': this.genKafkaList()
            },
            'Organizations': [
                this.genOrdererOrg()
            ]
        };

        return ordererElement;
    }

    genChannelProfileCombinationLists () {
        const arrCombinations = this.genCombinations();
        const channelProfiles = {};

        for (let arr of arrCombinations) {
            let orgChannelName = '';

            for (let num of arr) {
                orgChannelName += _.capitalize(converter.toWords(num)) + 'Org';
            }

            orgChannelName += 'Channel';

            channelProfiles[orgChannelName] = {
                'Consortium': 'SampleConsortium',
                'Application': {
                    'Organizations': this.genOrganizationsList(arr)
                }
            };
        }

        return channelProfiles;
    }

    genCombinations () {
        const orgs = _.range(1, this.numOrgs + 1);
        const result = [];

        const func = function (prefix, orgs) {
            for (let index = 0; index < orgs.length; index++) {
                result.push(prefix.concat(orgs[index]));

                func(prefix.concat(orgs), orgs.slice(index + 1));
            }
        }

        func([], orgs);

        return result;
    }

    genOrgsOrdererGenesis () {
        const orgsOrdererGenesisElement = {
            'Orderer': this.genOrderer(),
            'Consortiums': {
                'SampleConsortium': {
                    'Organizations': this.genOrganizationsList(_.range(1, this.numOrgs + 1))
                }
            }
        };

        return orgsOrdererGenesisElement;
    }

    genKafkaList () {
        const kafkaList = [];

        if (this.ordererType === 'kafka') {
            for (let i = 0; i < this.numKafka; i++) {
                const kafka = `kafka${i}.${this.domainName}:9092`;
                kafkaList.push(kafka);
            }
        } else {
            kafkaList.push('127.0.0.1:9092');
        }

        return kafkaList;
    }

    genOrdererList () {
        const ordererList = [];

        if (this.ordererType === 'kafka') {
            for (let i = 0; i < this.numOrderer; i++) {
                const orderer = `orderer${i}.${this.domainName}:7050`;
                ordererList.push(orderer);
            }
        } else {
            ordererList.push(`orderer.${this.domainName}:7050`);
        }

        return ordererList;
    }

    genOrdererOrg () {
        const ordererOrgElement = {
            'Name': 'OrdererOrg',
            'ID': 'OrdererMSP',
            'MSPDir': `${this.cryptoLocation}/ordererOrganizations/${this.domainName}/msp`
        };

        return ordererOrgElement;
    }

    genOrganizationsList (arrOrgs) {
        const orgList = [];

        for (let arrOrg of arrOrgs) {
            const orgElement = {
                'Name': `Org${arrOrg}MSP`,
                'ID': `Org${arrOrg}MSP`,
                'MSPDir': `${this.cryptoLocation}/peerOrganizations/org${arrOrg}.${this.domainName}/msp`,
                'AnchorPeers': [
                    {
                        'Host': `peer0.org${arrOrg}.${this.domainName}`,
                        'Port': 7051
                    }
                ]
            };

            orgList.push(orgElement);
        }

        return orgList;
    }
}

module.exports = ConfigtxService;

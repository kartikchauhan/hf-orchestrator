const _ = require('lodash');

class CryptoConfigService {
    constructor (peerPerOrgsArr, numOrderers, domainName, ordererType) {
        this.peerPerOrgsArr = peerPerOrgsArr;
        this.numOrderers    = numOrderers;
        this.domainName     = domainName;
        this.ordererType    = ordererType;
    }

    genCryptoConfig () {
        const cryptoConfigJs = {
            'OrdererOrgs': [
                {
                    'Name': 'Orderer',
                    'Domain': this.domainName,
                    'Specs': this.genOrdererSpecs()
                }
            ],
            'PeerOrgs': this.genPeerOrgs()
        };

        return cryptoConfigJs;
    }

    genOrdererSpecs () {
        const specs = [];

        if (this.ordererType === 'solo') {
            specs.push({ 'Hostname': 'orderer' });
        } else {
            for (let ordererIndex = 0; ordererIndex < this.numOrderers; ordererIndex++) {
                specs.push({ 'Hostname': `orderer${ordererIndex}` });
            }
        }

        return specs;
    }

    genPeerOrgs () {
        const peerOrgs = [];

        for (let orgIndex = 0; orgIndex < this.peerPerOrgsArr.length; orgIndex++) {
            peerOrgs.push(
                {
                    'Name': `Org${orgIndex + 1}`,
                    'Domain': `org${orgIndex + 1}.${this.domainName}`,
                    'Template': {
                        'Count': this.peerPerOrgsArr[orgIndex]
                    },
                    'Users': {
                        'Count': 1
                    }
                }
            )
        }

        return peerOrgs;
    }
}

module.exports = CryptoConfigService;

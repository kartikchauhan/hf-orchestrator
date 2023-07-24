const _ = require('lodash');

class BaseDockerService {
    constructor (networkName) {
        this.networkName = networkName;
    }

    genBaseDockerJson () {
        const genBaseDockerElement = {
            version: '3',
            networks: this.genNetworkElement()
        }

        return genBaseDockerElement;
    }

    genNetworkElement () {
        const networkElement = {};

        networkElement[this.networkName] = {
            external: {
                name: `${this.networkName}`
            }
        };

        return networkElement;
    }
}

module.exports = BaseDockerService;
const fs = require('fs');
const _  = require('lodash');

class FileService {
    constructor () { }

    async saveToFile (yamlObj, path) {
        try {
            if (! _.isString(path)) {
                throw new Error('Path not in specified format');
            } else {
                await fs.writeFileSync(path, yamlObj);
            }
        } catch (err) {
            console.error('Exception Occurred', err);
        }
    }
}

module.exports = FileService;

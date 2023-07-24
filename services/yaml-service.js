const yaml = require('js-yaml');

class YamlService {
    constructor () { }

    yamlGenerator (obj) {
        try {
            return yaml.dump(obj, {
                styles: {
                    '!!bool' : 'lowercase'
                },
                flowLevel: 9,
                lineWidth: 255
            });
        } catch (err) {
            console.error('Exception occurred', err);
        }
    }
}

module.exports = YamlService;
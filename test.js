const yamlGen = require('./generate-yaml');

const yaml = new yamlGen('hf-basic',
    [ 1, 2, 3 ],
    3,
    'hf-basic.io',
    'latest',
    'info',
    'debug',
    'error',
    'crypto',
    'channel-artifacts'
);

yaml.genCryptoConfig();
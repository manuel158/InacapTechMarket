const { randomInt } = require('crypto');

const generarCodigo = () => {
    return randomInt(100000, 1000000).toString();
};

module.exports = generarCodigo;
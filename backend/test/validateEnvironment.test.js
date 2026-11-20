const assert = require('node:assert/strict');
const { test } = require('node:test');
const validateEnvironment = require('../config/validateEnvironment');

const validEnvironment = {
    MONGO_URI: 'mongodb://localhost/test',
    JWT_SECRET: 'test-secret',
    CLOUDINARY_CLOUD_NAME: 'cloud',
    CLOUDINARY_API_KEY: 'key',
    CLOUDINARY_API_SECRET: 'secret',
    EMAILJS_SERVICE_ID: 'service',
    EMAILJS_TEMPLATE_ID: 'template',
    EMAILJS_PUBLIC_KEY: 'public',
    EMAILJS_PRIVATE_KEY: 'private'
};

test('exige la configuración necesaria sin revelar valores', () => {
    assert.throws(
        () => validateEnvironment({ ...validEnvironment, JWT_SECRET: '' }),
        error => error.message.includes('JWT_SECRET') &&
            !error.message.includes('test-secret')
    );
});

test('acepta la configuración completa', () => {
    assert.doesNotThrow(() => validateEnvironment(validEnvironment));
});

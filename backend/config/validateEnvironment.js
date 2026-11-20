const requiredVariables = [
    'MONGO_URI',
    'JWT_SECRET',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'EMAILJS_SERVICE_ID',
    'EMAILJS_TEMPLATE_ID',
    'EMAILJS_PUBLIC_KEY',
    'EMAILJS_PRIVATE_KEY'
];

function validateEnvironment(environment = process.env) {
    const missingVariables = requiredVariables.filter(name => !environment[name]);

    if (missingVariables.length) {
        throw new Error(
            `Faltan variables de entorno requeridas: ${missingVariables.join(', ')}`
        );
    }
}

module.exports = validateEnvironment;

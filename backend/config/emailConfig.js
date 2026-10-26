const axios = require('axios');

const EMAILJS_API_URL = 'https://api.emailjs.com/api/v1.0/email/send';

async function enviarCorreo({ toEmail, toName, subject, message }) {
    const {
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        EMAILJS_PUBLIC_KEY,
        EMAILJS_PRIVATE_KEY
    } = process.env;

    const missingVariables = [
        ['EMAILJS_SERVICE_ID', EMAILJS_SERVICE_ID],
        ['EMAILJS_TEMPLATE_ID', EMAILJS_TEMPLATE_ID],
        ['EMAILJS_PUBLIC_KEY', EMAILJS_PUBLIC_KEY],
        ['EMAILJS_PRIVATE_KEY', EMAILJS_PRIVATE_KEY]
    ]
        .filter(([, value]) => !value)
        .map(([name]) => name);

    if (missingVariables.length) {
        throw new Error(
            `Faltan variables de entorno de EmailJS: ${missingVariables.join(', ')}`
        );
    }

    await axios.post(
        EMAILJS_API_URL,
        {
            service_id: EMAILJS_SERVICE_ID,
            template_id: EMAILJS_TEMPLATE_ID,
            user_id: EMAILJS_PUBLIC_KEY,
            accessToken: EMAILJS_PRIVATE_KEY,
            template_params: {
                to_email: toEmail,
                to_name: toName,
                subject,
                message
            }
        },
        { timeout: 15000 }
    );
}

module.exports = enviarCorreo;

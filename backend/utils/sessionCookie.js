const cookie = require('cookie');

const TOKEN_COOKIE_NAME = 'inacap_session';
const TOKEN_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

function serializeSessionCookie(token, secure) {
    return cookie.serialize(TOKEN_COOKIE_NAME, token, {
        httpOnly: true,
        secure,
        sameSite: 'lax',
        path: '/',
        maxAge: TOKEN_MAX_AGE_SECONDS
    });
}

function serializeClearedSessionCookie(secure) {
    return cookie.serialize(TOKEN_COOKIE_NAME, '', {
        httpOnly: true,
        secure,
        sameSite: 'lax',
        path: '/',
        maxAge: 0
    });
}

function getSessionToken(cookieHeader) {
    return cookie.parse(cookieHeader || '')[TOKEN_COOKIE_NAME] || null;
}

module.exports = {
    getSessionToken,
    serializeClearedSessionCookie,
    serializeSessionCookie
};

const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
    getSessionToken,
    serializeClearedSessionCookie,
    serializeSessionCookie
} = require('../utils/sessionCookie');

test('serializa la sesión web como cookie HttpOnly y SameSite=Lax', () => {
    const serialized = serializeSessionCookie('test-token', true);

    assert.match(serialized, /^inacap_session=test-token/);
    assert.match(serialized, /HttpOnly/);
    assert.match(serialized, /Secure/);
    assert.match(serialized, /SameSite=Lax/);
    assert.match(serialized, /Path=\//);
    assert.equal(getSessionToken(serialized), 'test-token');
});

test('expira la cookie al cerrar sesión', () => {
    const serialized = serializeClearedSessionCookie(true);

    assert.match(serialized, /Max-Age=0/);
    assert.equal(getSessionToken(serialized), null);
});

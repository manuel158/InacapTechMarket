const assert = require('node:assert/strict');
const { after, beforeEach, test } = require('node:test');
const mongoose = require('mongoose');

const conversacionId = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const vendedorId = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const interesadoId = 'cccccccccccccccccccccccc';
const conversacion = {
    _id: conversacionId,
    seller: vendedorId,
    interested: interesadoId
};
const eliminaciones = {
    conversacion: [],
    mensajes: []
};
let conversacionDisponible = true;
let sessionIniciada = false;
let sessionFinalizada = false;

const sessionMock = {
    async withTransaction(callback) {
        return callback();
    },
    async endSession() {
        sessionFinalizada = true;
    }
};

const conversacionMock = {
    findOne(filtro) {
        const usuarioId = filtro.$or[0].seller;
        const esParticipante = usuarioId === vendedorId ||
            usuarioId === interesadoId;
        return {
            select() {
                return {
                    session: async () => conversacionDisponible && esParticipante
                        ? conversacion
                        : null
                };
            }
        };
    },
    async deleteOne(filtro, opciones) {
        eliminaciones.conversacion.push({ filtro, opciones });
        return { deletedCount: 1 };
    }
};

const mensajeMock = {
    async deleteMany(filtro, opciones) {
        eliminaciones.mensajes.push({ filtro, opciones });
        return { deletedCount: 2 };
    }
};

function reemplazarModulo(ruta, exports) {
    const id = require.resolve(ruta);
    require.cache[id] = { id, filename: id, loaded: true, exports };
}

reemplazarModulo('../models/Conversacion', conversacionMock);
reemplazarModulo('../models/Mensaje', mensajeMock);
reemplazarModulo('../utils/chatNotifications', {
    async emitirCantidadNoLeidos() {}
});

const { eliminarConversacion } = require('../controllers/chatController');
const startSessionOriginal = mongoose.startSession;

beforeEach(() => {
    eliminaciones.conversacion = [];
    eliminaciones.mensajes = [];
    conversacionDisponible = true;
    sessionIniciada = false;
    sessionFinalizada = false;
    mongoose.startSession = async () => {
        sessionIniciada = true;
        return sessionMock;
    };
});

after(() => {
    mongoose.startSession = startSessionOriginal;
});

function crearResponse() {
    return {
        statusCode: 200,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(body) {
            this.body = body;
            return this;
        }
    };
}

test('el participante borra permanentemente la conversación y sus mensajes', async () => {
    const response = crearResponse();
    const eventos = [];
    const io = {
        to(room) {
            return {
                emit(evento, payload) {
                    eventos.push({ room, evento, payload });
                }
            };
        }
    };

    await eliminarConversacion({
        params: { conversacionId },
        usuario: { _id: vendedorId },
        app: { get: () => io }
    }, response);

    assert.equal(response.statusCode, 200);
    assert.equal(sessionIniciada, true);
    assert.equal(sessionFinalizada, true);
    assert.equal(eliminaciones.conversacion.length, 1);
    assert.equal(eliminaciones.mensajes.length, 1);
    assert.equal(eliminaciones.mensajes[0].filtro.conversation, conversacionId);
    assert.equal(
        eliminaciones.conversacion[0].opciones.session,
        eliminaciones.mensajes[0].opciones.session
    );
    assert.deepEqual(
        eventos.map(({ room, evento }) => `${room}:${evento}`).sort(),
        [
            `usuario:${interesadoId}:chat:conversation-deleted`,
            `usuario:${vendedorId}:chat:conversation-deleted`
        ].sort()
    );
});

test('no permite borrar una conversación de la que el usuario no participa', async () => {
    const response = crearResponse();

    await eliminarConversacion({
        params: { conversacionId },
        usuario: { _id: 'dddddddddddddddddddddddd' },
        app: { get: () => null }
    }, response);

    assert.equal(response.statusCode, 404);
    assert.equal(eliminaciones.conversacion.length, 0);
    assert.equal(eliminaciones.mensajes.length, 0);
});

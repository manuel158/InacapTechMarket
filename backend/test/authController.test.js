const assert = require('node:assert/strict');
const { beforeEach, test } = require('node:test');

const usuarioMock = {
    registrado: null,
    creado: null,
    async findOne({ correo }) {
        return this.registrado?.correo === correo ? this.registrado : null;
    },
    async create(datos) {
        this.creado = datos;
        return datos;
    }
};

const registroPendienteMock = {
    registros: [],
    siguienteId: 1,
    findOne({ correo }) {
        const registro = this.registros.find(item =>
            item.correo === correo && item.expiresAt > new Date()
        );
        return {
            select: async () => registro || null
        };
    },
    find(filtro) {
        const registros = this.registros.filter(item =>
            item.expiresAt > new Date() &&
            item.codigoHash === filtro.codigoHash
        );
        return {
            limit() {
                return this;
            },
            select: async () => registros
        };
    },
    async findOneAndUpdate(filtro, actualizacion) {
        if (actualizacion.$set) {
            let registro = this.registros.find(item => item.correo === filtro.correo);
            if (!registro) {
                registro = { _id: String(this.siguienteId++) };
                this.registros.push(registro);
            }
            Object.assign(registro, actualizacion.$set);
            return registro;
        }

        const registro = this.registros.find(item =>
            item._id === filtro._id &&
            item.expiresAt > new Date() &&
            item.intentos < filtro.intentos.$lt
        );
        if (!registro) return null;
        registro.intentos += actualizacion.$inc.intentos;
        return registro;
    },
    async deleteOne({ _id }) {
        this.registros = this.registros.filter(registro => registro._id !== _id);
    }
};

const correoMock = {
    llamadas: [],
    error: null,
    async enviar(datos) {
        this.llamadas.push(datos);
        if (this.error) throw this.error;
    }
};

function reemplazarModulo(ruta, exports) {
    const id = require.resolve(ruta);
    require.cache[id] = {
        id,
        filename: id,
        loaded: true,
        exports
    };
}

reemplazarModulo('../models/Usuario', usuarioMock);
reemplazarModulo('../models/RegistroPendiente', registroPendienteMock);
reemplazarModulo('../config/emailConfig', correoMock.enviar.bind(correoMock));

const {
    cerrarSesion,
    loginUsuario,
    registrarUsuario,
    verificarCuenta
} = require('../controllers/authController');
const bcrypt = require('bcryptjs');
process.env.JWT_SECRET = 'test-secret';

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
        },
        setHeader(name, value) {
            this.headers = this.headers || {};
            this.headers[name] = value;
            return this;
        },
        sendStatus(code) {
            this.statusCode = code;
            return this;
        }
    };
}

function datosRegistro(overrides = {}) {
    return {
        nombre: 'Manuel',
        correo: 'manuel@inacapmail.cl',
        password: 'clave-segura',
        whatsapp: '',
        tipoIntegrante: 'estudiante',
        sede: 'Valdivia',
        sexo: '',
        fechaNacimiento: '2000-01-01',
        aceptaTerminos: true,
        ...overrides
    };
}

beforeEach(() => {
    usuarioMock.registrado = null;
    usuarioMock.creado = null;
    registroPendienteMock.registros = [];
    registroPendienteMock.siguienteId = 1;
    correoMock.llamadas = [];
    correoMock.error = null;
});

test('registra una cuenta pendiente por correo y envía el código', async () => {
    const response = crearResponse();

    await registrarUsuario({ body: datosRegistro({ correo: ' MANUEL@INACAPMAIL.CL ' }) }, response);

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.mensaje, 'Código enviado al correo. Tienes 15 minutos para verificar la cuenta.');
    assert.equal(correoMock.llamadas.length, 1);
    assert.equal(correoMock.llamadas[0].toEmail, 'manuel@inacapmail.cl');
    assert.equal(registroPendienteMock.registros.length, 1);
    assert.equal(registroPendienteMock.registros[0].correo, 'manuel@inacapmail.cl');
    assert.notEqual(registroPendienteMock.registros[0].password, 'clave-segura');
    assert.equal(await bcrypt.compare('clave-segura', registroPendienteMock.registros[0].password), true);
    assert.equal(registroPendienteMock.registros[0].codigoVerificacion, undefined);
    const codigoEnviado = correoMock.llamadas[0].message.match(/\d+$/)[0];
    assert.match(codigoEnviado, /^\d{6}$/);
    assert.notEqual(
        registroPendienteMock.registros[0].codigoHash,
        codigoEnviado
    );
});

test('rechaza contraseñas demasiado cortas o que exceden el límite de bcrypt', async () => {
    const passwordCorta = crearResponse();
    const passwordLarga = crearResponse();

    await registrarUsuario({
        body: datosRegistro({ password: 'corta' })
    }, passwordCorta);
    await registrarUsuario({
        body: datosRegistro({ password: 'á'.repeat(37) })
    }, passwordLarga);

    assert.equal(passwordCorta.statusCode, 400);
    assert.equal(passwordLarga.statusCode, 400);
    assert.equal(registroPendienteMock.registros.length, 0);
    assert.equal(correoMock.llamadas.length, 0);
});

test('permite completar registros pendientes de distintos correos', async () => {
    await registrarUsuario({ body: datosRegistro() }, crearResponse());
    await registrarUsuario({
        body: datosRegistro({
            nombre: 'Ana',
            correo: 'ana@inacapmail.cl',
            password: 'otra-clave-segura'
        })
    }, crearResponse());

    const codigoManuel = correoMock.llamadas[0].message.match(/\d+$/)[0];
    const codigoAna = correoMock.llamadas[1].message.match(/\d+$/)[0];
    const responseManuel = crearResponse();
    const responseAna = crearResponse();

    await verificarCuenta({
        body: { correo: 'manuel@inacapmail.cl', codigo: codigoManuel }
    }, responseManuel);
    await verificarCuenta({
        body: { correo: 'ana@inacapmail.cl', codigo: codigoAna }
    }, responseAna);

    assert.equal(responseManuel.statusCode, 201);
    assert.equal(responseAna.statusCode, 201);
    assert.equal(usuarioMock.creado.correo, 'ana@inacapmail.cl');
    assert.equal(await bcrypt.compare('otra-clave-segura', usuarioMock.creado.password), true);
    assert.equal(registroPendienteMock.registros.length, 0);
});

test('mantiene la verificación compatible con clientes que solo envían el código', async () => {
    await registrarUsuario({ body: datosRegistro() }, crearResponse());
    const codigo = correoMock.llamadas[0].message.match(/\d+$/)[0];
    const response = crearResponse();

    await verificarCuenta({ body: { codigo } }, response);

    assert.equal(response.statusCode, 201);
    assert.equal(usuarioMock.creado.correo, 'manuel@inacapmail.cl');
});

test('rechaza un código incorrecto y consume el límite de intentos', async () => {
    await registrarUsuario({ body: datosRegistro() }, crearResponse());

    for (let intento = 0; intento < 5; intento += 1) {
        const response = crearResponse();
        await verificarCuenta({
            body: { correo: 'manuel@inacapmail.cl', codigo: '000000' }
        }, response);
        assert.equal(response.statusCode, 400);
    }

    assert.equal(usuarioMock.creado, null);
    assert.equal(registroPendienteMock.registros.length, 0);
});

test('rechaza códigos de verificación que no tienen seis dígitos', async () => {
    await registrarUsuario({ body: datosRegistro() }, crearResponse());

    for (const codigo of ['1234', '12345678']) {
        const response = crearResponse();
        await verificarCuenta({
            body: { correo: 'manuel@inacapmail.cl', codigo }
        }, response);
        assert.equal(response.statusCode, 400);
    }

    assert.equal(registroPendienteMock.registros[0].intentos, 0);
    assert.equal(usuarioMock.creado, null);
});

test('rechaza un código expirado', async () => {
    await registrarUsuario({ body: datosRegistro() }, crearResponse());
    registroPendienteMock.registros[0].expiresAt = new Date(Date.now() - 1);
    const response = crearResponse();

    await verificarCuenta({
        body: { correo: 'manuel@inacapmail.cl', codigo: '123456' }
    }, response);

    assert.equal(response.statusCode, 400);
    assert.equal(usuarioMock.creado, null);
});

test('emite cookie HttpOnly para web y conserva el token para clientes nativos', async () => {
    usuarioMock.registrado = {
        _id: 'usuario-1',
        nombre: 'Manuel',
        correo: 'manuel@inacapmail.cl',
        rol: 'usuario',
        activo: true,
        verificado: true,
        password: await bcrypt.hash('clave-segura', 10)
    };

    const respuestaWeb = crearResponse();
    await loginUsuario({
        body: { correo: 'manuel@inacapmail.cl', password: 'clave-segura' },
        get: () => 'https://inacaptechmarket.onrender.com',
        secure: true
    }, respuestaWeb);

    assert.equal(respuestaWeb.statusCode, 200);
    assert.equal(respuestaWeb.body.token, undefined);
    assert.match(respuestaWeb.headers['Set-Cookie'], /HttpOnly/);
    assert.match(respuestaWeb.headers['Set-Cookie'], /Secure/);
    assert.match(respuestaWeb.headers['Set-Cookie'], /SameSite=Lax/);

    const respuestaNativa = crearResponse();
    await loginUsuario({
        body: { correo: 'manuel@inacapmail.cl', password: 'clave-segura' },
        get: () => 'capacitor://localhost',
        secure: false
    }, respuestaNativa);

    assert.equal(respuestaNativa.statusCode, 200);
    assert.equal(typeof respuestaNativa.body.token, 'string');
    assert.equal(respuestaNativa.headers, undefined);
});

test('cierra la cookie de sesión con los mismos atributos', () => {
    const response = crearResponse();

    cerrarSesion({ secure: true }, response);

    assert.equal(response.statusCode, 204);
    assert.match(response.headers['Set-Cookie'], /HttpOnly/);
    assert.match(response.headers['Set-Cookie'], /Secure/);
    assert.match(response.headers['Set-Cookie'], /Max-Age=0/);
});

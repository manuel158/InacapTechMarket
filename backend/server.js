require('dotenv').config();

const authRoutes =
require('./routes/authRoutes');

const productoRoutes =
require('./routes/productoRoutes');

const adminRoutes =
require('./routes/adminRoutes');
const chatRoutes =
require('./routes/chatRoutes');

const express = require('express');
const http = require('http');
const path = require('path');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const inicializarChat = require('./socket/chatSocket');
const cors = require('cors');
const helmet = require('helmet');
const validarEntorno = require('./config/validateEnvironment');

const app = express();
const server = http.createServer(app);
app.set('trust proxy', 1);
const allowedOrigins = [
    'https://inacaptechmarket.onrender.com',
    'capacitor://localhost',
    'http://localhost',
    'https://localhost',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    ...(process.env.FRONTEND_URL
        ? [process.env.FRONTEND_URL.replace(/\/+$/, '')]
        : [])
];
const corsMethods = ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'];
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: corsMethods,
        credentials: true
    }
});

app.set('io', io);
inicializarChat(io);

const PORT = process.env.PORT || 3000;

const frontendDist = path.join(__dirname, '../frontend-react/dist');
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            baseUri: ["'self'"],
            connectSrc: ["'self'", 'wss://inacaptechmarket.onrender.com'],
            fontSrc: ["'self'", 'https:', 'data:'],
            formAction: ["'self'"],
            frameAncestors: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            objectSrc: ["'none'"],
            scriptSrc: ["'self'", 'https://cdn.jsdelivr.net'],
            styleSrc: ["'self'", 'https://cdn.jsdelivr.net', "'unsafe-inline'"],
            styleSrcAttr: ["'unsafe-inline'"],
            upgradeInsecureRequests: null
        }
    }
}));
app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Origen no permitido por CORS'));
    },
    methods: corsMethods,
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express.static(frontendDist));
app.use(express.json({ limit: '256kb' }));

app.use('/api/auth', authRoutes);

app.use('/api/productos', productoRoutes);

app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);

app.use((error, req, res, next) => {
    if (error.type === 'entity.too.large') {
        return res.status(413).json({
            mensaje: 'La solicitud supera el tamaño permitido'
        });
    }

    if (error.name === 'MulterError' && error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
            mensaje: 'Cada imagen debe pesar 10 MB o menos'
        });
    }

    if (
        error.name === 'MulterError' &&
        ['LIMIT_FILE_COUNT', 'LIMIT_FIELD_COUNT', 'LIMIT_PART_COUNT'].includes(error.code)
    ) {
        return res.status(400).json({
            mensaje: 'El formulario contiene demasiados archivos o campos'
        });
    }

    return next(error);
});

async function iniciarServidor() {
    validarEntorno();
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB conectado');

    server.listen(PORT, () => {
        console.log(`Servidor iniciado en http://localhost:${PORT}`);
    });
}

iniciarServidor().catch(error => {
    console.error('No se pudo iniciar el servidor:', error);
    process.exitCode = 1;
});

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

const app = express();
const server = http.createServer(app);
const allowedOrigins = [
    'https://inacaptechmarket.onrender.com',
    'capacitor://localhost',
    'http://localhost',
    'https://localhost',
    ...(process.env.FRONTEND_URL
        ? [process.env.FRONTEND_URL.replace(/\/+$/, '')]
        : [])
];
const corsMethods = ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'];
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: corsMethods
    }
});

app.set('io', io);
inicializarChat(io);

const PORT = process.env.PORT || 3000;

// Conexión MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log('MongoDB conectado');
})
.catch((error) => {
    console.log('Error MongoDB:', error);
});

const frontendDist = path.join(__dirname, '../frontend-react/dist');
app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Origen no permitido por CORS'));
    },
    methods: corsMethods,
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.static(frontendDist));
app.use(express.json());

app.use('/api/auth', authRoutes);

app.use('/api/productos', productoRoutes);

app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);

server.listen(PORT, () => {
    console.log(`Servidor iniciado en http://localhost:${PORT}`);
});

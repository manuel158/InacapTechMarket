require('dotenv').config();

const authRoutes =
require('./routes/authRoutes');

const productoRoutes =
require('./routes/productoRoutes');

const adminRoutes =
require('./routes/adminRoutes');

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');

const app = express();

const PORT = process.env.PORT || 3000;

// Conexión MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log('MongoDB conectado');
})
.catch((error) => {
    console.log('Error MongoDB:', error);
});

// Servir archivos estáticos desde frontend
app.use(express.static(path.join(__dirname, '../frontend')));
app.use(express.json());

app.use('/api/auth', authRoutes);

app.use('/api/productos', productoRoutes);

app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor iniciado en http://localhost:${PORT}`);
});

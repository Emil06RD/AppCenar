const mongoose = require('mongoose');

async function connectDB() {
    if (!process.env.MONGODB_URI) {
        console.warn('MONGODB_URI no esta configurado. La app iniciara sin conexion a MongoDB.');
        return false;
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS) || 5000,
        });
        console.log('MongoDB conectado correctamente');
        return true;
    } catch (error) {
        console.error('Error conectando MongoDB:', error.message);
        return false;
    }
}

module.exports = connectDB;

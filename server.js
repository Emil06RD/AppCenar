require('dotenv').config();
const connectDB = require('./src/config/db');
const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.locals.db = {
  connected: false,
};

app.listen(PORT, async () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);

  const dbConnected = await connectDB();
  app.locals.db.connected = dbConnected;

  if (!dbConnected) {
    console.warn('La app sigue corriendo, pero sin conexion a MongoDB.');
  }
});

const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema(
  {
    // Cliente que marcó el favorito
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El favorito debe estar asociado a un cliente'],
    },

    // Comercio marcado como favorito (usuario con rol 'commerce')
    commerce: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El favorito debe referenciar a un comercio'],
    },
  },
  {
    timestamps: true,
  }
);

// Evitar que el mismo cliente marque el mismo comercio más de una vez
favoriteSchema.index({ client: 1, commerce: 1 }, { unique: true });

const Favorite = mongoose.model('Favorite', favoriteSchema);

module.exports = Favorite;

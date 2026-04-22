const mongoose = require('mongoose');

const commerceTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre del tipo de comercio es obligatorio'],
      unique: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: null,
    },

    // Nombre de icono Bootstrap Icons (ej: 'bi-shop', 'bi-cup-hot')
    icon: {
      type: String,
      trim: true,
      default: 'bi-shop',
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const CommerceType = mongoose.model('CommerceType', commerceTypeSchema);

module.exports = CommerceType;

const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
  {
    // Cliente dueño de la dirección
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'La dirección debe estar asociada a un cliente'],
    },

    street: {
      type: String,
      required: [true, 'La calle es obligatoria'],
      trim: true,
    },

    city: {
      type: String,
      required: [true, 'La ciudad es obligatoria'],
      trim: true,
    },

    // Referencia o punto de referencia para encontrar la dirección
    reference: {
      type: String,
      trim: true,
      default: '',
    },

    // Solo una dirección puede ser la predeterminada por cliente
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

addressSchema.index({ client: 1 });

const Address = mongoose.model('Address', addressSchema);

module.exports = Address;

const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El pedido debe tener un cliente'],
    },

    commerce: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El pedido debe estar asociado a un comercio'],
    },

    // Repartidor asignado (se asigna cuando el comercio acepta el pedido)
    delivery: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Lista de productos del pedido
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: [1, 'La cantidad mínima es 1'],
        },
        // Precio al momento del pedido (por si el precio cambia después)
        unitPrice: {
          type: Number,
          required: true,
        },
      },
    ],

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    // ITBIS aplicado (porcentaje, ej: 0.18 para 18%)
    itbis: {
      type: Number,
      required: true,
      default: 0,
    },

    total: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ['pending', 'in_process', 'completed', 'cancelled'],
      default: 'pending',
    },

    // Dirección de entrega seleccionada por el cliente
    address: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Address',
      required: [true, 'El pedido debe tener una dirección de entrega'],
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ client: 1 });
orderSchema.index({ commerce: 1 });
orderSchema.index({ delivery: 1 });
orderSchema.index({ status: 1 });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;

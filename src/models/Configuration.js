const mongoose = require('mongoose');

const configurationSchema = new mongoose.Schema(
  {
    // Porcentaje de ITBIS (ej: 18 equivale a 18% = 0.18 en cálculos)
    itbis: {
      type: Number,
      required: [true, 'El valor del ITBIS es obligatorio'],
      min: [0, 'El ITBIS no puede ser negativo'],
      max: [100, 'El ITBIS no puede superar el 100%'],
      default: 18,
    },
  },
  {
    timestamps: true,
  }
);

const Configuration = mongoose.model('Configuration', configurationSchema);

module.exports = Configuration;

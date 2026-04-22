const mongoose = require('mongoose');

const commerceSchema = new mongoose.Schema(
  {
    // Dueño del comercio → rol 'commerce' en User
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El comercio debe estar asociado a un usuario'],
    },

    name: {
      type: String,
      required: [true, 'El nombre del comercio es obligatorio'],
      trim: true,
    },

    // Nombre del archivo de imagen (guardado en /public/uploads)
    logo: {
      type: String,
      default: 'default-logo.png',
    },

    // Formato: "HH:MM" — ej: "08:00"
    openingTime: {
      type: String,
      required: [true, 'El horario de apertura es obligatorio'],
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Formato de hora inválido (HH:MM)'],
    },

    // Formato: "HH:MM" — ej: "22:00"
    closingTime: {
      type: String,
      required: [true, 'El horario de cierre es obligatorio'],
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Formato de hora inválido (HH:MM)'],
    },

    // Tipo de comercio → referencia a CommerceType
    commerceType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CommerceType',
      required: [true, 'El tipo de comercio es obligatorio'],
    },

    // Estado: activo/inactivo controlado por admin
    isActive: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// ── Índices ───────────────────────────────────────────────────────────────────
commerceSchema.index({ user: 1 });
commerceSchema.index({ commerceType: 1 });
commerceSchema.index({ isActive: 1 });

const Commerce = mongoose.model('Commerce', commerceSchema);

module.exports = Commerce;

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
    },

    lastName: {
      type: String,
      required: [true, 'El apellido es obligatorio'],
      trim: true,
    },

    userName: {
      type: String,
      required: [true, 'El nombre de usuario es obligatorio'],
      unique: true,
      trim: true,
      lowercase: true,
    },

    email: {
      type: String,
      required: [true, 'El email es obligatorio'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Formato de email inválido'],
    },

    phone: {
      type: String,
      trim: true,
      default: null,
    },

    password: {
      type: String,
      required: [true, 'La contraseña es obligatoria'],
      minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
    },

    profileImage: {
      type: String,
      default: 'default-avatar.png',
    },

    role: {
      type: String,
      enum: ['client', 'delivery', 'commerce', 'admin'],
      default: 'client',
    },

    // Cuenta activa o desactivada por admin / sin verificar
    isActive: {
      type: Boolean,
      default: false,
    },

    // Solo relevante para rol 'commerce': aprobado por admin para aparecer en el listado
    isApproved: {
      type: Boolean,
      default: false,
    },

    // Token enviado por email para activar la cuenta
    activationToken: {
      type: String,
      default: null,
    },

    // Token para resetear contraseña + su expiración
    resetToken: {
      type: String,
      default: null,
    },
    resetTokenExpires: {
      type: Date,
      default: null,
    },

    // Solo relevante para rol 'delivery': indica si está disponible para tomar pedidos
    isAvailable: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // agrega createdAt y updatedAt automáticamente
  }
);

// ── Índices explícitos (unique ya crea índice, estos son extra) ───────────────
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// ── Método virtual: nombre completo ───────────────────────────────────────────
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

const User = mongoose.model('User', userSchema);

module.exports = User;

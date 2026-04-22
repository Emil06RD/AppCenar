const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre de la categoría es obligatorio'],
      trim: true,
    },

    // Comercio dueño de esta categoría
    commerce: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'La categoría debe pertenecer a un comercio'],
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

categorySchema.index({ commerce: 1 });
categorySchema.index({ isActive: 1 });

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;

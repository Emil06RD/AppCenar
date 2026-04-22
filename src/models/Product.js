const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre del producto es obligatorio'],
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: '',
    },

    price: {
      type: Number,
      required: [true, 'El precio es obligatorio'],
      min: [0, 'El precio no puede ser negativo'],
    },

    stock: {
      type: Number,
      required: [true, 'El stock es obligatorio'],
      min: [0, 'El stock no puede ser negativo'],
      default: 0,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'La categoria es obligatoria'],
    },

    // Usuario con rol 'commerce' dueño del producto
    commerce: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El producto debe pertenecer a un comercio'],
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

productSchema.index({ commerce: 1 });
productSchema.index({ category: 1 });
productSchema.index({ isActive: 1 });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;

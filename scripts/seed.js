require('dotenv').config();

const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

const connectDB = require('../src/config/db');
const User = require('../src/models/User');
const CommerceType = require('../src/models/CommerceType');
const Commerce = require('../src/models/Commerce');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');
const Address = require('../src/models/Address');
const Favorite = require('../src/models/Favorite');
const Configuration = require('../src/models/Configuration');
const Order = require('../src/models/Order');

const PASSWORD_PLAIN = 'Demo1234';

const seedBlueprint = {
  users: {
    admins: [
      {
        firstName: 'Alicia',
        lastName: 'Admin',
        userName: 'admin.alicia',
        email: 'admin.alicia@appcenar.dev',
        phone: '70010001',
        role: 'admin',
        isActive: true,
        isApproved: true,
        isAvailable: false,
      },
    ],
    clients: [
      {
        firstName: 'Carlos',
        lastName: 'Cliente',
        userName: 'cliente.carlos',
        email: 'cliente.carlos@appcenar.dev',
        phone: '70020001',
        role: 'client',
        isActive: true,
        isApproved: false,
        isAvailable: false,
      },
      {
        firstName: 'Lucia',
        lastName: 'Lopez',
        userName: 'cliente.lucia',
        email: 'cliente.lucia@appcenar.dev',
        phone: '70020002',
        role: 'client',
        isActive: true,
        isApproved: false,
        isAvailable: false,
      },
    ],
    deliveries: [
      {
        firstName: 'Diego',
        lastName: 'Delivery',
        userName: 'delivery.diego',
        email: 'delivery.diego@appcenar.dev',
        phone: '70030001',
        role: 'delivery',
        isActive: true,
        isApproved: false,
        isAvailable: false,
      },
      {
        firstName: 'Paula',
        lastName: 'Paquete',
        userName: 'delivery.paula',
        email: 'delivery.paula@appcenar.dev',
        phone: '70030002',
        role: 'delivery',
        isActive: true,
        isApproved: false,
        isAvailable: true,
      },
    ],
    commerces: [
      {
        firstName: 'Mario',
        lastName: 'Burger',
        userName: 'commerce.marioburger',
        email: 'commerce.marioburger@appcenar.dev',
        phone: '70040001',
        role: 'commerce',
        isActive: true,
        isApproved: true,
        isAvailable: false,
      },
      {
        firstName: 'Sofia',
        lastName: 'Cafe',
        userName: 'commerce.sofiacafe',
        email: 'commerce.sofiacafe@appcenar.dev',
        phone: '70040002',
        role: 'commerce',
        isActive: true,
        isApproved: true,
        isAvailable: false,
      },
      {
        firstName: 'Pedro',
        lastName: 'Pizza',
        userName: 'commerce.pedropizza',
        email: 'commerce.pedropizza@appcenar.dev',
        phone: '70040003',
        role: 'commerce',
        isActive: true,
        isApproved: true,
        isAvailable: false,
      },
    ],
  },
  commerceTypes: [
    { name: 'Hamburguesas', description: 'Locales de hamburguesas artesanales', icon: 'bi-shop', isActive: true },
    { name: 'Cafe', description: 'Cafeterias y reposteria ligera', icon: 'bi-cup-hot', isActive: true },
    { name: 'Pizza', description: 'Pizzerias y hornos rapidos', icon: 'bi-disc', isActive: true },
  ],
};

function roundMoney(value) {
  return Number(value.toFixed(2));
}

async function upsertUser(userData, hashedPassword) {
  const payload = {
    ...userData,
    password: hashedPassword,
    activationToken: null,
    resetToken: null,
    resetTokenExpires: null,
    profileImage: 'default-avatar.png',
  };

  const user = await User.findOneAndUpdate(
    { email: userData.email.toLowerCase() },
    { $set: payload },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
  );

  return user;
}

async function upsertCommerceType(typeData) {
  return CommerceType.findOneAndUpdate(
    { name: typeData.name },
    { $set: typeData },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
  );
}

async function upsertCommerce(commerceData) {
  return Commerce.findOneAndUpdate(
    { user: commerceData.user },
    { $set: commerceData },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
  );
}

async function main() {
  const connected = await connectDB();

  if (!connected) {
    throw new Error('No se pudo conectar a MongoDB. Verifica MONGODB_URI y acceso a la base.');
  }

  const hashedPassword = await bcrypt.hash(PASSWORD_PLAIN, 10);

  const summary = {
    users: 0,
    commerceTypes: 0,
    commerces: 0,
    categories: 0,
    products: 0,
    addresses: 0,
    favorites: 0,
    configuration: 0,
    orders: 0,
    cleaned: {},
  };

  const seededUsers = {};

  for (const group of Object.values(seedBlueprint.users)) {
    for (const userData of group) {
      const user = await upsertUser(userData, hashedPassword);
      seededUsers[userData.userName] = user;
      summary.users += 1;
    }
  }

  const commerceTypes = {};
  for (const typeData of seedBlueprint.commerceTypes) {
    const type = await upsertCommerceType(typeData);
    commerceTypes[typeData.name] = type;
    summary.commerceTypes += 1;
  }

  const commerceRecords = [
    {
      key: 'commerce.marioburger',
      name: 'Mario Burger House',
      logo: 'default-logo.png',
      openingTime: '11:00',
      closingTime: '23:00',
      commerceType: commerceTypes.Hamburguesas._id,
      isActive: true,
    },
    {
      key: 'commerce.sofiacafe',
      name: 'Sofia Cafe Corner',
      logo: 'default-logo.png',
      openingTime: '07:30',
      closingTime: '20:00',
      commerceType: commerceTypes.Cafe._id,
      isActive: true,
    },
    {
      key: 'commerce.pedropizza',
      name: 'Pedro Pizza Lab',
      logo: 'default-logo.png',
      openingTime: '12:00',
      closingTime: '23:30',
      commerceType: commerceTypes.Pizza._id,
      isActive: true,
    },
  ];

  const seededCommerces = {};
  for (const commerceRecord of commerceRecords) {
    const commerce = await upsertCommerce({
      user: seededUsers[commerceRecord.key]._id,
      name: commerceRecord.name,
      logo: commerceRecord.logo,
      openingTime: commerceRecord.openingTime,
      closingTime: commerceRecord.closingTime,
      commerceType: commerceRecord.commerceType,
      isActive: commerceRecord.isActive,
    });
    seededCommerces[commerceRecord.key] = commerce;
    summary.commerces += 1;
  }

  const seededCommerceUserIds = Object.values(seededCommerces).map((commerce) => commerce.user);
  const seededClientIds = seedBlueprint.users.clients.map((user) => seededUsers[user.userName]._id);

  summary.cleaned.categories = (await Category.deleteMany({ commerce: { $in: seededCommerceUserIds } })).deletedCount;
  summary.cleaned.products = (await Product.deleteMany({ commerce: { $in: seededCommerceUserIds } })).deletedCount;
  summary.cleaned.addresses = (await Address.deleteMany({ client: { $in: seededClientIds } })).deletedCount;
  summary.cleaned.favorites = (await Favorite.deleteMany({
    $or: [
      { client: { $in: seededClientIds } },
      { commerce: { $in: seededCommerceUserIds } },
    ],
  })).deletedCount;
  summary.cleaned.orders = (await Order.deleteMany({
    $or: [
      { client: { $in: seededClientIds } },
      { commerce: { $in: seededCommerceUserIds } },
      { delivery: { $in: seedBlueprint.users.deliveries.map((user) => seededUsers[user.userName]._id) } },
    ],
  })).deletedCount;

  const categorySpecs = [
    { commerceKey: 'commerce.marioburger', name: 'Smash Burgers', isActive: true },
    { commerceKey: 'commerce.marioburger', name: 'Combos', isActive: true },
    { commerceKey: 'commerce.sofiacafe', name: 'Cafes', isActive: true },
    { commerceKey: 'commerce.sofiacafe', name: 'Pasteleria', isActive: true },
    { commerceKey: 'commerce.pedropizza', name: 'Pizzas Clasicas', isActive: true },
    { commerceKey: 'commerce.pedropizza', name: 'Entradas', isActive: true },
  ];

  const seededCategories = {};
  for (const spec of categorySpecs) {
    const category = await Category.create({
      name: spec.name,
      commerce: seededUsers[spec.commerceKey]._id,
      isActive: spec.isActive,
    });
    seededCategories[`${spec.commerceKey}:${spec.name}`] = category;
    summary.categories += 1;
  }

  const productSpecs = [
    {
      commerceKey: 'commerce.marioburger',
      categoryName: 'Smash Burgers',
      name: 'Smash Clasica',
      description: 'Pan brioche, doble carne y cheddar',
      price: 32,
      stock: 25,
      isActive: true,
    },
    {
      commerceKey: 'commerce.marioburger',
      categoryName: 'Smash Burgers',
      name: 'Bacon Melt',
      description: 'Hamburguesa con bacon crocante y salsa especial',
      price: 38,
      stock: 18,
      isActive: true,
    },
    {
      commerceKey: 'commerce.marioburger',
      categoryName: 'Combos',
      name: 'Combo Mario',
      description: 'Hamburguesa, papas y bebida',
      price: 48,
      stock: 14,
      isActive: true,
    },
    {
      commerceKey: 'commerce.sofiacafe',
      categoryName: 'Cafes',
      name: 'Latte Vainilla',
      description: 'Cafe espresso con leche vaporizada y vainilla',
      price: 18,
      stock: 30,
      isActive: true,
    },
    {
      commerceKey: 'commerce.sofiacafe',
      categoryName: 'Pasteleria',
      name: 'Cheesecake de frutos rojos',
      description: 'Porcion individual de cheesecake',
      price: 22,
      stock: 12,
      isActive: true,
    },
    {
      commerceKey: 'commerce.pedropizza',
      categoryName: 'Pizzas Clasicas',
      name: 'Pizza Pepperoni Mediana',
      description: 'Masa artesanal y pepperoni clasico',
      price: 54,
      stock: 16,
      isActive: true,
    },
    {
      commerceKey: 'commerce.pedropizza',
      categoryName: 'Entradas',
      name: 'Palitos de ajo',
      description: 'Palitos horneados con mantequilla de ajo',
      price: 16,
      stock: 20,
      isActive: true,
    },
  ];

  const seededProducts = {};
  for (const spec of productSpecs) {
    const product = await Product.create({
      name: spec.name,
      description: spec.description,
      price: spec.price,
      stock: spec.stock,
      category: seededCategories[`${spec.commerceKey}:${spec.categoryName}`]._id,
      commerce: seededUsers[spec.commerceKey]._id,
      isActive: spec.isActive,
    });
    seededProducts[spec.name] = product;
    summary.products += 1;
  }

  const addressSpecs = [
    {
      clientKey: 'cliente.carlos',
      street: 'Av. Busch 123',
      city: 'Santa Cruz',
      reference: 'Edificio naranja, piso 2',
      isDefault: true,
    },
    {
      clientKey: 'cliente.carlos',
      street: 'Calle Aroma 88',
      city: 'Santa Cruz',
      reference: 'Casa blanca con porton negro',
      isDefault: false,
    },
    {
      clientKey: 'cliente.lucia',
      street: 'Av. San Martin 456',
      city: 'Santa Cruz',
      reference: 'Frente a la plaza',
      isDefault: true,
    },
  ];

  const seededAddresses = {};
  for (const spec of addressSpecs) {
    const address = await Address.create({
      client: seededUsers[spec.clientKey]._id,
      street: spec.street,
      city: spec.city,
      reference: spec.reference,
      isDefault: spec.isDefault,
    });
    seededAddresses[`${spec.clientKey}:${spec.street}`] = address;
    summary.addresses += 1;
  }

  const favoriteSpecs = [
    { clientKey: 'cliente.carlos', commerceKey: 'commerce.marioburger' },
    { clientKey: 'cliente.carlos', commerceKey: 'commerce.sofiacafe' },
    { clientKey: 'cliente.lucia', commerceKey: 'commerce.pedropizza' },
  ];

  for (const spec of favoriteSpecs) {
    await Favorite.create({
      client: seededUsers[spec.clientKey]._id,
      commerce: seededUsers[spec.commerceKey]._id,
    });
    summary.favorites += 1;
  }

  await Configuration.findOneAndUpdate(
    {},
    { $set: { itbis: 18 } },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
  );
  summary.configuration = 1;

  const itbisPercent = 18;

  function buildOrderLines(items) {
    const lines = items.map((item) => ({
      product: seededProducts[item.productName]._id,
      quantity: item.quantity,
      unitPrice: seededProducts[item.productName].price,
    }));

    const subtotal = roundMoney(lines.reduce((sum, line) => sum + (line.unitPrice * line.quantity), 0));
    const itbis = roundMoney(subtotal * (itbisPercent / 100));
    const total = roundMoney(subtotal + itbis);

    return { lines, subtotal, itbis, total };
  }

  const orderSpecs = [
    {
      clientKey: 'cliente.carlos',
      commerceKey: 'commerce.marioburger',
      deliveryKey: null,
      addressKey: 'cliente.carlos:Av. Busch 123',
      status: 'pending',
      items: [
        { productName: 'Smash Clasica', quantity: 2 },
        { productName: 'Combo Mario', quantity: 1 },
      ],
    },
    {
      clientKey: 'cliente.lucia',
      commerceKey: 'commerce.pedropizza',
      deliveryKey: 'delivery.diego',
      addressKey: 'cliente.lucia:Av. San Martin 456',
      status: 'in_process',
      items: [
        { productName: 'Pizza Pepperoni Mediana', quantity: 1 },
        { productName: 'Palitos de ajo', quantity: 2 },
      ],
    },
    {
      clientKey: 'cliente.carlos',
      commerceKey: 'commerce.sofiacafe',
      deliveryKey: 'delivery.paula',
      addressKey: 'cliente.carlos:Calle Aroma 88',
      status: 'completed',
      items: [
        { productName: 'Latte Vainilla', quantity: 2 },
        { productName: 'Cheesecake de frutos rojos', quantity: 1 },
      ],
    },
    {
      clientKey: 'cliente.lucia',
      commerceKey: 'commerce.marioburger',
      deliveryKey: null,
      addressKey: 'cliente.lucia:Av. San Martin 456',
      status: 'cancelled',
      items: [
        { productName: 'Bacon Melt', quantity: 1 },
      ],
    },
  ];

  for (const spec of orderSpecs) {
    const { lines, subtotal, itbis, total } = buildOrderLines(spec.items);

    await Order.create({
      client: seededUsers[spec.clientKey]._id,
      commerce: seededUsers[spec.commerceKey]._id,
      delivery: spec.deliveryKey ? seededUsers[spec.deliveryKey]._id : null,
      products: lines,
      subtotal,
      itbis,
      total,
      status: spec.status,
      address: seededAddresses[spec.addressKey]._id,
    });

    summary.orders += 1;
  }

  await User.findByIdAndUpdate(seededUsers['delivery.diego']._id, { $set: { isAvailable: false } });
  await User.findByIdAndUpdate(seededUsers['delivery.paula']._id, { $set: { isAvailable: true } });

  console.log('\nSeed completado correctamente.\n');
  console.log(`Password demo para todos los usuarios: ${PASSWORD_PLAIN}`);
  console.log('Resumen:');
  console.log(`- Usuarios preparados: ${summary.users}`);
  console.log(`- Tipos de comercio: ${summary.commerceTypes}`);
  console.log(`- Comercios: ${summary.commerces}`);
  console.log(`- Categorias: ${summary.categories}`);
  console.log(`- Productos: ${summary.products}`);
  console.log(`- Direcciones: ${summary.addresses}`);
  console.log(`- Favoritos: ${summary.favorites}`);
  console.log(`- Configuracion: ${summary.configuration}`);
  console.log(`- Pedidos: ${summary.orders}`);
  console.log('Limpieza previa sobre datos demo:');
  Object.entries(summary.cleaned).forEach(([key, value]) => {
    console.log(`- ${key}: ${value}`);
  });
}

main()
  .catch((error) => {
    console.error('\nError ejecutando seed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });

const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

async function check() {
  await mongoose.connect(MONGODB_URI);
  const Shop = mongoose.connection.collection("shops");
  const Product = mongoose.connection.collection("products");
  const Category = mongoose.connection.collection("categories");

  const shops = await Shop.find({}).toArray();
  const products = await Product.find({}).toArray();
  const categories = await Category.find({}).toArray();

  console.log(`=== SHOPS (${shops.length}) ===`);
  shops.forEach(s => {
    console.log(`ID: ${s._id}, Name: ${s.name}, Slug: ${s.slug}, Image: ${s.image || "NONE"}, isActive: ${s.isActive}`);
  });

  console.log(`\n=== CATEGORIES (${categories.length}) ===`);
  categories.forEach(c => {
    console.log(`Name: ${c.name}, Slug: ${c.slug}, Image: ${c.image || "NONE"}`);
  });

  console.log(`\n=== PRODUCTS (${products.length}) ===`);
  const productsWithShop = products.filter(p => p.shopId);
  const productsWithoutShop = products.filter(p => !p.shopId);
  console.log(`Products WITH shopId: ${productsWithShop.length}`);
  console.log(`Products WITHOUT shopId: ${productsWithoutShop.length}`);

  // Sample products shopId format
  const sampleShops = productsWithShop.map(p => ({ id: p._id, name: p.name, shopId: p.shopId, shopIdType: typeof p.shopId }));
  console.log("Sample product shopIds:", sampleShops.slice(0, 10));

  await mongoose.disconnect();
}

check().catch(console.error);

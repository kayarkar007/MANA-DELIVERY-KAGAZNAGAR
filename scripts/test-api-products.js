const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

async function testQuery() {
  await mongoose.connect(MONGODB_URI);
  const Product = mongoose.connection.collection("products");

  const shopIdStr = "6a6f177cf1445c75a77d4e7e";
  
  // Test query 1: with ObjectId
  const q1 = { isHidden: { $ne: true }, shopId: new mongoose.Types.ObjectId(shopIdStr) };
  const res1 = await Product.find(q1).toArray();
  console.log(`Query with ObjectId shopId: found ${res1.length} products`);

  // Test query 2: with String shopId
  const q2 = { isHidden: { $ne: true }, shopId: shopIdStr };
  const res2 = await Product.find(q2).toArray();
  console.log(`Query with String shopId: found ${res2.length} products`);

  // Test query 3: check isHidden field on products
  const sample = await Product.find({}).limit(5).toArray();
  console.log("Sample products isHidden values:", sample.map(p => ({ id: p._id, name: p.name, isHidden: p.isHidden, shopId: p.shopId, categorySlug: p.categorySlug })));

  await mongoose.disconnect();
}

testQuery().catch(console.error);

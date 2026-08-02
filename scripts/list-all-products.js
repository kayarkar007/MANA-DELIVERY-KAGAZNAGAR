const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
  await mongoose.connect(MONGODB_URI);
  const Product = mongoose.connection.collection("products");
  const products = await Product.find({}).toArray();

  console.log(`TOTAL_PRODUCTS=${products.length}`);

  const itemSummary = products.map(p => ({
    name: p.name,
    categorySlug: p.categorySlug,
    image: p.image || null
  }));

  console.log(JSON.stringify(itemSummary));
  await mongoose.disconnect();
}

run().catch(console.error);

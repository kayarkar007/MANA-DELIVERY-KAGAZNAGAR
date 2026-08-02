const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI is not defined");
  process.exit(1);
}

async function inspect() {
  await mongoose.connect(MONGODB_URI);
  const Product = mongoose.connection.collection("products");
  const products = await Product.find({}).toArray();
  console.log(`Total Products in DB: ${products.length}`);
  
  const report = products.map((p) => ({
    id: p._id.toString(),
    name: p.name,
    categorySlug: p.categorySlug,
    image: p.image || "NO_IMAGE",
  }));

  console.log(JSON.stringify(report, null, 2));
  await mongoose.disconnect();
}

inspect().catch((err) => {
  console.error(err);
  process.exit(1);
});

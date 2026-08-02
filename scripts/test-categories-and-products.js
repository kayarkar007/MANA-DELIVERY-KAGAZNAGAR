const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

async function test() {
  await mongoose.connect(MONGODB_URI);
  const Product = mongoose.connection.collection("products");
  const Category = mongoose.connection.collection("categories");
  const Shop = mongoose.connection.collection("shops");

  const distinctSlugs = await Product.distinct("categorySlug", { isHidden: { $ne: true } });
  console.log("Distinct categorySlugs in products:", distinctSlugs);

  const categories = await Category.find({ slug: { $in: distinctSlugs } }).toArray();
  console.log(`Found ${categories.length} matching categories in Categories collection.`);

  const allCategories = await Category.find({}).toArray();
  console.log(`Total categories in DB: ${allCategories.length}`);

  const categorySlugsInDB = allCategories.map(c => c.slug);
  console.log("All category slugs in DB:", categorySlugsInDB);

  // Check mismatch between product categorySlug and Category slug
  const missingCategories = distinctSlugs.filter(s => !categorySlugsInDB.includes(s));
  console.log("Product categorySlugs NOT present in Categories collection:", missingCategories);

  // Check shop active status
  const shops = await Shop.find({}).toArray();
  console.log("Shops:", shops);

  await mongoose.disconnect();
}

test().catch(console.error);

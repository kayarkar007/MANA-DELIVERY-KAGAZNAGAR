const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

async function sync() {
  await mongoose.connect(MONGODB_URI);
  const Product = mongoose.connection.collection("products");
  const Category = mongoose.connection.collection("categories");
  const Shop = mongoose.connection.collection("shops");

  const shop = await Shop.findOne({ slug: "relax-bar-restaurant" });
  if (!shop) {
    console.error("❌ Shop 'relax-bar-restaurant' not found!");
    process.exit(1);
  }

  console.log(`Found Shop: ${shop.name} (_id: ${shop._id})`);

  // Ensure all products are unhidden, in-stock, and linked to the active shop
  const productResult = await Product.updateMany(
    {},
    {
      $set: {
        shopId: shop._id,
        isHidden: false,
        inStock: true,
      }
    }
  );
  console.log(`Updated ${productResult.modifiedCount} products (linked shopId, unhidden, inStock).`);

  // Re-verify counts
  const totalProducts = await Product.countDocuments({ isHidden: { $ne: true }, shopId: shop._id });
  const totalCategories = await Category.countDocuments({});

  console.log("=== FINAL STATUS ===");
  console.log(`Active Shop ID: ${shop._id}`);
  console.log(`Visible Products Count for Shop: ${totalProducts}`);
  console.log(`Total Categories Count: ${totalCategories}`);

  await mongoose.disconnect();
}

sync().catch(console.error);

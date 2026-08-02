const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

async function verify() {
  await mongoose.connect(MONGODB_URI);
  const Product = mongoose.connection.collection("products");
  const products = await Product.find({}).toArray();

  let invalidCount = 0;
  let missingCount = 0;

  for (const p of products) {
    if (!p.image || typeof p.image !== "string" || !p.image.trim()) {
      console.error(`❌ Product "${p.name}" has MISSING image.`);
      missingCount++;
    } else if (p.image.includes("unsplash.com/photos/")) {
      console.error(`❌ Product "${p.name}" has WEBPAGE URL: ${p.image}`);
      invalidCount++;
    } else if (!p.image.startsWith("http")) {
      console.error(`❌ Product "${p.name}" has INVALID URL format: ${p.image}`);
      invalidCount++;
    }
  }

  console.log("--- VERIFICATION RESULT ---");
  console.log(`Total Products: ${products.length}`);
  console.log(`Missing Image Count: ${missingCount}`);
  console.log(`Invalid Image URL Count: ${invalidCount}`);

  if (missingCount === 0 && invalidCount === 0) {
    console.log("✅ ALL PRODUCT IMAGES ARE 100% VALID AND PROPERLY FORMATTED!");
  } else {
    console.error("⚠️ Some products still need fixes.");
  }

  await mongoose.disconnect();
}

verify().catch((err) => {
  console.error(err);
  process.exit(1);
});

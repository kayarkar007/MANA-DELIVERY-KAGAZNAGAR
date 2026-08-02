const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

const saladImageUrl = "https://plus.unsplash.com/premium_photo-1726718553052-aa6514f8bbb1?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjF8fHNhbGFkfGVufDB8MnwwfHx8MA%3D%3D";

async function updateSalad() {
  await mongoose.connect(MONGODB_URI);
  const Category = mongoose.connection.collection("categories");

  const res = await Category.updateOne(
    { slug: "salad" },
    { $set: { image: saladImageUrl } }
  );

  console.log(`Updated Salad Category in DB. Matched: ${res.matchedCount}, Modified: ${res.modifiedCount}`);

  const updatedDoc = await Category.findOne({ slug: "salad" });
  console.log("Updated Salad Category Doc:", updatedDoc);

  await mongoose.disconnect();
}

updateSalad().catch(console.error);

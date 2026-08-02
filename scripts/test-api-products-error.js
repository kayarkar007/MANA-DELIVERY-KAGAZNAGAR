const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

// Import models
const shopSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  address: { type: String, required: true },
  locationUrl: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
  ownerName: { type: String, required: true },
  phone: { type: String, required: true },
  image: { type: String },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: false },
  description: { type: String, required: false },
  price: { type: Number, required: true },
  unit: { type: String, required: true },
  categorySlug: { type: String, required: true },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: false },
  inStock: { type: Boolean, default: true },
  stockQuantity: { type: Number, default: 10, min: 0 },
  lowStockThreshold: { type: Number, default: 5, min: 0 },
  image: { type: String, required: false },
  isHidden: { type: Boolean, default: false },
}, { timestamps: true });

const Shop = mongoose.models.Shop || mongoose.model("Shop", shopSchema);
const Product = mongoose.models.Product || mongoose.model("Product", productSchema);

async function run() {
  await mongoose.connect(MONGODB_URI);

  const shopId = "6a6f177cf1445c75a77d4e7e";
  let query = { isHidden: { $ne: true } };

  if (shopId) {
    if (mongoose.Types.ObjectId.isValid(shopId)) {
      query.shopId = new mongoose.Types.ObjectId(shopId);
    } else {
      query.shopId = shopId;
    }
  }

  console.log("Query:", query);

  try {
    const [total, products] = await Promise.all([
      Product.countDocuments(query).maxTimeMS(8_000),
      Product.find(query)
        .populate("shopId", "name slug image isActive")
        .sort({ createdAt: -1 })
        .skip(0)
        .limit(50)
        .maxTimeMS(8_000)
        .lean(),
    ]);

    console.log("Total:", total);
    console.log("Products count:", products.length);
    if (products.length > 0) {
      console.log("First product:", products[0]);
    }
  } catch (err) {
    console.error("API Query Error:", err);
  }

  await mongoose.disconnect();
}

run().catch(console.error);

/**
 * 🍽️ RELAX BAR & RESTAURANT — Complete Database Seed Script
 *
 * Actions:
 *   1. Clears ALL existing shops, products, and categories
 *   2. Creates restaurant categories (menu sections)
 *   3. Creates the Relax Bar & Restaurant shop
 *   4. Seeds all 130+ menu items from both menu pages with:
 *      - Accurate pricing (Non A/C price used as base)
 *      - Beautiful Unsplash dish images
 *      - Proper slugs, descriptions, and stock settings
 *
 * Run: node scripts/seed-relax-restaurant.mjs
 */

import mongoose from "mongoose";
import { createRequire } from "module";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
const envPath = join(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not found in .env.local");
  process.exit(1);
}

// ─── Inline Schemas (no TS compile needed) ───────────────────────────────────

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    type: { type: String, enum: ["product", "service"], required: true },
    image: { type: String },
  },
  { timestamps: true }
);

const ShopSchema = new mongoose.Schema(
  {
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
  },
  { timestamps: true }
);

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String },
    description: { type: String },
    price: { type: Number, required: true },
    unit: { type: String, required: true },
    categorySlug: { type: String, required: true },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop" },
    inStock: { type: Boolean, default: true },
    stockQuantity: { type: Number, default: 99 },
    lowStockThreshold: { type: Number, default: 10 },
    image: { type: String },
    isHidden: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Text search index
ProductSchema.index({ name: "text", categorySlug: 1 });
ProductSchema.index({ slug: 1 });
ProductSchema.index({ isHidden: 1, categorySlug: 1 });
ProductSchema.index({ isHidden: 1, shopId: 1, createdAt: -1 });

const Category = mongoose.models.Category || mongoose.model("Category", CategorySchema);
const Shop = mongoose.models.Shop || mongoose.model("Shop", ShopSchema);
const Product = mongoose.models.Product || mongoose.model("Product", ProductSchema);

// ─── Helper: slugify ──────────────────────────────────────────────────────────
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

// ─── Categories ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    name: "Mutton Curries",
    slug: "mutton-curries",
    image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&q=80&w=400",
  },
  {
    name: "Chicken Curries",
    slug: "chicken-curries",
    image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&q=80&w=400",
  },
  {
    name: "Fish Curries",
    slug: "fish-curries",
    image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&q=80&w=400",
  },
  {
    name: "Veg Curries",
    slug: "veg-curries",
    image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=400",
  },
  {
    name: "Biryani Veg",
    slug: "biryani-veg",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=400",
  },
  {
    name: "Biryani Non-Veg",
    slug: "biryani-non-veg",
    image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&q=80&w=400",
  },
  {
    name: "Veg & Fried Rice",
    slug: "veg-fried-rice",
    image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&q=80&w=400",
  },
  {
    name: "Rice Non-Veg",
    slug: "rice-non-veg",
    image: "https://images.unsplash.com/photo-1596560548464-f010549b84d7?auto=format&fit=crop&q=80&w=400",
  },
  {
    name: "Curries",
    slug: "curries",
    image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=400",
  },
  {
    name: "Salad",
    slug: "salad",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=400",
  },
  {
    name: "Roti & Bread",
    slug: "roti-bread",
    image: "https://images.unsplash.com/photo-1565992441121-4367571b43ca?auto=format&fit=crop&q=80&w=400",
  },
  {
    name: "Egg Starters",
    slug: "egg-starters",
    image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&q=80&w=400",
  },
  {
    name: "Egg Curries",
    slug: "egg-curries",
    image: "https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&q=80&w=400",
  },
  {
    name: "Veg Starters",
    slug: "veg-starters",
    image: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&q=80&w=400",
  },
  {
    name: "Non-Veg Starters (Chicken)",
    slug: "non-veg-starters-chicken",
    image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&q=80&w=400",
  },
  {
    name: "Non-Veg Starters (Fish & Prawns)",
    slug: "non-veg-starters-fish-prawns",
    image: "https://images.unsplash.com/photo-1565299543923-37dd37887442?auto=format&fit=crop&q=80&w=400",
  },
  {
    name: "Tandoori Starters",
    slug: "tandoori-starters",
    image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&q=80&w=400",
  },
  {
    name: "Family Pack & Biryanies",
    slug: "family-pack-biryanies",
    image: "https://images.unsplash.com/photo-1571197119738-c0f8f4d11cd4?auto=format&fit=crop&q=80&w=400",
  },
];

// ─── Shop Data ────────────────────────────────────────────────────────────────
const RESTAURANT = {
  name: "Relax Bar & Restaurant",
  slug: "relax-bar-restaurant",
  description: "Premium multi-cuisine restaurant serving authentic Mutton, Chicken, Fish curries, Biryani, Tandoori starters and more. Quality food at affordable prices in Kagaznagar.",
  address: "Kagaznagar, Mancherial District, Telangana 504296",
  locationUrl: "https://maps.google.com/?q=Kagaznagar+Mancherial",
  latitude: 19.3315,
  longitude: 79.4828,
  ownerName: "Relax Restaurant Owner",
  phone: "9494378247",
  image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800",
  isActive: true,
};

// ─── Menu Items (price = Non A/C price, all 130+ dishes) ─────────────────────
// Format: [name, price, categorySlug, description, imageUrl]
const MENU_ITEMS = [
  // ──── MUTTON CURRIES ────
  ["Mutton Curry", 310, "mutton-curries", "Rich and spicy mutton curry slow-cooked with aromatic spices", "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&q=80&w=400"],
  ["Mutton Masala", 320, "mutton-curries", "Flavourful mutton cooked in thick masala gravy with onions and tomatoes", "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&q=80&w=400"],
  ["Punjabi Mutton", 320, "mutton-curries", "Punjabi-style mutton cooked in rich creamy gravy with whole spices", "https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fit=crop&q=80&w=400"],
  ["Mutton Kali Mirchi", 320, "mutton-curries", "Mutton cooked with fresh black pepper and aromatic spices", "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&q=80&w=400"],
  ["Kadai Mutton", 330, "mutton-curries", "Succulent mutton cooked in a traditional kadai with bell peppers and spices", "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&q=80&w=400"],

  // ──── CHICKEN CURRIES ────
  ["Chicken Curry (Bone)", 260, "chicken-curries", "Classic bone-in chicken curry with traditional South Indian spices", "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&q=80&w=400"],
  ["Chicken Curry (Boneless)", 280, "chicken-curries", "Tender boneless chicken pieces cooked in rich curry gravy", "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&q=80&w=400"],
  ["Butter Chicken", 290, "chicken-curries", "Creamy and mildly spiced butter chicken in velvety tomato sauce", "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&q=80&w=400"],
  ["Telangana Chicken", 280, "chicken-curries", "Authentic Telangana-style spicy chicken curry with local spices", "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&q=80&w=400"],
  ["Andhra Chicken", 280, "chicken-curries", "Fiery Andhra-style chicken curry with red chillies and tamarind", "https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fit=crop&q=80&w=400"],
  ["Punjabi Chicken", 280, "chicken-curries", "Rich Punjabi chicken curry with aromatic spices and thick gravy", "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&q=80&w=400"],
  ["Chicken Kolapuri", 280, "chicken-curries", "Spicy Kolhapuri chicken with dry coconut and hot spices", "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&q=80&w=400"],
  ["Chicken Masala", 280, "chicken-curries", "Chicken cooked in flavourful masala with onion and tomato base", "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&q=80&w=400"],
  ["Kadai Chicken", 280, "chicken-curries", "Chicken cooked in traditional kadai with capsicum and aromatic spices", "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&q=80&w=400"],
  ["Ginger Chicken", 280, "chicken-curries", "Aromatic chicken curry with fresh ginger and green chillies", "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&q=80&w=400"],
  ["Chicken Tikka Masala", 280, "chicken-curries", "Grilled tikka chicken pieces in spiced creamy masala gravy", "https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fit=crop&q=80&w=400"],
  ["Leg Kabab Masala", 260, "chicken-curries", "Juicy chicken leg pieces cooked in kabab masala sauce", "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&q=80&w=400"],
  ["Thangdi Kabab Masala (Half)", 290, "chicken-curries", "Half portion of tender leg kabab pieces in rich masala", "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&q=80&w=400"],
  ["Thangdi Kabab Masala (Full)", 380, "chicken-curries", "Full portion of tender leg kabab pieces in rich masala", "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&q=80&w=400"],
  ["Tandoori Chicken Masala (Half)", 380, "chicken-curries", "Half tandoori chicken cooked in spiced masala gravy", "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&q=80&w=400"],
  ["Tandoori Chicken Masala (Full)", 580, "chicken-curries", "Full tandoori chicken cooked in spiced masala gravy", "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&q=80&w=400"],

  // ──── FISH CURRIES ────
  ["Fish Curry", 270, "fish-curries", "Traditional fish curry with tangy tamarind and aromatic spices", "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&q=80&w=400"],
  ["Fish Masala", 280, "fish-curries", "Fresh fish cooked in thick, spicy masala gravy", "https://images.unsplash.com/photo-1565299543923-37dd37887442?auto=format&fit=crop&q=80&w=400"],
  ["Kadai Fish", 280, "fish-curries", "Fish cooked in traditional kadai with onions and peppers", "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&q=80&w=400"],
  ["Fish Fry (Semi Gravy)", 270, "fish-curries", "Crispy fried fish served with a semi-dry spiced gravy", "https://images.unsplash.com/photo-1565299543923-37dd37887442?auto=format&fit=crop&q=80&w=400"],
  ["Prawns Curry", 290, "fish-curries", "Succulent prawns cooked in spiced coconut curry gravy", "https://images.unsplash.com/photo-1565299543923-37dd37887442?auto=format&fit=crop&q=80&w=400"],

  // ──── VEG CURRIES ────
  ["Gravy Fry", 80, "veg-curries", "Light vegetable gravy fry with spices", "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=400"],
  ["Mixed Veg Curry", 200, "veg-curries", "A medley of seasonal vegetables in rich curry sauce", "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=400"],
  ["Tomato Curry", 200, "veg-curries", "Tangy tomato-based curry with Indian spices", "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=400"],
  ["Palak Paneer", 260, "veg-curries", "Fresh paneer cubes in creamy spinach gravy", "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&q=80&w=400"],
  ["Alu Palak", 210, "veg-curries", "Potato and spinach cooked in spiced gravy", "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=400"],
  ["Paneer Butter Masala", 260, "veg-curries", "Soft paneer in rich, creamy buttery tomato gravy", "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&q=80&w=400"],
  ["Kadai Paneer", 270, "veg-curries", "Paneer cooked in kadai with colourful capsicum and spices", "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&q=80&w=400"],
  ["Kaju Paneer", 300, "veg-curries", "Cashew and paneer in rich creamy gravy", "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&q=80&w=400"],
  ["Paneer Shaikurma", 270, "veg-curries", "Paneer cooked in shahi korma style cream sauce", "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&q=80&w=400"],
  ["Malai Koftha", 260, "veg-curries", "Soft kofta dumplings in rich creamy malai gravy", "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=400"],
  ["Tomato Paneer", 260, "veg-curries", "Paneer cubes in tangy tomato masala gravy", "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&q=80&w=400"],
  ["Alu Gobi Fry", 200, "veg-curries", "Dry potato and cauliflower stir fry with cumin and spices", "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=400"],
  ["Mushroom Curry", 260, "veg-curries", "Fresh mushrooms cooked in spiced onion-tomato gravy", "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=400"],

  // ──── BIRYANI VEG ────
  ["Veg Biryani", 260, "biryani-veg", "Fragrant basmati rice cooked with fresh vegetables and biryani spices", "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=400"],
  ["Paneer Biryani", 270, "biryani-veg", "Aromatic biryani with soft paneer cubes and saffron rice", "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=400"],
  ["Kaju Biryani", 280, "biryani-veg", "Royal biryani with cashews and premium spices", "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=400"],
  ["Biryani Rice", 200, "biryani-veg", "Plain biryani flavoured rice — perfect as a side", "https://images.unsplash.com/photo-1603603961473-5b7ffc66ef76?auto=format&fit=crop&q=80&w=400"],
  ["Alu Biryani", 230, "biryani-veg", "Spiced potato biryani with fragrant basmati rice", "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=400"],
  ["Veg Biryani Family Pack (3 Members)", 570, "biryani-veg", "Large family serving of veg biryani for 3 members", "https://images.unsplash.com/photo-1571197119738-c0f8f4d11cd4?auto=format&fit=crop&q=80&w=400"],

  // ──── BIRYANI NON-VEG ────
  ["Single Chicken Dum Biryani", 180, "biryani-non-veg", "Single-serving chicken dum biryani with raita", "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&q=80&w=400"],
  ["Chicken Dum Biryani", 270, "biryani-non-veg", "Slow-cooked chicken dum biryani with fragrant spices", "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&q=80&w=400"],
  ["Single Mutton Biryani", 230, "biryani-non-veg", "Single-serving mutton biryani with slow-cooked tender meat", "https://images.unsplash.com/photo-1596560548464-f010549b84d7?auto=format&fit=crop&q=80&w=400"],
  ["Mutton Biryani", 330, "biryani-non-veg", "Aromatic mutton dum biryani with whole spices and saffron rice", "https://images.unsplash.com/photo-1596560548464-f010549b84d7?auto=format&fit=crop&q=80&w=400"],
  ["Spl. Chicken Biryani", 310, "biryani-non-veg", "Chef's special chicken biryani with premium ingredients", "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&q=80&w=400"],
  ["Fish Biryani", 280, "biryani-non-veg", "Delicious fish biryani with fresh fish and aromatic spices", "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&q=80&w=400"],
  ["Egg Biryani", 230, "biryani-non-veg", "Flavourful biryani with boiled eggs and biryani spices", "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&q=80&w=400"],
  ["Prawns Biryani", 280, "biryani-non-veg", "Juicy prawns cooked with biryani masala and basmati rice", "https://images.unsplash.com/photo-1565299543923-37dd37887442?auto=format&fit=crop&q=80&w=400"],

  // ──── VEG & FRIED RICE ────
  ["Single Zeera Rice", 110, "veg-fried-rice", "Light cumin-flavoured plain rice", "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&q=80&w=400"],
  ["Zeera Rice", 190, "veg-fried-rice", "Aromatic jeera (cumin) fried rice with ghee", "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&q=80&w=400"],
  ["Veg Fried Rice", 190, "veg-fried-rice", "Wok-tossed fried rice with fresh vegetables and soy", "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&q=80&w=400"],
  ["Plain Rice", 80, "veg-fried-rice", "Steamed plain basmati rice", "https://images.unsplash.com/photo-1603603961473-5b7ffc66ef76?auto=format&fit=crop&q=80&w=400"],
  ["Kaju Fried Rice", 250, "veg-fried-rice", "Fried rice with roasted cashews and vegetables", "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&q=80&w=400"],
  ["Paneer Fried Rice", 230, "veg-fried-rice", "Fried rice with soft paneer cubes and spices", "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&q=80&w=400"],
  ["Curd Rice", 120, "veg-fried-rice", "Cooling curd rice with tempered mustard seeds", "https://images.unsplash.com/photo-1603603961473-5b7ffc66ef76?auto=format&fit=crop&q=80&w=400"],
  ["Spl. Curd Rice", 140, "veg-fried-rice", "Special curd rice with pomegranate and cashews", "https://images.unsplash.com/photo-1603603961473-5b7ffc66ef76?auto=format&fit=crop&q=80&w=400"],
  ["Curd (1 Cup)", 40, "veg-fried-rice", "Fresh chilled curd served in a cup", "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&q=80&w=400"],

  // ──── RICE NON-VEG ────
  ["Chicken Fried Rice", 210, "rice-non-veg", "Wok-tossed fried rice with tender chicken pieces", "https://images.unsplash.com/photo-1596560548464-f010549b84d7?auto=format&fit=crop&q=80&w=400"],
  ["Spl. Chicken Fried", 250, "rice-non-veg", "Chef's special fried rice with extra chicken and spices", "https://images.unsplash.com/photo-1596560548464-f010549b84d7?auto=format&fit=crop&q=80&w=400"],
  ["Mutton Fried Rice", 310, "rice-non-veg", "Fried rice with tender mutton pieces and aromatic spices", "https://images.unsplash.com/photo-1596560548464-f010549b84d7?auto=format&fit=crop&q=80&w=400"],
  ["Egg Fried Rice", 210, "rice-non-veg", "Classic egg fried rice with scrambled eggs and vegetables", "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&q=80&w=400"],
  ["Double Egg Fried Rice", 230, "rice-non-veg", "Double egg fried rice with extra eggs and spring onions", "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&q=80&w=400"],

  // ──── CURRIES (Single portions) ────
  ["Single Dal Fry", 110, "curries", "Comforting single-serving dal fry with tempered cumin", "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=400"],
  ["Dal Fry", 170, "curries", "Rich and flavourful dal fry with ghee and spices", "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=400"],
  ["Dal Tadka", 170, "curries", "Yellow dal with aromatic tadka of garlic, cumin and chillies", "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=400"],
  ["Single Paneer Butter Masala", 170, "curries", "Single serving of creamy paneer butter masala", "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&q=80&w=400"],
  ["Single Chicken Curry", 170, "curries", "Single portion of classic chicken curry", "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&q=80&w=400"],
  ["Single Mutton Curry", 200, "curries", "Single serving of rich mutton curry", "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&q=80&w=400"],
  ["Single Boneless Chicken Curry", 200, "curries", "Single serving of boneless chicken curry", "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&q=80&w=400"],

  // ──── SALAD ────
  ["Green Salad", 90, "salad", "Fresh garden salad with cucumbers, tomatoes and lettuce", "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=400"],
  ["Peanut Salad", 150, "salad", "Crunchy peanut salad with spiced dressing", "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=400"],
  ["Kukumbar (Kheera) Salad", 60, "salad", "Fresh cucumber salad with lemon and chaat masala", "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=400"],
  ["Onion Salad", 10, "salad", "Sliced onions with lemon and spices", "https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?auto=format&fit=crop&q=80&w=400"],

  // ──── ROTI & BREAD ────
  ["Tandoori Roti", 25, "roti-bread", "Freshly baked whole wheat tandoori roti from clay oven", "https://images.unsplash.com/photo-1565992441121-4367571b43ca?auto=format&fit=crop&q=80&w=400"],
  ["Butter Roti", 35, "roti-bread", "Soft roti with a generous spread of butter", "https://images.unsplash.com/photo-1565992441121-4367571b43ca?auto=format&fit=crop&q=80&w=400"],
  ["Plain Naan", 35, "roti-bread", "Soft plain naan baked in tandoor", "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&q=80&w=400"],
  ["Butter Naan", 40, "roti-bread", "Fluffy butter naan with a golden glazed top", "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&q=80&w=400"],
  ["Alu Parata", 40, "roti-bread", "Crispy stuffed potato paratha served with pickle and curd", "https://images.unsplash.com/photo-1565992441121-4367571b43ca?auto=format&fit=crop&q=80&w=400"],
  ["Onion Kulcha", 45, "roti-bread", "Soft onion-stuffed kulcha baked in tandoor", "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&q=80&w=400"],
  ["Pudina Parota", 45, "roti-bread", "Flaky parota layered with fresh mint", "https://images.unsplash.com/photo-1565992441121-4367571b43ca?auto=format&fit=crop&q=80&w=400"],

  // ──── EGG STARTERS ────
  ["Boiled Egg", 35, "egg-starters", "Hard-boiled eggs served with salt and pepper", "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&q=80&w=400"],
  ["Egg Half Boiled", 80, "egg-starters", "Soft half-boiled eggs with seasoning", "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&q=80&w=400"],
  ["Omlet", 80, "egg-starters", "Fluffy masala omelette with onions and green chillies", "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&q=80&w=400"],
  ["Egg Roast", 90, "egg-starters", "Eggs roasted in spiced masala sauce", "https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&q=80&w=400"],
  ["Egg 65", 180, "egg-starters", "Crispy deep-fried egg 65 with curry leaves and spices", "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&q=80&w=400"],
  ["Egg Chilli", 180, "egg-starters", "Spicy egg chilli tossed with capsicum and sauces", "https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&q=80&w=400"],
  ["Egg Manchuria", 180, "egg-starters", "Crispy egg dumplings in Indo-Chinese Manchurian sauce", "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&q=80&w=400"],

  // ──── EGG CURRIES ────
  ["Single Egg Curry & Egg Bhurji", 110, "egg-curries", "Single-serving egg curry and spiced scrambled egg", "https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&q=80&w=400"],
  ["Egg Bhurji", 180, "egg-curries", "Spiced scrambled egg bhurji with onions and chillies", "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&q=80&w=400"],
  ["Egg Curry", 180, "egg-curries", "Whole eggs in rich spiced curry gravy", "https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&q=80&w=400"],
  ["Tomato Egg Curry", 180, "egg-curries", "Eggs cooked in tangy tomato curry", "https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&q=80&w=400"],
  ["Egg Masala", 180, "egg-curries", "Eggs in aromatic masala gravy with onion and tomato", "https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&q=80&w=400"],

  // ──── VEG STARTERS ────
  ["Roast Papad", 40, "veg-starters", "Crispy roasted papad served as appetizer", "https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&q=80&w=400"],
  ["Single Masala Papad", 50, "veg-starters", "Crispy papad topped with masala onions and tomatoes", "https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&q=80&w=400"],
  ["Double Masala Papad", 80, "veg-starters", "Two crispy papads loaded with spiced masala topping", "https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&q=80&w=400"],
  ["Palli Roast", 140, "veg-starters", "Roasted peanuts with spices and curry leaves", "https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&q=80&w=400"],
  ["Boil Corn", 160, "veg-starters", "Fresh boiled sweet corn with butter and spices", "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?auto=format&fit=crop&q=80&w=400"],
  ["Corn Fry", 160, "veg-starters", "Crispy fried corn kernels seasoned with spices", "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?auto=format&fit=crop&q=80&w=400"],
  ["Crispy Corn", 180, "veg-starters", "Golden crispy corn tossed in tangy seasoning", "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?auto=format&fit=crop&q=80&w=400"],
  ["Channa Fry", 180, "veg-starters", "Spicy fried chickpeas with onion and masala", "https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&q=80&w=400"],
  ["Channa Roast", 180, "veg-starters", "Dry roasted chickpeas with aromatic spices", "https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&q=80&w=400"],
  ["Onion Pakoda", 180, "veg-starters", "Crispy onion fritters deep fried in spiced batter", "https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&q=80&w=400"],
  ["Masala Kaju Roast", 180, "veg-starters", "Roasted cashews in spicy masala coating", "https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&q=80&w=400"],
  ["Veg Manchuria Dry", 180, "veg-starters", "Crispy vegetable manchurian dry with Indo-Chinese spices", "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=400"],
  ["Veg Bhurani", 260, "veg-starters", "Spiced veg bhurani with vegetables and masala", "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=400"],
  ["Panner Manchuria", 260, "veg-starters", "Crispy paneer manchurian in spiced sauce", "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&q=80&w=400"],
  ["Finger Chips", 180, "veg-starters", "Crispy golden french fries seasoned with spices", "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&q=80&w=400"],
  ["Paneer 65", 260, "veg-starters", "Crispy deep-fried paneer 65 with curry leaves", "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&q=80&w=400"],
  ["Chilli Paneer", 260, "veg-starters", "Crispy paneer tossed in spicy chilli sauce", "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&q=80&w=400"],
  ["Paneer Megisticks", 270, "veg-starters", "Paneer sticks in spiced coating, a restaurant special", "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&q=80&w=400"],
  ["Boiled Veg", 270, "veg-starters", "Healthy steamed mixed vegetables with seasoning", "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=400"],
  ["Baby Corn Manchuria", 260, "veg-starters", "Crispy baby corn in Manchurian sauce", "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?auto=format&fit=crop&q=80&w=400"],
  ["Mushroom Manchuria", 260, "veg-starters", "Crispy mushroom manchurian with Indo-Chinese flavours", "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=400"],
  ["Paneer Tikka", 250, "tandoori-starters", "Marinated paneer cubes grilled in tandoor with spices", "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&q=80&w=400"],

  // ──── NON-VEG STARTERS CHICKEN ────
  ["Chilli Chicken", 270, "non-veg-starters-chicken", "Crispy chicken tossed in spicy chilli sauce", "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&q=80&w=400"],
  ["Chicken 65", 270, "non-veg-starters-chicken", "Classic Hyderabadi chicken 65 with curry leaves", "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&q=80&w=400"],
  ["Chicken Manchuria", 270, "non-veg-starters-chicken", "Crispy chicken in flavourful Indo-Chinese manchurian sauce", "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&q=80&w=400"],
  ["Pepper Chicken", 290, "non-veg-starters-chicken", "Dry pepper chicken fry with coarsely ground black pepper", "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&q=80&w=400"],
  ["Chicken Yoga", 290, "non-veg-starters-chicken", "Chef's signature dry chicken preparation", "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&q=80&w=400"],
  ["Chicken Majestic", 290, "non-veg-starters-chicken", "Hyderabadi-style crispy chicken majestic with yogurt marinade", "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&q=80&w=400"],
  ["Chicken 555", 290, "non-veg-starters-chicken", "Special crispy fried chicken with five spice coating", "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&q=80&w=400"],
  ["Chicken Bhurani", 290, "non-veg-starters-chicken", "Dry spiced chicken bhurani starter", "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&q=80&w=400"],
  ["Sapota Chicken", 290, "non-veg-starters-chicken", "Unique dry chicken preparation with special spice blend", "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&q=80&w=400"],
  ["Chicken Drum Sticks", 290, "non-veg-starters-chicken", "Crispy marinated chicken drumsticks, perfectly fried", "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&q=80&w=400"],

  // ──── NON-VEG STARTERS FISH & PRAWNS ────
  ["Fish Roast", 180, "non-veg-starters-fish-prawns", "Whole fish roasted with masala and spices", "https://images.unsplash.com/photo-1565299543923-37dd37887442?auto=format&fit=crop&q=80&w=400"],
  ["Chilli Fish", 290, "non-veg-starters-fish-prawns", "Crispy fish tossed in fiery chilli sauce", "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&q=80&w=400"],
  ["Frish Fry", 280, "non-veg-starters-fish-prawns", "Crispy golden fried fish with local spices", "https://images.unsplash.com/photo-1565299543923-37dd37887442?auto=format&fit=crop&q=80&w=400"],
  ["Chilli Prawns", 300, "non-veg-starters-fish-prawns", "Juicy prawns in spicy chilli sauce", "https://images.unsplash.com/photo-1565299543923-37dd37887442?auto=format&fit=crop&q=80&w=400"],
  ["Loose Prawns", 300, "non-veg-starters-fish-prawns", "Lightly seasoned fried prawns", "https://images.unsplash.com/photo-1565299543923-37dd37887442?auto=format&fit=crop&q=80&w=400"],
  ["Prawns Fry", 300, "non-veg-starters-fish-prawns", "Crispy deep-fried prawns with masala coating", "https://images.unsplash.com/photo-1565299543923-37dd37887442?auto=format&fit=crop&q=80&w=400"],
  ["Roasted Prawns", 300, "non-veg-starters-fish-prawns", "Succulent prawns dry roasted with aromatic spices", "https://images.unsplash.com/photo-1565299543923-37dd37887442?auto=format&fit=crop&q=80&w=400"],

  // ──── TANDOORI STARTERS ────
  ["Leg Kabab", 190, "tandoori-starters", "Tender chicken leg marinated and grilled in tandoor", "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&q=80&w=400"],
  ["Thangidi Kabab (Half)", 190, "tandoori-starters", "Half portion of succulent chicken thigh kababs", "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&q=80&w=400"],
  ["Thangidi Kabab (Full)", 280, "tandoori-starters", "Full portion of juicy chicken thigh kababs from tandoor", "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&q=80&w=400"],
  ["Thanduri Chicken (Half)", 280, "tandoori-starters", "Half tandoori chicken marinated in yogurt and spices", "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&q=80&w=400"],
  ["Thanduri Chicken (Full)", 530, "tandoori-starters", "Full tandoori chicken — perfectly charred and juicy", "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&q=80&w=400"],
  ["Chicken Tikka", 260, "tandoori-starters", "Marinated boneless chicken tikka grilled in tandoor", "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&q=80&w=400"],

  // ──── FAMILY PACK & BIRYANIES ────
  ["Family Pack Chicken Biryani (3 Members)", 570, "family-pack-biryanies", "Large chicken biryani for 3 people with raita and salan", "https://images.unsplash.com/photo-1571197119738-c0f8f4d11cd4?auto=format&fit=crop&q=80&w=400"],
  ["Family Pack Mutton Biryani (3 Members)", 860, "family-pack-biryanies", "Large mutton biryani for 3 people with sides", "https://images.unsplash.com/photo-1596560548464-f010549b84d7?auto=format&fit=crop&q=80&w=400"],
  ["Jumbo Pack Chicken Biryani (5 Members)", 990, "family-pack-biryanies", "Jumbo-sized chicken biryani for 5 people — great for family", "https://images.unsplash.com/photo-1571197119738-c0f8f4d11cd4?auto=format&fit=crop&q=80&w=400"],
  ["Family Pack Spl. Chicken Biryani (3 Members)", 800, "family-pack-biryanies", "Special chicken biryani family pack with extra toppings", "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&q=80&w=400"],
];

// ─── Main Seeder ──────────────────────────────────────────────────────────────
async function main() {
  console.log("\n🔌 Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI, {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 30000,
  });
  console.log("✅ Connected!\n");

  // ── Step 1: Clear all existing data ──────────────────────────────────────
  console.log("🗑️  Clearing existing shops, products, and categories...");
  const [pDel, sDel, cDel] = await Promise.all([
    Product.deleteMany({}),
    Shop.deleteMany({}),
    Category.deleteMany({}),
  ]);
  console.log(`   Removed: ${pDel.deletedCount} products | ${sDel.deletedCount} shops | ${cDel.deletedCount} categories\n`);

  // ── Step 2: Insert categories ─────────────────────────────────────────────
  console.log("📂 Inserting", CATEGORIES.length, "categories...");
  const insertedCategories = await Category.insertMany(
    CATEGORIES.map((c) => ({ ...c, type: "product" }))
  );
  console.log("   ✅ Categories created\n");

  // ── Step 3: Create the Restaurant Shop ───────────────────────────────────
  console.log("🏪 Creating Relax Bar & Restaurant...");
  const shop = await Shop.create(RESTAURANT);
  console.log("   ✅ Shop ID:", shop._id, "\n");

  // ── Step 4: Insert all menu items ────────────────────────────────────────
  console.log("🍽️  Inserting", MENU_ITEMS.length, "menu items...");
  const products = MENU_ITEMS.map(([name, price, categorySlug, description, image]) => ({
    name,
    slug: slugify(name),
    description,
    price,
    unit: "plate",
    categorySlug,
    shopId: shop._id,
    inStock: true,
    stockQuantity: 99,
    lowStockThreshold: 10,
    image,
    isHidden: false,
  }));

  await Product.insertMany(products);
  console.log("   ✅ All menu items inserted!\n");

  // ── Summary ──────────────────────────────────────────────────────────────
  const [finalProducts, finalShops, finalCats] = await Promise.all([
    Product.countDocuments(),
    Shop.countDocuments(),
    Category.countDocuments(),
  ]);

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🎉 DATABASE SEED COMPLETE!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`   🏪 Shops:       ${finalShops}`);
  console.log(`   📂 Categories:  ${finalCats}`);
  console.log(`   🍽️  Products:    ${finalProducts}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n🔌 Disconnecting...");
  await mongoose.disconnect();
  console.log("✅ Done!\n");
}

main().catch((err) => {
  console.error("\n❌ Seed failed:", err.message);
  mongoose.disconnect();
  process.exit(1);
});

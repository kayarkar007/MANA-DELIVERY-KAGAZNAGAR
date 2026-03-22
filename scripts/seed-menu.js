/**
 * Mana Delivery - Full Restaurant Menu Seeder
 * Sources: Sai Bakery, The New Mehfil, Curry & Kabab restaurant
 * Run: node scripts/seed-menu.js
 */

require("dotenv").config({ path: ".env.local" });
const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not found in .env.local");
  process.exit(1);
}

// ─── Schemas ──────────────────────────────────────────────────────────────────
const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    type: { type: String, enum: ["product", "service"], required: true },
    image: { type: String },
  },
  { timestamps: true }
);

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    unit: { type: String, required: true },
    categorySlug: { type: String, required: true },
    inStock: { type: Boolean, default: true },
    image: { type: String },
  },
  { timestamps: true }
);

const Category = mongoose.models.Category || mongoose.model("Category", CategorySchema);
const Product = mongoose.models.Product || mongoose.model("Product", ProductSchema);

// ─── Categories Data ──────────────────────────────────────────────────────────
const categories = [
  {
    name: "Pizzas",
    slug: "pizzas",
    type: "product",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80",
  },
  {
    name: "Burgers",
    slug: "burgers",
    type: "product",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80",
  },
  {
    name: "Sandwiches",
    slug: "sandwiches",
    type: "product",
    image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&q=80",
  },
  {
    name: "Hot Dogs",
    slug: "hot-dogs",
    type: "product",
    image: "https://images.unsplash.com/photo-1612392166886-ee8475b03af2?w=400&q=80",
  },
  {
    name: "Biryani",
    slug: "biryani",
    type: "product",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80",
  },
  {
    name: "Mandi",
    slug: "mandi",
    type: "product",
    image: "https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&q=80",
  },
  {
    name: "Extra Rice",
    slug: "extra-rice",
    type: "product",
    image: "https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=400&q=80",
  },
  {
    name: "Curries",
    slug: "curries",
    type: "product",
    image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80",
  },
  {
    name: "Rotis & Breads",
    slug: "rotis-breads",
    type: "product",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80",
  },
  {
    name: "Starters",
    slug: "starters",
    type: "product",
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80",
  },
  {
    name: "Kababs",
    slug: "kababs",
    type: "product",
    image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&q=80",
  },
  {
    name: "Shawarma",
    slug: "shawarma",
    type: "product",
    image: "https://images.unsplash.com/photo-1561651188-d207bbec4ec3?w=400&q=80",
  },
  {
    name: "Sea Food",
    slug: "sea-food",
    type: "product",
    image: "https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=400&q=80",
  },
];

// ─── Products Data ────────────────────────────────────────────────────────────
const products = [
  // ── SAI BAKERY: PIZZAS ──────────────────────────────────────────────────
  {
    name: "Veg Pizza (Big)",
    description: "Freshly baked big vegetable pizza with loaded toppings from Sai Bakery.",
    price: 180,
    unit: "1 piece",
    categorySlug: "pizzas",
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80",
  },
  {
    name: "Veg Pizza (Small)",
    description: "Perfectly sized small vegetable pizza from Sai Bakery.",
    price: 100,
    unit: "1 piece",
    categorySlug: "pizzas",
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80",
  },
  {
    name: "Veg Paneer Pizza (Big)",
    description: "Big paneer pizza with rich cheese and fresh vegetables from Sai Bakery.",
    price: 220,
    unit: "1 piece",
    categorySlug: "pizzas",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80",
  },
  {
    name: "Veg Paneer Pizza (Small)",
    description: "Small paneer pizza with rich cheese and fresh vegetables from Sai Bakery.",
    price: 130,
    unit: "1 piece",
    categorySlug: "pizzas",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80",
  },
  {
    name: "Chicken Pizza (Big)",
    description: "Loaded big chicken pizza with juicy toppings from Sai Bakery.",
    price: 200,
    unit: "1 piece",
    categorySlug: "pizzas",
    image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&q=80",
  },
  {
    name: "Chicken Pizza (Small)",
    description: "Loaded small chicken pizza with juicy toppings from Sai Bakery.",
    price: 120,
    unit: "1 piece",
    categorySlug: "pizzas",
    image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&q=80",
  },

  // ── SAI BAKERY: BURGERS ─────────────────────────────────────────────────
  {
    name: "Chicken Burger",
    description: "Crispy juicy chicken burger with fresh lettuce and sauce from Sai Bakery.",
    price: 90,
    unit: "1 piece",
    categorySlug: "burgers",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80",
  },
  {
    name: "Paneer Burger",
    description: "Soft paneer patty burger with spicy sauce and vegetables from Sai Bakery.",
    price: 90,
    unit: "1 piece",
    categorySlug: "burgers",
    image: "https://images.unsplash.com/photo-1550950158-d0d960dff596?w=400&q=80",
  },
  {
    name: "Veg Burger",
    description: "Classic crispy vegetarian burger from Sai Bakery.",
    price: 80,
    unit: "1 piece",
    categorySlug: "burgers",
    image: "https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=400&q=80",
  },

  // ── SAI BAKERY: SANDWICHES ──────────────────────────────────────────────
  {
    name: "Chicken Sandwich",
    description: "Grilled chicken sandwich with crispy bread and fresh ingredients from Sai Bakery.",
    price: 60,
    unit: "1 piece",
    categorySlug: "sandwiches",
    image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&q=80",
  },
  {
    name: "Paneer Sandwich",
    description: "Soft paneer sandwich with spiced filling from Sai Bakery.",
    price: 70,
    unit: "1 piece",
    categorySlug: "sandwiches",
    image: "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=400&q=80",
  },
  {
    name: "Veg Sandwich",
    description: "Fresh vegetable sandwich with crispy toasted bread from Sai Bakery.",
    price: 50,
    unit: "1 piece",
    categorySlug: "sandwiches",
    image: "https://images.unsplash.com/photo-1543340904-0d1e75ce4ddc?w=400&q=80",
  },

  // ── SAI BAKERY: HOT DOG ─────────────────────────────────────────────────
  {
    name: "Hot Dog",
    description: "Classic hot dog with mustard, ketchup and fresh toppings from Sai Bakery.",
    price: 80,
    unit: "1 piece",
    categorySlug: "hot-dogs",
    image: "https://images.unsplash.com/photo-1612392166886-ee8475b03af2?w=400&q=80",
  },

  // ── THE NEW MEHFIL: NON-VEG BIRYANI ────────────────────────────────────
  {
    name: "HYD Chicken Dum Biryani (Single)",
    description: "Authentic Hyderabadi chicken dum biryani cooked in traditional spices. Parcel available.",
    price: 130,
    unit: "1 portion",
    categorySlug: "biryani",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80",
  },
  {
    name: "HYD Chicken Dum Biryani (Full)",
    description: "Full serving of authentic Hyderabadi chicken dum biryani. Parcel available.",
    price: 250,
    unit: "1 full",
    categorySlug: "biryani",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80",
  },
  {
    name: "HYD Chicken Dum Biryani (Family)",
    description: "Family-sized Hyderabadi chicken dum biryani for group sharing. Parcel available.",
    price: 500,
    unit: "family pack",
    categorySlug: "biryani",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80",
  },
  {
    name: "HYD Chicken Dum Biryani (Jumbo)",
    description: "Jumbo Hyderabadi chicken dum biryani for large gatherings. Parcel available.",
    price: 800,
    unit: "jumbo pack",
    categorySlug: "biryani",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80",
  },
  {
    name: "Chicken Fry Pice Biryani (Single)",
    description: "Spicy chicken fry pice biryani single portion. Parcel available.",
    price: 150,
    unit: "1 portion",
    categorySlug: "biryani",
    image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400&q=80",
  },
  {
    name: "Chicken Fry Pice Biryani (Full)",
    description: "Spicy chicken fry pice biryani full serving. Parcel available.",
    price: 290,
    unit: "1 full",
    categorySlug: "biryani",
    image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400&q=80",
  },
  {
    name: "Bonles 65 Biryani (Single)",
    description: "Boneless 65 fried chicken biryani single portion. Parcel available.",
    price: 320,
    unit: "1 portion",
    categorySlug: "biryani",
    image: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=400&q=80",
  },
  {
    name: "Mutton Fry Pice Biryani (Single)",
    description: "Tender mutton fry pice biryani single portion. Parcel available.",
    price: 220,
    unit: "1 portion",
    categorySlug: "biryani",
    image: "https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&q=80",
  },
  {
    name: "Mutton Fry Pice Biryani (Full)",
    description: "Tender mutton fry pice biryani full serving. Parcel available.",
    price: 420,
    unit: "1 full",
    categorySlug: "biryani",
    image: "https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&q=80",
  },

  // ── THE NEW MEHFIL: VEG BIRYANI ────────────────────────────────────────
  {
    name: "Paneer Biryani (Single)",
    description: "Flavourful paneer biryani single portion. Parcel available.",
    price: 220,
    unit: "1 portion",
    categorySlug: "biryani",
    image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&q=80",
  },
  {
    name: "Paneer Biryani (Full)",
    description: "Flavourful paneer biryani full serving. Parcel available.",
    price: 370,
    unit: "1 full",
    categorySlug: "biryani",
    image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&q=80",
  },
  {
    name: "Veg Biryani (Single)",
    description: "Classic vegetable biryani single portion. Parcel available.",
    price: 150,
    unit: "1 portion",
    categorySlug: "biryani",
    image: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&q=80",
  },
  {
    name: "Veg Biryani (Full)",
    description: "Classic vegetable biryani full serving. Parcel available.",
    price: 280,
    unit: "1 full",
    categorySlug: "biryani",
    image: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&q=80",
  },
  {
    name: "Kaju Biryani (Full)",
    description: "Rich cashew (kaju) biryani full serving. Parcel available.",
    price: 370,
    unit: "1 full",
    categorySlug: "biryani",
    image: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&q=80",
  },

  // ── THE NEW MEHFIL: EXTRA RICE ──────────────────────────────────────────
  {
    name: "Biryani Rice",
    description: "Plain biryani-style aromatic rice.",
    price: 110,
    unit: "1 portion",
    categorySlug: "extra-rice",
    image: "https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=400&q=80",
  },
  {
    name: "Mandi Rice",
    description: "Slow-cooked aromatic mandi rice.",
    price: 120,
    unit: "1 portion",
    categorySlug: "extra-rice",
    image: "https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=400&q=80",
  },
  {
    name: "Zeera Rice",
    description: "Classic cumin tempered basmati rice.",
    price: 110,
    unit: "1 portion",
    categorySlug: "extra-rice",
    image: "https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=400&q=80",
  },
  {
    name: "Veg Fried Rice",
    description: "Stir-fried vegetable rice with soy sauce and spices.",
    price: 130,
    unit: "1 portion",
    categorySlug: "extra-rice",
    image: "https://images.unsplash.com/photo-1516901408496-0927e5acd7bd?w=400&q=80",
  },
  {
    name: "Chicken Fried Rice",
    description: "Wok-tossed chicken fried rice with fresh vegetables and seasoning.",
    price: 150,
    unit: "1 portion",
    categorySlug: "extra-rice",
    image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&q=80",
  },
  {
    name: "Egg Fried Rice",
    description: "Classic egg fried rice with special seasoning.",
    price: 140,
    unit: "1 portion",
    categorySlug: "extra-rice",
    image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&q=80",
  },

  // ── THE NEW MEHFIL: MANDI ───────────────────────────────────────────────
  {
    name: "1 PC Chicken Juicy Mandi",
    description: "1 piece slow-roasted juicy chicken mandi. Parcel available.",
    price: 300,
    unit: "1 piece",
    categorySlug: "mandi",
    image: "https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&q=80",
  },
  {
    name: "2 PC Chicken Juicy Mandi",
    description: "2 pieces slow-roasted juicy chicken mandi. Parcel available.",
    price: 580,
    unit: "2 pieces",
    categorySlug: "mandi",
    image: "https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&q=80",
  },
  {
    name: "4 PC Chicken Juicy Mandi",
    description: "4 pieces slow-roasted juicy chicken mandi. Parcel available.",
    price: 1180,
    unit: "4 pieces",
    categorySlug: "mandi",
    image: "https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&q=80",
  },
  {
    name: "1 PC Chicken Fry Mandi",
    description: "1 piece crispy fry chicken mandi. Parcel available.",
    price: 250,
    unit: "1 piece",
    categorySlug: "mandi",
    image: "https://images.unsplash.com/photo-1532636875304-0c89119d9b4d?w=400&q=80",
  },
  {
    name: "2 PC Chicken Fry Mandi",
    description: "2 pieces crispy fry chicken mandi. Parcel available.",
    price: 490,
    unit: "2 pieces",
    categorySlug: "mandi",
    image: "https://images.unsplash.com/photo-1532636875304-0c89119d9b4d?w=400&q=80",
  },
  {
    name: "1 PC Mutton Juicy Mandi",
    description: "1 piece slow-roasted mutton mandi, tender and flavorful. Parcel available.",
    price: 450,
    unit: "1 piece",
    categorySlug: "mandi",
    image: "https://images.unsplash.com/photo-1529563021893-cc83c992d75d?w=400&q=80",
  },
  {
    name: "1 PC Mutton Mandi",
    description: "Classic 1 piece mutton mandi. Parcel available.",
    price: 380,
    unit: "1 piece",
    categorySlug: "mandi",
    image: "https://images.unsplash.com/photo-1529563021893-cc83c992d75d?w=400&q=80",
  },
  {
    name: "1 PC Paneer Mandi",
    description: "Slow-cooked paneer mandi with aromatic rice. Parcel available.",
    price: 320,
    unit: "1 piece",
    categorySlug: "mandi",
    image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&q=80",
  },
  {
    name: "1 PC Grill Mandi",
    description: "Charcoal-grilled 1 piece chicken mandi. Parcel available.",
    price: 300,
    unit: "1 piece",
    categorySlug: "mandi",
    image: "https://images.unsplash.com/photo-1606491956391-c1e104c618c8?w=400&q=80",
  },
  {
    name: "Full Bird Grill Mandi",
    description: "Full whole bird charcoal-grilled mandi for groups. Parcel available.",
    price: 1180,
    unit: "1 full bird",
    categorySlug: "mandi",
    image: "https://images.unsplash.com/photo-1606491956391-c1e104c618c8?w=400&q=80",
  },
  {
    name: "Alfam Chicken Mandi (1 PC)",
    description: "Special Alfam-style chicken mandi single piece. Parcel available.",
    price: 350,
    unit: "1 piece",
    categorySlug: "mandi",
    image: "https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&q=80",
  },

  // ── CURRIES: NON-VEG ────────────────────────────────────────────────────
  {
    name: "Chicken Curry (Bone)",
    description: "Classic bone-in chicken curry cooked with traditional Indian spices.",
    price: 200,
    unit: "1 portion",
    categorySlug: "curries",
    image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80",
  },
  {
    name: "Hyderabadi Chicken Curry",
    description: "Rich aromatic Hyderabadi-style chicken curry with masalas.",
    price: 210,
    unit: "1 portion",
    categorySlug: "curries",
    image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80",
  },
  {
    name: "Butter Chicken",
    description: "Creamy restaurant-style butter chicken in a smooth tomato gravy.",
    price: 260,
    unit: "1 portion",
    categorySlug: "curries",
    image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&q=80",
  },
  {
    name: "Kadai Chicken",
    description: "Spicy kadai chicken cooked in a wok with onions and peppers.",
    price: 250,
    unit: "1 portion",
    categorySlug: "curries",
    image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=400&q=80",
  },
  {
    name: "Mutton Curry",
    description: "Tender mutton pieces slow-cooked in rich spicy gravy.",
    price: 420,
    unit: "1 portion",
    categorySlug: "curries",
    image: "https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&q=80",
  },

  // ── CURRIES: VEG ───────────────────────────────────────────────────────
  {
    name: "Paneer Butter Masala",
    description: "Creamy paneer in rich makhani-style butter masala gravy.",
    price: 250,
    unit: "1 portion",
    categorySlug: "curries",
    image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&q=80",
  },
  {
    name: "Kaju Paneer",
    description: "Paneer and cashew nuts cooked in a rich creamy gravy.",
    price: 390,
    unit: "1 portion",
    categorySlug: "curries",
    image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&q=80",
  },
  {
    name: "Palak Paneer",
    description: "Soft paneer in fresh pureed spinach with aromatic spices.",
    price: 320,
    unit: "1 portion",
    categorySlug: "curries",
    image: "https://images.unsplash.com/photo-1604152135912-04a022e23696?w=400&q=80",
  },
  {
    name: "Dal Tadka",
    description: "Classic yellow dal tempered with cumin, mustard and aromatic spices.",
    price: 110,
    unit: "1 portion",
    categorySlug: "curries",
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=400&q=80",
  },
  {
    name: "Egg Bhurji",
    description: "Scrambled masala eggs with onions, tomatoes and green chillies.",
    price: 120,
    unit: "1 portion",
    categorySlug: "curries",
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&q=80",
  },
  {
    name: "Omelette",
    description: "Fresh fluffy omelette cooked with spices and vegetables.",
    price: 110,
    unit: "1 piece",
    categorySlug: "curries",
    image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&q=80",
  },

  // ── ROTIS & BREADS ──────────────────────────────────────────────────────
  {
    name: "Tandoori Roti",
    description: "Freshly baked tandoori roti straight from the clay oven.",
    price: 25,
    unit: "1 piece",
    categorySlug: "rotis-breads",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80",
  },
  {
    name: "Romal Roti",
    description: "Thin silky romal roti baked in tandoor.",
    price: 25,
    unit: "1 piece",
    categorySlug: "rotis-breads",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80",
  },
  {
    name: "Butter Nan",
    description: "Soft buttery naan freshly baked in clay oven.",
    price: 45,
    unit: "1 piece",
    categorySlug: "rotis-breads",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80",
  },
  {
    name: "Garlic Nan",
    description: "Freshly baked garlic flavoured naan with butter.",
    price: 75,
    unit: "1 piece",
    categorySlug: "rotis-breads",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80",
  },
  {
    name: "Special Malabar Paratha",
    description: "Flaky layered Kerala-style Malabar paratha.",
    price: 40,
    unit: "1 piece",
    categorySlug: "rotis-breads",
    image: "https://images.unsplash.com/photo-1596956470007-2bf6095e7e16?w=400&q=80",
  },

  // ── VEG STARTERS ────────────────────────────────────────────────────────
  {
    name: "Veg Manchuria",
    description: "Crispy vegetable manchurian balls in Indo-Chinese sauce.",
    price: 150,
    unit: "1 plate",
    categorySlug: "starters",
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80",
  },
  {
    name: "Paneer Manchria",
    description: "Paneer manchurian in rich spicy sauce.",
    price: 250,
    unit: "1 plate",
    categorySlug: "starters",
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80",
  },
  {
    name: "Paneer 65",
    description: "Spicy deep-fried paneer 65 with curry leaves.",
    price: 260,
    unit: "1 plate",
    categorySlug: "starters",
    image: "https://images.unsplash.com/photo-1645177628172-a94c1f96difd?w=400&q=80",
  },
  {
    name: "Paneer Majestic",
    description: "Crispy paneer majestic with special dry masala coating.",
    price: 290,
    unit: "1 plate",
    categorySlug: "starters",
    image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&q=80",
  },

  // ── CHICKEN STARTERS ────────────────────────────────────────────────────
  {
    name: "Chilly Chicken",
    description: "Spicy Indo-Chinese chilly chicken with peppers and onions.",
    price: 210,
    unit: "1 plate",
    categorySlug: "starters",
    image: "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=400&q=80",
  },
  {
    name: "Chicken 65",
    description: "Classic deep-fried spicy chicken 65 with curry leaves.",
    price: 210,
    unit: "1 plate",
    categorySlug: "starters",
    image: "https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?w=400&q=80",
  },
  {
    name: "Chicken Manchuria",
    description: "Crispy chicken manchurian in tangy Indo-Chinese gravy.",
    price: 240,
    unit: "1 plate",
    categorySlug: "starters",
    image: "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=400&q=80",
  },
  {
    name: "Pepper Chicken",
    description: "Dry pepper chicken tossed in coarse pepper and spices.",
    price: 260,
    unit: "1 plate",
    categorySlug: "starters",
    image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=400&q=80",
  },

  // ── KABABS ──────────────────────────────────────────────────────────────
  {
    name: "Tandoori Chicken (Full)",
    description: "Full whole tandoori chicken straight from the clay oven with mint chutney.",
    price: 480,
    unit: "1 full",
    categorySlug: "kababs",
    image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&q=80",
  },
  {
    name: "Tandoori Chicken (Half)",
    description: "Half portion of smoky tandoori chicken with mint chutney.",
    price: 250,
    unit: "half",
    categorySlug: "kababs",
    image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&q=80",
  },
  {
    name: "Tangdi Kabab (4 PC)",
    description: "4 pieces juicy chicken leg kababs marinated in aromatic spices.",
    price: 320,
    unit: "4 pieces",
    categorySlug: "kababs",
    image: "https://images.unsplash.com/photo-1606491956391-c1e104c618c8?w=400&q=80",
  },
  {
    name: "Chicken Tikka (8 PC)",
    description: "8 pieces classic chicken tikka grilled in tandoor.",
    price: 420,
    unit: "8 pieces",
    categorySlug: "kababs",
    image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&q=80",
  },
  {
    name: "Grill Chicken (Full)",
    description: "Full grilled chicken marinated and cooked to perfection.",
    price: 460,
    unit: "1 full",
    categorySlug: "kababs",
    image: "https://images.unsplash.com/photo-1606491956391-c1e104c618c8?w=400&q=80",
  },

  // ── SHAWARMA ────────────────────────────────────────────────────────────
  {
    name: "Chicken Shawarma",
    description: "Classic chicken shawarma wrap with garlic sauce and fresh vegetables.",
    price: 110,
    unit: "1 roll",
    categorySlug: "shawarma",
    image: "https://images.unsplash.com/photo-1561651188-d207bbec4ec3?w=400&q=80",
  },
  {
    name: "Chicken 65 Shawarma",
    description: "Spicy chicken 65 shawarma with special sauce.",
    price: 140,
    unit: "1 roll",
    categorySlug: "shawarma",
    image: "https://images.unsplash.com/photo-1561651188-d207bbec4ec3?w=400&q=80",
  },
  {
    name: "Paneer 65 Shawarma",
    description: "Spicy paneer 65 shawarma with garlic cream.",
    price: 180,
    unit: "1 roll",
    categorySlug: "shawarma",
    image: "https://images.unsplash.com/photo-1561651188-d207bbec4ec3?w=400&q=80",
  },
  {
    name: "Mutton Kheema Roll",
    description: "Spicy minced mutton kheema roll with onions and mint.",
    price: 240,
    unit: "1 roll",
    categorySlug: "shawarma",
    image: "https://images.unsplash.com/photo-1561651188-d207bbec4ec3?w=400&q=80",
  },

  // ── SEA FOOD ────────────────────────────────────────────────────────────
  {
    name: "Prawns Dry Fry",
    description: "Crispy dry-fried prawns with coastal masala spices (without coat).",
    price: 550,
    unit: "1 plate",
    categorySlug: "sea-food",
    image: "https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=400&q=80",
  },
  {
    name: "Fish Dry Fry (With Coat)",
    description: "Crispy coated fish dry fry with spicy masala.",
    price: 450,
    unit: "1 plate",
    categorySlug: "sea-food",
    image: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400&q=80",
  },
];

// ─── Main Seed Function ────────────────────────────────────────────────────────
async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Upsert categories
    let catInserted = 0;
    for (const cat of categories) {
      await Category.findOneAndUpdate({ slug: cat.slug }, cat, { upsert: true, new: true });
      catInserted++;
    }
    console.log(`✅ ${catInserted} categories upserted`);

    // Upsert products
    let prodInserted = 0;
    for (const prod of products) {
      await Product.findOneAndUpdate(
        { name: prod.name, categorySlug: prod.categorySlug },
        prod,
        { upsert: true, new: true }
      );
      prodInserted++;
    }
    console.log(`✅ ${prodInserted} products upserted`);
    console.log("🎉 Menu seeding complete! All items now live in Mana Delivery.");
  } catch (err) {
    console.error("❌ Seeding failed:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();

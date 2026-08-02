const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

const CATEGORY_IMAGES = {
  "mutton-curries": "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&q=80&w=600",
  "chicken-curries": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&q=80&w=600",
  "fish-curries": "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&q=80&w=600",
  "veg-curries": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=600",
  "biryani-veg": "https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?auto=format&fit=crop&q=80&w=600",
  "biryani-non-veg": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=600",
  "veg-fried-rice": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&q=80&w=600",
  "rice-non-veg": "https://images.unsplash.com/photo-1596560548464-f010549b84d7?auto=format&fit=crop&q=80&w=600",
  "curries": "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&q=80&w=600",
  "salad": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=600",
  "roti-bread": "https://images.unsplash.com/photo-1565992441121-4367571b43ca?auto=format&fit=crop&q=80&w=600",
  "egg-starters": "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&q=80&w=600",
  "egg-curries": "https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&q=80&w=600",
  "veg-starters": "https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&q=80&w=600",
  "non-veg-starters-chicken": "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&q=80&w=600",
  "non-veg-starters-fish-prawns": "https://images.unsplash.com/photo-1565299543923-37dd37887442?auto=format&fit=crop&q=80&w=600",
  "tandoori-starters": "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&q=80&w=600",
  "family-pack-biryanies": "https://images.unsplash.com/photo-1571197119738-c0f8f4d11cd4?auto=format&fit=crop&q=80&w=600",
  "fruits-veg": "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&q=80&w=600",
  "groceries": "https://images.unsplash.com/photo-1609842947419-ba4f04d5d60f?auto=format&fit=crop&q=80&w=600",
  "medicines": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=600",
  "pizzas": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=600",
  "burgers": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=600",
  "sandwiches": "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=600",
  "hot-dogs": "https://images.unsplash.com/photo-1612392166886-ee8475b03af2?auto=format&fit=crop&q=80&w=600",
  "biryani": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=600",
  "mandi": "https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fit=crop&q=80&w=600",
  "extra-rice": "https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?auto=format&fit=crop&q=80&w=600",
  "starters": "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=600",
  "kababs": "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&q=80&w=600",
  "shawarma": "https://images.unsplash.com/photo-1561651188-d207bbec4ec3?auto=format&fit=crop&q=80&w=600",
  "sea-food": "https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?auto=format&fit=crop&q=80&w=600",
};

async function fixCategories() {
  await mongoose.connect(MONGODB_URI);
  const Category = mongoose.connection.collection("categories");
  const categories = await Category.find({}).toArray();

  console.log(`Checking ${categories.length} categories...`);

  let count = 0;
  for (const c of categories) {
    const targetImage = CATEGORY_IMAGES[c.slug] || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=600";
    if (c.image !== targetImage) {
      await Category.updateOne({ _id: c._id }, { $set: { image: targetImage } });
      console.log(`[UPDATED CATEGORY] "${c.name}" (${c.slug}) -> ${targetImage}`);
      count++;
    }
  }

  console.log(`Finished checking categories. Updated ${count} categories.`);
  await mongoose.disconnect();
}

fixCategories().catch(console.error);

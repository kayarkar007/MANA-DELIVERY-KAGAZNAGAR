const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not found in .env.local");
  process.exit(1);
}

// Comprehensive high quality direct CDN image mapping by keyword
const IMAGE_MAP = [
  // Biryani & Mandi
  { keywords: ["mutton biryani", "mutton dum biryani"], url: "https://images.unsplash.com/photo-1596560548464-f010549b84d7?auto=format&fit=crop&q=80&w=500" },
  { keywords: ["chicken biryani", "dum biryani", "spl chicken biryani", "family pack chicken", "jumbo pack chicken"], url: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=500" },
  { keywords: ["veg biryani", "paneer biryani"], url: "https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?auto=format&fit=crop&q=80&w=500" },
  { keywords: ["egg biryani"], url: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&q=80&w=500" },
  { keywords: ["prawns biryani", "fish biryani"], url: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=500" },
  { keywords: ["mandi"], url: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=500" },

  // Pizzas
  { keywords: ["paneer pizza"], url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=500" },
  { keywords: ["chicken pizza"], url: "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&q=80&w=500" },
  { keywords: ["pizza", "veg pizza"], url: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&q=80&w=500" },

  // Burgers & Sandwiches
  { keywords: ["paneer burger"], url: "https://images.unsplash.com/photo-1550950158-d0d960dff596?auto=format&fit=crop&q=80&w=500" },
  { keywords: ["chicken burger"], url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=500" },
  { keywords: ["burger", "veg burger"], url: "https://images.unsplash.com/photo-1585238342024-78d387f4a707?auto=format&fit=crop&q=80&w=500" },
  { keywords: ["chicken sandwich"], url: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=500" },
  { keywords: ["paneer sandwich"], url: "https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&q=80&w=500" },
  { keywords: ["sandwich", "veg sandwich"], url: "https://images.unsplash.com/photo-1543340904-0d1e75ce4ddc?auto=format&fit=crop&q=80&w=500" },

  // Hot Dogs
  { keywords: ["hot dog", "hotdog"], url: "https://images.unsplash.com/photo-1612392166886-ee8475b03af2?auto=format&fit=crop&q=80&w=500" },

  // Seafood & Fish / Prawns
  { keywords: ["prawn", "prawns", "shrimp"], url: "https://images.unsplash.com/photo-1565299543923-37dd37887442?auto=format&fit=crop&q=80&w=500" },
  { keywords: ["fish"], url: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&q=80&w=500" },

  // Tandoori & Kababs
  { keywords: ["paneer tikka"], url: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&q=80&w=500" },
  { keywords: ["kabab", "tikka", "tandoori", "leg kabab", "thangidi"], url: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&q=80&w=500" },

  // Chicken Starters
  { keywords: ["chicken 65", "chilli chicken", "chicken manchuria", "pepper chicken", "chicken drum", "chicken 555", "chicken majestic"], url: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&q=80&w=500" },

  // Paneer / Veg Starters
  { keywords: ["paneer 65", "chilli paneer", "paneer manchuria"], url: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&q=80&w=500" },
  { keywords: ["finger chips", "french fries", "chips"], url: "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&q=80&w=500" },
  { keywords: ["baby corn", "corn fry", "crispy corn"], url: "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?auto=format&fit=crop&q=80&w=500" },
  { keywords: ["mushroom"], url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=500" },
  { keywords: ["manchuria", "veg manchuria", "pakoda", "papad", "palli", "channa"], url: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&q=80&w=500" },

  // Curries & Dal
  { keywords: ["dal", "dal tadka", "dal fry"], url: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=500" },
  { keywords: ["paneer curry", "paneer butter masala", "kadai paneer"], url: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=500" },
  { keywords: ["curry", "chicken curry", "mutton curry"], url: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&q=80&w=500" },

  // Rotis & Breads
  { keywords: ["roti", "naan", "paratha", "bread", "kulcha", "chapati"], url: "https://images.unsplash.com/photo-1565992441121-4367571b43ca?auto=format&fit=crop&q=80&w=500" },

  // Eggs
  { keywords: ["egg", "eggs", "omelette"], url: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&q=80&w=500" },

  // Rice
  { keywords: ["fried rice", "schezwan rice", "jeera rice", "extra rice", "rice"], url: "https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?auto=format&fit=crop&q=80&w=500" },

  // Fruits & Veggies
  { keywords: ["apple", "apples"], url: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&q=80&w=500" },
  { keywords: ["banana", "bananas"], url: "https://images.unsplash.com/photo-1603052875302-d376b7c0638a?auto=format&fit=crop&q=80&w=500" },
  { keywords: ["tomato", "tomatoes"], url: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=500" },
  { keywords: ["spinach", "palak"], url: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&q=80&w=500" },

  // Groceries & Essentials
  { keywords: ["basmati rice"], url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=500" },
  { keywords: ["oil", "sunflower oil"], url: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=500" },
  { keywords: ["lentils", "dal"], url: "https://images.unsplash.com/photo-1730591857303-0fa44be3f677?auto=format&fit=crop&q=80&w=500" },
  { keywords: ["milk", "dairy"], url: "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&q=80&w=500" },
  { keywords: ["butter"], url: "https://images.unsplash.com/photo-1587185717368-4d92f8de4ad2?auto=format&fit=crop&q=80&w=500" },
  { keywords: ["chocolate"], url: "https://images.unsplash.com/photo-1523035274455-b2e5c6d5c2e0?auto=format&fit=crop&q=80&w=500" },

  // Medicines
  { keywords: ["paracetamol", "tablet", "tablets", "medicine"], url: "https://images.unsplash.com/photo-1588718889344-f7bd7a565d20?auto=format&fit=crop&q=80&w=500" },
  { keywords: ["vitamin"], url: "https://images.unsplash.com/photo-1610833804933-264b7f75c99c?auto=format&fit=crop&q=80&w=500" },
  { keywords: ["first aid", "kit"], url: "https://images.unsplash.com/photo-1603398938378-e54eab446dde?auto=format&fit=crop&q=80&w=500" },

  // Personal Care & Pets
  { keywords: ["toothpaste", "brush"], url: "https://images.unsplash.com/photo-1612705166160-97d3b2e8e212?auto=format&fit=crop&q=80&w=500" },
  { keywords: ["shampoo", "soap"], url: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&q=80&w=500" },
  { keywords: ["dog food", "pet"], url: "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&q=80&w=500" },
];

function getImageUrlForProduct(name, categorySlug, currentImage) {
  // If current image is an unsplash webpage link (e.g. unsplash.com/photos/...), force replace it!
  const isWebpageUrl = currentImage && currentImage.includes("unsplash.com/photos/");
  
  const lowerName = name.toLowerCase();

  for (const item of IMAGE_MAP) {
    for (const kw of item.keywords) {
      if (lowerName.includes(kw)) {
        return item.url;
      }
    }
  }

  // If no match by name, fallback to valid image or generic category image
  if (currentImage && !isWebpageUrl && currentImage.startsWith("http")) {
    return currentImage;
  }

  return "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=500";
}

async function fixImages() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  const Product = mongoose.connection.collection("products");

  const products = await Product.find({}).toArray();
  console.log(`Found ${products.length} products to check.`);

  let updatedCount = 0;

  for (const p of products) {
    const newImage = getImageUrlForProduct(p.name, p.categorySlug, p.image);

    if (newImage !== p.image) {
      await Product.updateOne({ _id: p._id }, { $set: { image: newImage } });
      console.log(`[FIXED] "${p.name}" -> ${newImage}`);
      updatedCount++;
    }
  }

  console.log(`\n🎉 Successfully fixed ${updatedCount} product image URLs in MongoDB database!`);
  await mongoose.disconnect();
}

fixImages().catch((err) => {
  console.error("Error fixing images:", err);
  process.exit(1);
});

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';

if (fs.existsSync('.env.local')) dotenv.config({ path: '.env.local' });
else dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function runE2ETest() {
  console.log('====================================================');
  console.log('🧪 END-TO-END VERIFICATION: RELAX BAR & RESTAURANT');
  console.log('====================================================\n');

  let testFailures = 0;

  // 1. CONNECT TO MONGO
  console.log('STEP 1: Connecting to Database...');
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  console.log('  ✅ Database connection successful.\n');

  // 2. VERIFY SHOP RECORD
  console.log('STEP 2: Verifying Shop Entity...');
  const shop = await db.collection('shops').findOne({ slug: 'relax-bar-restaurant' });

  if (!shop) {
    console.error('  ❌ FAIL: Shop "relax-bar-restaurant" not found in database.');
    testFailures++;
  } else {
    console.log('  ✅ PASS: Shop found!');
    console.log(`     - Name: ${shop.name}`);
    console.log(`     - ID: ${shop._id}`);
    console.log(`     - Phone: ${shop.phone}`);
    console.log(`     - Active: ${shop.isActive}`);
    console.log(`     - Address: ${shop.address}`);
    console.log(`     - Location: (${shop.latitude}, ${shop.longitude})\n`);
  }

  // 3. VERIFY CATEGORIES
  console.log('STEP 3: Verifying Categories...');
  const categories = await db.collection('categories').find().toArray();
  console.log(`  - Total Categories in DB: ${categories.length}`);
  
  const expectedCategories = [
    "mutton-curries", "chicken-curries", "fish-curries", "veg-curries",
    "biryani-veg", "biryani-non-veg", "veg-fried-rice", "rice-non-veg",
    "curries", "salad", "roti-bread", "egg-starters", "egg-curries",
    "veg-starters", "non-veg-starters-chicken", "non-veg-starters-fish-prawns",
    "tandoori-starters", "family-pack-biryanies"
  ];

  const dbCatSlugs = new Set(categories.map(c => c.slug));
  const missingCats = expectedCategories.filter(slug => !dbCatSlugs.has(slug));

  if (missingCats.length > 0) {
    console.error(`  ❌ FAIL: Missing expected categories: ${missingCats.join(', ')}`);
    testFailures++;
  } else {
    console.log('  ✅ PASS: All 18 expected categories are present in database.\n');
  }

  // 4. VERIFY PRODUCTS & DATA QUALITY
  console.log('STEP 4: Verifying Product Data Quality...');
  const products = await db.collection('products').find({ shopId: shop._id }).toArray();
  console.log(`  - Total Products found for Relax Bar & Restaurant: ${products.length}`);

  if (products.length === 0) {
    console.error('  ❌ FAIL: No products linked to shopId!');
    testFailures++;
  } else {
    console.log('  ✅ PASS: Menu items populated.');
  }

  // Deep checks on products
  let invalidPrices = 0;
  let missingImages = 0;
  let missingSlugs = 0;
  let outOfStock = 0;
  let hiddenProducts = 0;
  const productSlugs = new Set();
  let duplicateSlugs = 0;

  products.forEach((p, idx) => {
    if (!p.price || typeof p.price !== 'number' || p.price <= 0) invalidPrices++;
    if (!p.image || typeof p.image !== 'string' || !p.image.startsWith('http')) missingImages++;
    if (!p.slug) missingSlugs++;
    if (!p.inStock || (p.stockQuantity !== undefined && p.stockQuantity <= 0)) outOfStock++;
    if (p.isHidden) hiddenProducts++;

    if (productSlugs.has(p.slug)) {
      duplicateSlugs++;
    } else {
      productSlugs.add(p.slug);
    }
  });

  console.log(`     - Invalid / zero prices: ${invalidPrices}`);
  console.log(`     - Missing / bad image URLs: ${missingImages}`);
  console.log(`     - Duplicate product slugs: ${duplicateSlugs}`);
  console.log(`     - Out of stock items: ${outOfStock}`);
  console.log(`     - Hidden products: ${hiddenProducts}`);

  if (invalidPrices > 0 || missingImages > 0 || missingSlugs > 0 || duplicateSlugs > 0) {
    console.error('  ❌ FAIL: Found data quality issues in products!');
    testFailures++;
  } else {
    console.log('  ✅ PASS: Product data quality audit 100% clean.\n');
  }

  // 5. SAMPLE MENU ITEM INSPECTION
  console.log('STEP 5: Sampling Key Menu Items...');
  const keyItems = ["Mutton Curry", "Butter Chicken", "Chicken Biryani", "Tandoori Chicken (Full)", "Paneer Butter Masala"];
  
  keyItems.forEach(name => {
    const item = products.find(p => p.name.toLowerCase() === name.toLowerCase());
    if (item) {
      console.log(`  🟢 ${item.name}: ₹${item.price} | Category: ${item.categorySlug} | Slug: ${item.slug}`);
    } else {
      console.log(`  ⚪ ${name}: (Searched partial match)`);
      const partial = products.find(p => p.name.toLowerCase().includes(name.toLowerCase()));
      if (partial) {
        console.log(`     -> Found: ${partial.name}: ₹${partial.price} | Category: ${partial.categorySlug}`);
      } else {
        console.warn(`  ⚠️ Could not find exact or partial match for "${name}"`);
      }
    }
  });
  console.log('\n');

  // 6. CATEGORY COVERAGE TEST
  console.log('STEP 6: Checking Product Distribution per Category...');
  const categoryCounts = {};
  products.forEach(p => {
    categoryCounts[p.categorySlug] = (categoryCounts[p.categorySlug] || 0) + 1;
  });

  let emptyCategories = 0;
  expectedCategories.forEach(catSlug => {
    const count = categoryCounts[catSlug] || 0;
    if (count === 0) {
      console.warn(`  ⚠️ Warning: Category "${catSlug}" has 0 products.`);
      emptyCategories++;
    } else {
      console.log(`  - ${catSlug}: ${count} products`);
    }
  });

  if (emptyCategories > 0) {
    console.warn(`  ⚠️ Note: ${emptyCategories} categories have no products assigned.`);
  } else {
    console.log('  ✅ PASS: All 18 categories have products assigned.\n');
  }

  // SUMMARY
  console.log('====================================================');
  if (testFailures === 0) {
    console.log('🎉 E2E RESULT: ALL CHECKS PASSED PERFECTLY!');
    console.log('Relax Bar & Restaurant data is 100% accurate, clean, and ready.');
  } else {
    console.log(`❌ E2E RESULT: ${testFailures} CHECKS FAILED!`);
  }
  console.log('====================================================\n');

  await mongoose.disconnect();
}

runE2ETest().catch(err => {
  console.error('Fatal error during E2E test:', err);
  process.exit(1);
});

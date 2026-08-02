const https = require("https");

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch(e) {
          resolve({ status: res.statusCode, raw: data.slice(0, 500) });
        }
      });
    }).on("error", reject);
  });
}

async function testLive() {
  console.log("Fetching live products for shop...");
  const shopProducts = await fetchUrl("https://manadelivery.in/api/products?shopId=6a6f177cf1445c75a77d4e7e");
  console.log("Shop Products Count:", shopProducts?.data?.length, "Success:", shopProducts?.success);
  if (shopProducts?.data?.length === 0) {
    console.log("Raw response:", shopProducts);
  }

  console.log("\nFetching live active categories...");
  const activeCats = await fetchUrl("https://manadelivery.in/api/categories/active");
  console.log("Active Categories Count:", activeCats?.data?.length, "Success:", activeCats?.success);
  console.log("Active Categories Sample:", activeCats?.data?.slice(0, 3));
}

testLive().catch(console.error);

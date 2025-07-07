const express = require("express");
const cors = require("cors");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Read products data
const productsData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "products.json"), "utf8")
);

// Cache for gold price (to avoid too many API calls)
let goldPriceCache = {
  price: null,
  timestamp: null,
  expiry: 5 * 60 * 1000, // 5 minutes
};

// Function to get current gold price
async function getGoldPrice() {
  const now = Date.now();

  // Check if cache is valid
  if (
    goldPriceCache.price &&
    goldPriceCache.timestamp &&
    now - goldPriceCache.timestamp < goldPriceCache.expiry
  ) {
    return goldPriceCache.price;
  }

  try {
    // Using metals-api.com free tier
    const response = await axios.get("https://api.metals.live/v1/spot/gold");
    const goldPricePerOunce = response.data.price; // USD per ounce
    const goldPricePerGram = goldPricePerOunce / 31.1035; // Convert to grams

    // Update cache
    goldPriceCache = {
      price: goldPricePerGram,
      timestamp: now,
    };

    return goldPricePerGram;
  } catch (error) {
    console.error("Error fetching gold price:", error.message);

    // Fallback to a reasonable default if API fails
    const fallbackPrice = 65.0; // Approximate USD per gram

    goldPriceCache = {
      price: fallbackPrice,
      timestamp: now,
    };

    return fallbackPrice;
  }
}

// Calculate product price
function calculatePrice(popularityScore, weight, goldPrice) {
  return (popularityScore + 1) * weight * goldPrice;
}

// Convert popularity score to 5-point scale
function convertPopularityScore(score) {
  return Math.round(score * 5 * 10) / 10; // Convert to 5-point scale with 1 decimal
}

// GET /api/products - Get all products with calculated prices
app.get("/api/products", async (req, res) => {
  try {
    const goldPrice = await getGoldPrice();

    // Query parameters for filtering
    const { minPrice, maxPrice, minPopularity, maxPopularity } = req.query;

    let products = productsData.map((product) => ({
      ...product,
      price: calculatePrice(product.popularityScore, product.weight, goldPrice),
      popularityScoreOutOf5: convertPopularityScore(product.popularityScore),
    }));

    // Apply filters if provided
    if (minPrice || maxPrice) {
      products = products.filter((product) => {
        const price = product.price;
        return (
          (!minPrice || price >= parseFloat(minPrice)) &&
          (!maxPrice || price <= parseFloat(maxPrice))
        );
      });
    }

    if (minPopularity || maxPopularity) {
      products = products.filter((product) => {
        const popularity = product.popularityScoreOutOf5;
        return (
          (!minPopularity || popularity >= parseFloat(minPopularity)) &&
          (!maxPopularity || popularity <= parseFloat(maxPopularity))
        );
      });
    }

    res.json({
      success: true,
      goldPrice: goldPrice,
      products: products,
    });
  } catch (error) {
    console.error("Error in /api/products:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// GET /api/products/:id - Get single product
app.get("/api/products/:id", async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const product = productsData[productId];

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    const goldPrice = await getGoldPrice();

    const productWithPrice = {
      ...product,
      price: calculatePrice(product.popularityScore, product.weight, goldPrice),
      popularityScoreOutOf5: convertPopularityScore(product.popularityScore),
    };

    res.json({
      success: true,
      product: productWithPrice,
    });
  } catch (error) {
    console.error("Error in /api/products/:id:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// GET /api/gold-price - Get current gold price
app.get("/api/gold-price", async (req, res) => {
  try {
    const goldPrice = await getGoldPrice();
    res.json({
      success: true,
      pricePerGram: goldPrice,
      currency: "USD",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in /api/gold-price:", error);
    res.status(500).json({
      success: false,
      error: "Unable to fetch gold price",
    });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Products API: http://localhost:${PORT}/api/products`);
});

module.exports = app;

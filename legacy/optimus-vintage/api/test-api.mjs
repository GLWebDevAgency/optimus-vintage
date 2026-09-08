// Test API Connection
const testAPI = async () => {
  console.log("Testing API...");
  
  try {
    // Test health endpoint
    const health = await fetch("http://localhost:3001/api/health");
    console.log("Health status:", health.status);
    const healthData = await health.json();
    console.log("Health data:", healthData);

    // Test lots endpoint
    const lots = await fetch("http://localhost:3001/api/lots");
    console.log("Lots status:", lots.status);
    const lotsData = await lots.json();
    console.log("Lots count:", lotsData.length);
    console.log("Lots:", lotsData);

    console.log("\n✅ API is working!");
  } catch (error) {
    console.error("❌ API Error:", error.message);
  }
};

testAPI();

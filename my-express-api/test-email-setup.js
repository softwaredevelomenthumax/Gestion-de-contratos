require('dotenv').config({ path: __dirname + '/.env' });
const emailService = require("./services/emailService");

async function testEmailSetup() {
  console.log("🧪 Testing Email Service Setup...\n");
  
  // Test 1: Check if service initializes
  console.log("1. Email service initialization:", emailService ? "✅ OK" : "❌ Failed");
  
  // Test 2: Test SMTP connection
  console.log("2. Testing SMTP connection...");
  try {
    const connectionTest = await emailService.testConnection();
    console.log("   Connection test:", connectionTest.success ? "✅ OK" : `❌ Failed: ${connectionTest.error}`);
  } catch (error) {
    console.log("   Connection test: ❌ Failed:", error.message);
  }
  
  // Test 3: Environment variables
  console.log("3. Environment variables:");
  console.log(`   SMTP_HOST: ${process.env.SMTP_HOST || "❌ Missing"}`);
  console.log(`   SMTP_PORT: ${process.env.SMTP_PORT || "❌ Missing"}`);
  console.log(`   FROM_EMAIL: ${process.env.FROM_EMAIL || "❌ Missing"}`);
  
  console.log("\n🎉 Email setup test completed!");
}

testEmailSetup().catch(console.error);

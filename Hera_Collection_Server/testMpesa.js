import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

// Load from .env
const {
  MPESA_CONSUMER_KEY,
  MPESA_CONSUMER_SECRET,
  MPESA_SHORTCODE,
  MPESA_PASSKEY,
  MPESA_BASE_URL,
  MPESA_CALLBACK_URL,
} = process.env;

async function getAccessToken() {
  const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString("base64");
  try {
    const { data } = await axios.get(
      `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
      { headers: { Authorization: `Basic ${auth}` } }
    );
    console.log("✅ Access Token:", data.access_token);
    return data.access_token;
  } catch (err) {
    console.error("❌ Failed to get access token:", err.response?.data || err.message);
    process.exit(1);
  }
}

async function testStkPush() {
  const token = await getAccessToken();

  const now = new Date();
  const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate()
  ).padStart(2, "0")}${String(now.getHours()).padStart(2, "0")}${String(
    now.getMinutes()
  ).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;

  const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString("base64");

  const requestPayload = {
    BusinessShortCode: MPESA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: 1,
    PartyA: "254717180116",
    PartyB: MPESA_SHORTCODE,
    PhoneNumber: "254717180116", 
    CallBackURL: MPESA_CALLBACK_URL,
    AccountReference: "TestOrder123",
    TransactionDesc: "Testing STK Push",
  };

  try {
    const { data } = await axios.post(
      `${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
      requestPayload,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log("STK Push Response:", data);
  } catch (err) {
    console.error("STK Push Error:", err.response?.data || err.message);
  }
}

testStkPush();

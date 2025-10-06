import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendSMS(to, message) {
  try {
    const msg = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to, // E.g. "+94771234567"
    });
    console.log("✅ SMS sent:", msg.sid);
  } catch (err) {
    console.error("❌ Failed to send SMS:", err.message);
  }
}

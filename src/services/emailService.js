import emailjs from "@emailjs/nodejs";
import dotenv from "dotenv";
dotenv.config();

const emailjsServiceId = process.env.EMAILJS_SERVICE_ID;
const emailjsTemplateId = process.env.EMAILJS_TEMPLATE_ID;
const emailjsPublicKey = process.env.EMAILJS_PUBLIC_KEY;
const emailjsPrivateKey = process.env.EMAILJS_PRIVATE_KEY;
const senderName = process.env.EMAILJS_FROM_NAME || "Ophelia Cosmetic";
const senderEmail = process.env.EMAILJS_FROM_EMAIL || "hanam15c4a@gmail.com";

const parseErrorText = (text) => {
  if (!text || typeof text !== "string") return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

export const sendOtpEmail = async (email, otpCode) => {
  if (!emailjsServiceId || !emailjsTemplateId || !emailjsPublicKey || !emailjsPrivateKey) {
    throw new Error(
      "Email config missing: set EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY, EMAILJS_PRIVATE_KEY"
    );
  }

  const appName = process.env.EMAIL_APP_NAME || "Ophelia Cosmetic";
  const expiryMinutes = process.env.OTP_EXPIRY_MINUTES || "5";

  try {
    return await emailjs.send(
      emailjsServiceId,
      emailjsTemplateId,
      {
        email: email,
        passcode: otpCode,
        app_name: appName,
        expiry_minutes: String(expiryMinutes),
        sender_name: senderName,
        sender_email: senderEmail,
      },
      {
        publicKey: emailjsPublicKey,
        privateKey: emailjsPrivateKey,
      }
    );
  } catch (error) {
    const parsed = parseErrorText(error?.text);
    const detail = parsed?.text || parsed?.message || error?.text || error?.message || "Unknown EmailJS error";

    console.error("[sendOtpEmail] EmailJS send failed", {
      status: error?.status || null,
      detail,
      rawText: error?.text || null,
      errorType: error?.constructor?.name || typeof error,
    });

    throw new Error(`EmailJS send failed: ${detail}`);
  }
};

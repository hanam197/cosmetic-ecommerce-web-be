import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

export const sendOtpEmail = async (email, otpCode) => {
  const mailOptions = {
    from: `"Ophelia Cosmetic" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Registration Verification Code (OTP)",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #eee;border-radius:8px;background:#fff">
          <div style="text-align:center;padding-bottom:20px;border-bottom:1px solid #f2f2f2">
              <h2 style="color:#d86ca2;margin:0">Verification Code</h2>
          </div>

          <p style="font-size:16px;color:#333;margin:20px 0 10px">
              Hello homie!
          </p>

          <p style="font-size:16px;color:#333">
              Use the OTP below to complete your verification. This code is <strong>valid for 5 minutes</strong>.
          </p>

          <div style="text-align:center;margin:25px 0">
              <span style="display:inline-block;font-size:32px;letter-spacing:6px;font-weight:bold;color:#d86ca2;padding:15px 25px;border:3px dashed #f7c7e0;border-radius:8px">
                  ${otpCode}
              </span>
          </div>

          <p style="font-size:14px;color:#666;margin-top:30px">
              If you didn’t request this, just ignore this email — nothing will change.
          </p>

          <p style="font-size:14px;color:#666;margin-top:10px">
              Thank you for choosing <strong>Ophelia Cosmetic Store</strong>! <img data-emoji="🌟" alt="🌟" aria-label="🌟" draggable="false" src="https://fonts.gstatic.com/s/e/notoemoji/17.0/1f31f/72.png" style="width: 18px; height: 18px; vertical-align: middle;" loading="lazy">
          </p>
      </div>
    `,
  };
  return await transporter.sendMail(mailOptions);
};

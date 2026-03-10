import bcrypt from "bcryptjs";
import { randomInt } from "crypto";
import jwt from "jsonwebtoken";
import { z } from "zod";
import UserDAO from "../dao/UserDAO.js";
import OtpDAO from "../dao/OtpDAO.js";
import { sendOtpEmail } from "../services/emailService.js";

const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

const otpRequestSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("send"),
    email: z.string().email("Invalid email format"),
    type: z.enum(["register", "reset"]),
  }),
  z.object({
    action: z.literal("verify"),
    email: z.string().email("Invalid email format"),
    otp: z.string().trim().min(6, "OTP must be at least 6 characters"),
  }),
]);

const isProd = process.env.NODE_ENV === "production";
const authCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  maxAge: Number(process.env.COOKIE_EXPIRES_MS) || 86400000,
  path: "/",
};

const normalizeEmail = (email) => email.trim().toLowerCase();

export const register = async (req, res) => {
  try {
    const parsedData = registerSchema.safeParse(req.body);
    if (!parsedData.success) return res.status(400).json({ error: parsedData.error.errors[0].message });

    const { password, firstName, lastName } = parsedData.data;
    const email = normalizeEmail(parsedData.data.email);
    if (await UserDAO.findByEmail(email)) return res.status(400).json({ error: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await UserDAO.create({ email, password: hashedPassword, firstName, lastName });

    const tokenData = { userId: newUser._id, email: newUser.email, firstName: newUser.firstName, lastName: newUser.lastName };
    const token = jwt.sign(tokenData, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "1d" });

    res.cookie("token", token, authCookieOptions);
    return res.status(201).json({ message: "Registration successful", user: tokenData });
  } catch (error) { return res.status(500).json({ error: "Internal server error" }); }
};

export const login = async (req, res) => {
  try {
    const parsedData = loginSchema.safeParse(req.body);
    if (!parsedData.success) return res.status(400).json({ error: parsedData.error.errors[0].message });

    const { password } = parsedData.data;
    const email = normalizeEmail(parsedData.data.email);
    const user = await UserDAO.findByEmail(email);
    
    if (!user) return res.status(400).json({ error: "Invalid email or password" });
    if (user.authProvider === 'google') return res.status(400).json({ error: "Please sign in with Google" });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(400).json({ error: "Invalid email or password" });

    const tokenData = { userId: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName };
    const token = jwt.sign(tokenData, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "1d" });

    res.cookie("token", token, authCookieOptions);
    return res.status(200).json({ message: "Login successful", user: tokenData });
  } catch (error) { return res.status(500).json({ error: "Internal server error" }); }
};

// Lấy thông tin user (GET)
// Cập nhật thông tin user (PUT)
export const logout = (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: authCookieOptions.httpOnly,
      secure: authCookieOptions.secure,
      sameSite: authCookieOptions.sameSite,
      path: "/",
    });
    return res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error during logout" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const parsedData = resetPasswordSchema.safeParse(req.body);
    if (!parsedData.success) return res.status(400).json({ error: parsedData.error.errors[0].message });

    const email = normalizeEmail(parsedData.data.email);
    const { newPassword } = parsedData.data;

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updatedUser = await UserDAO.updatePassword(email, hashedPassword);
    if (!updatedUser) return res.status(400).json({ error: "Email not registered" });

    return res.status(200).json({ message: "Password reset successful" });
  } catch (error) { return res.status(500).json({ error: "Internal server error" }); }
};

export const handleOtp = async (req, res) => {
  try {
    const parsedData = otpRequestSchema.safeParse(req.body);
    if (!parsedData.success) return res.status(400).json({ error: parsedData.error.errors[0].message });

    const email = normalizeEmail(parsedData.data.email);

    if (parsedData.data.action === "send") {
      const { type } = parsedData.data;
      const existingUser = await UserDAO.findByEmail(email);

      if (type === "register" && existingUser) return res.status(400).json({ error: "Email already registered." });
      if (type === "reset" && !existingUser) return res.status(400).json({ error: "Email not registered." });

      const generatedOtp = randomInt(100000, 1000000).toString();
      await OtpDAO.saveOtp(email, generatedOtp);

      try {
        await sendOtpEmail(email, generatedOtp);
      } catch (error) {
        await OtpDAO.deleteOtp(email);
        throw error;
      }

      return res.status(200).json({ message: "OTP sent successfully" });
    }

    if (parsedData.data.action === "verify") {
      const { otp } = parsedData.data;
      const otpRecord = await OtpDAO.findOtp(email);

      if (!otpRecord) return res.status(400).json({ error: "OTP expired or invalid" });

      if (otpRecord.code !== String(otp)) return res.status(400).json({ error: "OTP is incorrect" });

      await OtpDAO.deleteOtp(email);
      return res.status(200).json({ message: "OTP verified" });
    }

    return res.status(400).json({ error: "Invalid action" });
  } catch (error) {
    console.error("[handleOtp] System error", {
      message: error.message,
    });

    return res.status(500).json({ error: "System error" });
  }
};

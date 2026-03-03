import bcrypt from "bcryptjs";
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

export const register = async (req, res) => {
  try {
    const parsedData = registerSchema.safeParse(req.body);
    if (!parsedData.success) return res.status(400).json({ error: parsedData.error.errors[0].message });

    const { email, password, firstName, lastName } = parsedData.data;
    if (await UserDAO.findByEmail(email)) return res.status(400).json({ error: "Email already registered" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = await UserDAO.create({ email, password: hashedPassword, firstName, lastName });

    const tokenData = { userId: newUser._id, email: newUser.email, firstName: newUser.firstName, lastName: newUser.lastName };
    const token = jwt.sign(tokenData, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "1d" });

    res.cookie("token", token, {
      httpOnly: true, secure: process.env.NODE_ENV === "production",
      maxAge: Number(process.env.COOKIE_EXPIRES_MS) || 86400000, path: "/",
    });
    return res.status(201).json({ message: "Registration successful", user: tokenData });
  } catch (error) { return res.status(500).json({ error: "Internal server error" }); }
};

export const login = async (req, res) => {
  try {
    const parsedData = loginSchema.safeParse(req.body);
    if (!parsedData.success) return res.status(400).json({ error: parsedData.error.errors[0].message });

    const { email, password } = parsedData.data;
    const user = await UserDAO.findByEmail(email);
    
    if (!user) return res.status(400).json({ error: "Invalid email or password" });
    if (user.authProvider === 'google') return res.status(400).json({ error: "Please sign in with Google" });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(400).json({ error: "Invalid email or password" });

    const tokenData = { userId: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName };
    const token = jwt.sign(tokenData, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "1d" });

    res.cookie("token", token, {
      httpOnly: true, secure: process.env.NODE_ENV === "production",
      maxAge: Number(process.env.COOKIE_EXPIRES_MS) || 86400000, path: "/",
    });
    return res.status(200).json({ message: "Login successful", user: tokenData });
  } catch (error) { return res.status(500).json({ error: "Internal server error" }); }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword || newPassword.length < 6) return res.status(400).json({ error: "Invalid data" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await UserDAO.updatePassword(email, hashedPassword);
    return res.status(200).json({ message: "Password reset successful" });
  } catch (error) { return res.status(500).json({ error: "Internal server error" }); }
};

export const handleOtp = async (req, res) => {
  try {
    const { action, email, otp, type } = req.body;

    if (action === "send") {
      if (!email) return res.status(400).json({ error: "Email is required" });
      const existingUser = await UserDAO.findByEmail(email);
      if (type === "register" && existingUser) return res.status(400).json({ error: "Email already registered." });
      if (type === "reset" && !existingUser) return res.status(400).json({ error: "Email not registered." });

      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      await OtpDAO.saveOtp(email, generatedOtp);
      await sendOtpEmail(email, generatedOtp);
      return res.status(200).json({ message: "OTP sent successfully" });
    }

    if (action === "verify") {
      if (!email || !otp) return res.status(400).json({ error: "Missing data" });
      const otpRecord = await OtpDAO.findOtp(email);
      if (!otpRecord) return res.status(400).json({ error: "OTP expired or invalid" });
      
      if (otpRecord.code === String(otp)) {
        await OtpDAO.deleteOtp(email);
        return res.status(200).json({ message: "OTP verified" });
      } else return res.status(400).json({ error: "OTP is incorrect" });
    }
    return res.status(400).json({ error: "Invalid action" });
  } catch (error) { return res.status(500).json({ error: "System error" }); }
};
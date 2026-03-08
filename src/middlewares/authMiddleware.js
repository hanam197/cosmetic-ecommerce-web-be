import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  try {
    // Đọc token từ cookie do cookie-parser xử lý
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ error: "Unauthorized - No token provided" });
    }

    // Giải mã token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Gắn userId vào request để các Controller phía sau dùng
    req.userId = decoded.userId;
    
    // Cho phép đi tiếp vào Controller
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    return res.status(401).json({ error: "Unauthorized - Invalid token" });
  }
};
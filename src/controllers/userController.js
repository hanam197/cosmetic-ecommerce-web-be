import User from "../models/User.js";
import jwt from "jsonwebtoken";

// Lấy thông tin user (GET)
export const getUserProfile = async (req, res) => {
  try {
    // req.userId được lấy từ authMiddleware
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Get Profile Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Cập nhật thông tin user (PUT)
export const updateUserProfile = async (req, res) => {
  try {
    const {
      action,
      firstName,
      lastName,
      email,
      address,
      addressId,
      paymentMethod,
      paymentId,
    } = req.body;

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.addresses) user.addresses = [];
    if (!user.paymentMethods) user.paymentMethods = [];

    // Thông tin cá nhân
    if (action === "updateInfo") {
      user.firstName = firstName || user.firstName;
      user.lastName = lastName || user.lastName;
      user.email = email || user.email;
      await user.save();

      // Tạo token mới với thông tin cập nhật
      const tokenData = {
        userId: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      };
      const newToken = jwt.sign(tokenData, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "1d",
      });

      //cookie mới với token mới
      res.cookie("token", newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // hỗ trợ cookie trên production với domain khác
        maxAge: Number(process.env.COOKIE_EXPIRES_MS) || 86400000,
        path: "/",
      });

      return res
        .status(200)
        .json({ message: "Profile updated successfully", user });
    }

    // Địa chỉ
    const handleDefaultAddressLogic = (isDefault, currentAddressId = null) => {
      if (isDefault) {
        user.addresses.forEach((addr) => {
          if (addr._id.toString() !== currentAddressId) {
            addr.isDefault = false;
          }
        });
      }
    };

    // Thêm địa chỉ mới
    if (action === "addAddress") {
      if (user.addresses.length >= 5) {
        return res
          .status(400)
          .json({ error: "You can only have up to 5 addresses." });
      }
      if (user.addresses.length === 0) {
        address.isDefault = true;
      } else {
        handleDefaultAddressLogic(address.isDefault);
      }
      user.addresses.push(address);
      await user.save();
      return res
        .status(200)
        .json({ message: "Address added", addresses: user.addresses });
    }

    // Cập nhật địa chỉ
    if (action === "updateAddress") {
      const addrToUpdate = user.addresses.id(addressId);
      if (!addrToUpdate)
        return res.status(404).json({ error: "Address not found" });

      handleDefaultAddressLogic(address.isDefault, addressId);

      addrToUpdate.recipientName = address.recipientName;
      addrToUpdate.phoneNumber = address.phoneNumber;
      addrToUpdate.province = address.province;
      addrToUpdate.provinceCode = address.provinceCode;
      addrToUpdate.district = address.district;
      addrToUpdate.districtCode = address.districtCode;
      addrToUpdate.ward = address.ward;
      addrToUpdate.wardCode = address.wardCode;
      addrToUpdate.detailAddress = address.detailAddress;
      addrToUpdate.isDefault = address.isDefault;

      await user.save();
      return res
        .status(200)
        .json({ message: "Address updated", addresses: user.addresses });
    }

    // Xóa địa chỉ
    if (action === "removeAddress") {
      const addrToRemove = user.addresses.id(addressId);
      if (addrToRemove?.isDefault && user.addresses.length > 1) {
        user.addresses = user.addresses.filter(
          (addr) => addr._id.toString() !== addressId,
        );
        if (user.addresses.length > 0) user.addresses[0].isDefault = true;
      } else {
        user.addresses = user.addresses.filter(
          (addr) => addr._id.toString() !== addressId,
        );
      }
      await user.save();
      return res
        .status(200)
        .json({ message: "Address removed", addresses: user.addresses });
    }

    // Thêm phương thức thanh toán
    if (action === "addPaymentMethod") {
      if (user.paymentMethods.length >= 5) {
        return res
          .status(400)
          .json({ error: "Limit reached (5 payment methods)." });
      }

      if (paymentMethod.isDefault) {
        user.paymentMethods.forEach((pm) => (pm.isDefault = false));
      } else if (user.paymentMethods.length === 0) {
        paymentMethod.isDefault = true;
      }

      const rawNum = paymentMethod.accountNumber;
      paymentMethod.accountNumber = `•••• •••• •••• ${rawNum.slice(-4)}`;
      user.paymentMethods.push(paymentMethod);

      await user.save();
      return res
        .status(200)
        .json({
          message: "Payment method added",
          paymentMethods: user.paymentMethods,
        });
    }

    // Xóa phương thức thanh toán
    if (action === "removePaymentMethod") {
      user.paymentMethods = user.paymentMethods.filter(
        (pm) => pm._id.toString() !== paymentId,
      );
      await user.save();
      return res
        .status(200)
        .json({
          message: "Payment method removed",
          paymentMethods: user.paymentMethods,
        });
    }

    
    // Set mặc định phương thức thanh toán
    if (action === "setDefaultPaymentMethod") {
      user.paymentMethods.forEach((pm) => (pm.isDefault = false));
      const pmToSet = user.paymentMethods.id(paymentId);
      if (pmToSet) {
        pmToSet.isDefault = true;
      } else {
        return res.status(404).json({ error: "Payment method not found" });
      }
      await user.save();
      return res
        .status(200)
        .json({
          message: "Default payment method updated",
          paymentMethods: user.paymentMethods,
        });
    }

    return res.status(400).json({ error: "Invalid action" });
  } catch (error) {
    console.error("Profile API Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

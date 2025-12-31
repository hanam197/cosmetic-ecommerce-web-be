import Cart from '../models/Cart.js';

/**
 * Get cart by user ID
 */
export const getCart = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || userId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'User ID là bắt buộc'
      });
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = await Cart.create({
        userId,
        items: [],
        totalPrice: 0,
        totalQuantity: 0
      });
    }

    res.status(200).json({
      success: true,
      data: cart,
      message: 'Lấy giỏ hàng thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy giỏ hàng',
      error: error.message
    });
  }
};

/**
 * Add item to cart
 */
export const addToCart = async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId, productName, price, quantity, image } = req.body;

    // Validation
    if (!userId || userId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'User ID là bắt buộc'
      });
    }

    if (!productId || !productName || price === undefined || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Các trường bắt buộc: productId, productName, price, quantity'
      });
    }

    if (isNaN(price) || price < 0) {
      return res.status(400).json({
        success: false,
        message: 'Giá sản phẩm không hợp lệ'
      });
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Số lượng phải là số nguyên >= 1'
      });
    }

    let cart = await Cart.findOne({ userId });

    // Create cart if not exists
    if (!cart) {
      cart = new Cart({
        userId,
        items: [],
        totalPrice: 0,
        totalQuantity: 0
      });
    }

    // Check if product already in cart
    const existingItem = cart.items.find(
      item => item.productId.toString() === productId.toString()
    );

    if (existingItem) {
      // Update quantity if product exists
      existingItem.quantity += quantity;
    } else {
      // Add new item to cart
      cart.items.push({
        productId,
        productName,
        price: Number(price),
        image: image || '',
        quantity
      });
    }

    await cart.save();

    res.status(201).json({
      success: true,
      data: cart,
      message: 'Thêm sản phẩm vào giỏ thành công'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Lỗi khi thêm sản phẩm vào giỏ',
      error: error.message
    });
  }
};

/**
 * Update item quantity in cart
 */
export const updateCartItem = async (req, res) => {
  try {
    const { userId, itemId } = req.params;
    const { quantity } = req.body;

    if (!userId || userId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'User ID là bắt buộc'
      });
    }

    if (!itemId || itemId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Item ID là bắt buộc'
      });
    }

    if (quantity === undefined || !Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Số lượng phải là số nguyên >= 1'
      });
    }

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Giỏ hàng không tìm thấy'
      });
    }

    const item = cart.items.id(itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Sản phẩm không tìm thấy trong giỏ'
      });
    }

    item.quantity = quantity;
    await cart.save();

    res.status(200).json({
      success: true,
      data: cart,
      message: 'Cập nhật sản phẩm thành công'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Lỗi khi cập nhật sản phẩm',
      error: error.message
    });
  }
};

/**
 * Remove item from cart
 */
export const removeFromCart = async (req, res) => {
  try {
    const { userId, itemId } = req.params;

    if (!userId || userId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'User ID là bắt buộc'
      });
    }

    if (!itemId || itemId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Item ID là bắt buộc'
      });
    }

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Giỏ hàng không tìm thấy'
      });
    }

    const itemExists = cart.items.some(item => item._id.toString() === itemId);
    if (!itemExists) {
      return res.status(404).json({
        success: false,
        message: 'Sản phẩm không tìm thấy trong giỏ'
      });
    }

    cart.items = cart.items.filter(item => item._id.toString() !== itemId);
    await cart.save();

    res.status(200).json({
      success: true,
      data: cart,
      message: 'Xóa sản phẩm khỏi giỏ thành công'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Lỗi khi xóa sản phẩm',
      error: error.message
    });
  }
};

/**
 * Clear entire cart
 */
export const clearCart = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || userId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'User ID là bắt buộc'
      });
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Giỏ hàng không tìm thấy'
      });
    }

    cart.items = [];
    cart.totalPrice = 0;
    cart.totalQuantity = 0;
    await cart.save();

    res.status(200).json({
      success: true,
      data: cart,
      message: 'Xóa toàn bộ giỏ thành công'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Lỗi khi xóa giỏ',
      error: error.message
    });
  }
};

/**
 * Get all carts (admin only)
 */
export const getAllCarts = async (req, res) => {
  try {
    const carts = await Cart.find();

    res.status(200).json({
      success: true,
      data: carts,
      total: carts.length,
      message: 'Lấy tất cả giỏ hàng thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách giỏ hàng',
      error: error.message
    });
  }
};

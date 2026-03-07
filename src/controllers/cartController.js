import Cart from '../models/Cart.js';

// Helper function: Find cart by userId (null for guest)
const findCart = async (userId) => {
  return Cart.findOne({ userId });
};

/**
 * Get cart by user ID (null userId means guest)
 */
export const getCart = async (req, res) => {
  try {
    const { userId } = req.query;

    let cart = await findCart(userId);

    if (!cart) {
      const cartData = { items: [], totalPrice: 0, totalQuantity: 0, userId };
      cart = await Cart.create(cartData);
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
    const { userId } = req.query;
    const { productId, sku, productName, colorName, price, quantity, image, oldPrice } = req.body;

    if (!productId || !sku || !productName || !colorName || price === undefined || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Các trường bắt buộc: productId, sku, productName, colorName, price, quantity'
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

    let cart = await findCart(userId);

    // Create cart if not exists
    if (!cart) {
      const cartData = { items: [], userId };
      cart = new Cart(cartData);
    }

    // Check if same variant already in cart
    const existingItem = cart.items.find(
      item => item.sku === sku && 
              item.colorName === colorName
    );

    if (existingItem) {
      // Update quantity if same variant exists
      existingItem.quantity += quantity;
    } else {
      // Add new item to cart
      cart.items.push({
        productId,
        sku,
        productName,
        colorName,
        price: Number(price),
        oldPrice: oldPrice ? Number(oldPrice) : undefined,
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
    const { userId, itemId } = req.query;
    const { quantity } = req.body;

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

    const cart = await findCart(userId);

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
    const { userId, itemId } = req.query;

    if (!itemId || itemId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Item ID là bắt buộc'
      });
    }

    const cart = await findCart(userId);

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
    const { userId } = req.query;

    let cart = await findCart(userId);

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
 * Merge guest cart to user cart (when user logs in)
 */
export const mergeCart = async (req, res) => {
  try {
    const { userId } = req.query;
    const { guestCart } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId là bắt buộc'
      });
    }

    if (!guestCart || !Array.isArray(guestCart.items)) {
      return res.status(400).json({
        success: false,
        message: 'guestCart với items là bắt buộc'
      });
    }

    // Get user's cart from DB
    let userCart = await findCart(userId);

    // Create new cart if not exists
    if (!userCart) {
      userCart = new Cart({
        userId,
        items: []
      });
    }

    // Merge items from guest cart
    guestCart.items.forEach(guestItem => {
      const existingItem = userCart.items.find(
        item => item.sku === guestItem.sku && 
                item.colorName === guestItem.colorName
      );

      if (existingItem) {
        // If same product exists, add quantity
        existingItem.quantity += guestItem.quantity;
      } else {
        // Otherwise add new item
        userCart.items.push(guestItem);
      }
    });

    // Save to DB
    await userCart.save();

    res.status(200).json({
      success: true,
      data: userCart,
      message: 'Hợp nhất giỏ hàng thành công'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Lỗi khi hợp nhất giỏ hàng',
      error: error.message
    });
  }
};

/**
 * Get cart for authenticated user
 */
export const getUserCart = async (req, res) => {
  try {
    const userId = req.user.id; // From auth middleware

    let cart = await findCart(userId);

    if (!cart) {
      const cartData = { items: [], totalPrice: 0, totalQuantity: 0, userId };
      cart = await Cart.create(cartData);
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
 * Sync cart from frontend to server (when user logs in)
 * Receives array of items from localStorage and merges with user's cart
 */
export const syncCart = async (req, res) => {
  try {
    const userId = req.user.id; // From auth middleware
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'items phải là array'
      });
    }

    // Get user's cart from DB
    let userCart = await findCart(userId);

    // Create new cart if not exists
    if (!userCart) {
      userCart = new Cart({
        userId,
        items: []
      });
    }

    // Merge items from frontend cart
    // Frontend sends: { productId, quantity, sku }
    for (const frontendItem of items) {
      const { productId, quantity, sku } = frontendItem;

      if (!productId || !quantity) {
        continue; // Skip invalid items
      }

      // Check if item already exists in user's cart
      const existingItem = userCart.items.find(
        item => item.productId.toString() === productId.toString() && 
                item.sku === sku
      );

      if (existingItem) {
        // If same product exists, add quantity
        existingItem.quantity += quantity;
      } else {
        // Otherwise, we would need to fetch product details
        // For now, just add basic item (frontend should send full details)
        userCart.items.push({
          productId,
          sku,
          quantity
        });
      }
    }

    // Save to DB
    await userCart.save();

    res.status(200).json({
      success: true,
      data: userCart,
      message: 'Đồng bộ giỏ hàng thành công'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Lỗi khi đồng bộ giỏ hàng',
      error: error.message
    });
  }
};

/**
 * Add to cart for authenticated user
 */
export const addToCartUser = async (req, res) => {
  try {
    const userId = req.user.id; // From auth middleware
    const { productId, sku, productName, colorName, price, quantity, image, oldPrice } = req.body;

    if (!productId || !sku || !productName || !colorName || price === undefined || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Các trường bắt buộc: productId, sku, productName, colorName, price, quantity'
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

    let cart = await findCart(userId);

    // Create cart if not exists
    if (!cart) {
      const cartData = { items: [], userId };
      cart = new Cart(cartData);
    }

    // Check if same variant already in cart
    const existingItem = cart.items.find(
      item => item.sku === sku && 
              item.colorName === colorName
    );

    if (existingItem) {
      // Update quantity if same variant exists
      existingItem.quantity += quantity;
    } else {
      // Add new item to cart
      cart.items.push({
        productId,
        sku,
        productName,
        colorName,
        price: Number(price),
        oldPrice: oldPrice ? Number(oldPrice) : undefined,
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



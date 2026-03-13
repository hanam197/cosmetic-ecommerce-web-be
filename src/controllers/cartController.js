import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

const normalizeUserId = (userId) => userId || null;

const getDisplayImage = (product, variant) => {
  if (Array.isArray(variant?.images) && variant.images.length > 0) {
    return variant.images[0];
  }
  if (product?.images?.thumbnail) {
    return product.images.thumbnail;
  }
  if (Array.isArray(product?.images?.gallery) && product.images.gallery.length > 0) {
    return product.images.gallery[0];
  }
  return '';
};

const getNormalizedVariantItem = async ({ productId, sku, colorName }) => {
  const product = await Product.findById(productId).select(
    'name price oldPrice images category variants.sku variants.colorName variants.images'
  );

  if (!product) {
    return { error: 'Sản phẩm không tồn tại' };
  }

  const variant = product.variants.find(item => item.sku === sku);

  if (!variant) {
    return { error: 'SKU không tồn tại trong sản phẩm' };
  }

  const normalizedColorName = variant.colorName || '';

  if (colorName && normalizedColorName !== colorName) {
    return { error: 'colorName không khớp với SKU của sản phẩm' };
  }

  return {
    item: {
      productId: product._id,
      sku: variant.sku,
      productName: product.name,
      colorName: normalizedColorName,
      price: Number(product.price),
      oldPrice: product.oldPrice !== undefined ? Number(product.oldPrice) : undefined,
      image: getDisplayImage(product, variant),
      category: product.category
    }
  };
};

const addOrMergeItem = (cart, normalizedItem, quantity) => {
  const existingItem = cart.items.find(
    item => item.sku === normalizedItem.sku && item.colorName === normalizedItem.colorName
  );

  if (existingItem) {
    existingItem.quantity += quantity;
    return;
  }

  cart.items.push({
    ...normalizedItem,
    quantity
  });
};

// Helper function: Find cart by userId (null for guest)
const findCart = async (userId) => {
  return Cart.findOne({ userId: normalizeUserId(userId) });
};

const buildGuestCartResponse = () => ({
  userId: null,
  items: [],
  totalPrice: 0,
  totalQuantity: 0
});

/**
 * Get cart by user ID (null userId means guest)
 */
export const getCart = async (req, res) => {
  try {
    const { userId } = req.query;
    const normalizedUserId = normalizeUserId(userId);

    if (!normalizedUserId) {
      return res.status(200).json({
        success: true,
        data: buildGuestCartResponse(),
        message: 'Guest cart không lưu trên server, vui lòng quản lý ở frontend'
      });
    }

    let cart = await findCart(normalizedUserId);

    if (!cart) {
      const cartData = { items: [], totalPrice: 0, totalQuantity: 0, userId: normalizedUserId };
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
    const normalizedUserId = normalizeUserId(req.query.userId);
    const { productId, sku, colorName, quantity } = req.body;

    if (!normalizedUserId) {
      return res.status(400).json({
        success: false,
        message: 'Guest cart không lưu trên server, vui lòng quản lý ở frontend hoặc dùng endpoint đăng nhập'
      });
    }

    if (!productId || !sku || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Các trường bắt buộc: productId, sku, quantity'
      });
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Số lượng phải là số nguyên >= 1'
      });
    }

    const normalizedVariant = await getNormalizedVariantItem({ productId, sku, colorName });
    if (normalizedVariant.error) {
      return res.status(400).json({
        success: false,
        message: normalizedVariant.error
      });
    }

    let cart = await findCart(normalizedUserId);

    // Create cart if not exists
    if (!cart) {
      const cartData = { items: [], userId: normalizedUserId };
      cart = new Cart(cartData);
    }

    addOrMergeItem(cart, normalizedVariant.item, quantity);

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
    const normalizedUserId = normalizeUserId(userId);
    const { quantity } = req.body;

    if (!normalizedUserId) {
      return res.status(400).json({
        success: false,
        message: 'Guest cart không lưu trên server, vui lòng quản lý ở frontend hoặc dùng endpoint đăng nhập'
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

    const cart = await findCart(normalizedUserId);

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
    const normalizedUserId = normalizeUserId(userId);

    if (!normalizedUserId) {
      return res.status(400).json({
        success: false,
        message: 'Guest cart không lưu trên server, vui lòng quản lý ở frontend hoặc dùng endpoint đăng nhập'
      });
    }

    if (!itemId || itemId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Item ID là bắt buộc'
      });
    }

    const cart = await findCart(normalizedUserId);

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
    const normalizedUserId = normalizeUserId(userId);

    if (!normalizedUserId) {
      return res.status(400).json({
        success: false,
        message: 'Guest cart không lưu trên server, vui lòng quản lý ở frontend hoặc dùng endpoint đăng nhập'
      });
    }

    let cart = await findCart(normalizedUserId);

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
    const userId = req.userId;
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

    for (const [index, guestItem] of guestCart.items.entries()) {
      const { productId, sku, colorName, quantity } = guestItem;

      if (!productId || !sku || !Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({
          success: false,
          message: `guestCart.items[${index}] không hợp lệ`
        });
      }

      const normalizedVariant = await getNormalizedVariantItem({ productId, sku, colorName });
      if (normalizedVariant.error) {
        return res.status(400).json({
          success: false,
          message: `guestCart.items[${index}]: ${normalizedVariant.error}`
        });
      }

      addOrMergeItem(userCart, normalizedVariant.item, quantity);
    }

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
    const userId = req.userId;

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
    const userId = req.userId;
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

    for (const [index, frontendItem] of items.entries()) {
      const { productId, quantity, sku, colorName } = frontendItem;

      if (!productId || !sku || !Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({
          success: false,
          message: `items[${index}] không hợp lệ`
        });
      }

      const normalizedVariant = await getNormalizedVariantItem({ productId, sku, colorName });
      if (normalizedVariant.error) {
        return res.status(400).json({
          success: false,
          message: `items[${index}]: ${normalizedVariant.error}`
        });
      }

      addOrMergeItem(userCart, normalizedVariant.item, quantity);
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
    const userId = req.userId;
    const { productId, sku, colorName, quantity } = req.body;

    if (!productId || !sku || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Các trường bắt buộc: productId, sku, quantity'
      });
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Số lượng phải là số nguyên >= 1'
      });
    }

    const normalizedVariant = await getNormalizedVariantItem({ productId, sku, colorName });
    if (normalizedVariant.error) {
      return res.status(400).json({
        success: false,
        message: normalizedVariant.error
      });
    }

    let cart = await findCart(userId);

    // Create cart if not exists
    if (!cart) {
      const cartData = { items: [], userId };
      cart = new Cart(cartData);
    }

    addOrMergeItem(cart, normalizedVariant.item, quantity);

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



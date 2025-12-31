import Product from '../models/Product.js';

/**
 * Get all products with pagination and filters
 */
export const getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search, sort } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    let query = { isActive: true };

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Search by name, description, brand
    if (search) {
      query.$text = { $search: search };
    }

    // Default sort by newest
    let sortObj = { createdAt: -1 };
    if (sort === 'price-asc') {
      sortObj = { price: 1 };
    } else if (sort === 'price-desc') {
      sortObj = { price: -1 };
    } else if (sort === 'rating') {
      sortObj = { rating: -1 };
    } else if (sort === 'popular') {
      sortObj = { reviews: -1 };
    }

    const products = await Product.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      },
      message: 'Lấy danh sách sản phẩm thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách sản phẩm',
      error: error.message
    });
  }
};

/**
 * Get product by ID
 */
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Sản phẩm không tìm thấy'
      });
    }

    res.status(200).json({
      success: true,
      data: product,
      message: 'Lấy chi tiết sản phẩm thành công'
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'ID sản phẩm không hợp lệ'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy chi tiết sản phẩm',
      error: error.message
    });
  }
};

/**
 * Create new product (admin only)
 */
export const createProduct = async (req, res) => {
  try {
    const { name, description, price, originalPrice, category, stock, image, images, ingredients, brand } = req.body;

    // Validation
    if (!name || !description || !price || !category) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ các trường bắt buộc: name, description, price, category'
      });
    }

    const product = new Product({
      name,
      description,
      price,
      originalPrice: originalPrice || price,
      category,
      stock: stock || 0,
      image,
      images: images || [],
      ingredients: ingredients || [],
      brand
    });

    await product.save();

    res.status(201).json({
      success: true,
      data: product,
      message: 'Tạo sản phẩm thành công'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Lỗi khi tạo sản phẩm',
      error: error.message
    });
  }
};

/**
 * Update product (admin only)
 */
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.createdAt;

    const product = await Product.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Sản phẩm không tìm thấy'
      });
    }

    res.status(200).json({
      success: true,
      data: product,
      message: 'Cập nhật sản phẩm thành công'
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'ID sản phẩm không hợp lệ'
      });
    }

    res.status(400).json({
      success: false,
      message: 'Lỗi khi cập nhật sản phẩm',
      error: error.message
    });
  }
};

/**
 * Delete product (admin only)
 */
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Sản phẩm không tìm thấy'
      });
    }

    res.status(200).json({
      success: true,
      data: product,
      message: 'Xóa sản phẩm thành công'
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'ID sản phẩm không hợp lệ'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa sản phẩm',
      error: error.message
    });
  }
};

/**
 * Get products by category
 */
export const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 10 } = req.query;

    const products = await Product.find({ category, isActive: true })
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: products,
      total: products.length,
      message: 'Lấy sản phẩm theo danh mục thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy sản phẩm theo danh mục',
      error: error.message
    });
  }
};

/**
 * Search products
 */
export const searchProducts = async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Từ khóa tìm kiếm là bắt buộc'
      });
    }

    const products = await Product.find(
      { $text: { $search: q }, isActive: true },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: products,
      total: products.length,
      message: 'Tìm kiếm sản phẩm thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tìm kiếm sản phẩm',
      error: error.message
    });
  }
};

import Product from "../models/Product.js";
import { findProducts, findProductsByCategory } from "../dao/productDAO.js";

/**
 * Get all products with pagination and filters
 */
export const getAllProducts = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 4, 1);
    const { category, tag, search } = req.query;

    const result = await findProducts({ category, tag, search, page, limit });

    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get product by slug
 */
export const getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const product = await Product.findOne({ slug });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Sản phẩm không tìm thấy",
      });
    }

    res.status(200).json({
      success: true,
      data: product,
      message: "Lấy chi tiết sản phẩm thành công",
    });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(400).json({
        success: false,
        message: "ID sản phẩm không hợp lệ",
      });
    }

    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy chi tiết sản phẩm",
      error: error.message,
    });
  }
};

/**
 * Get products by category and tags
 */
export const getProductsByCategory = async (req, res) => { // req, res are automatically created by Express for every HTTP request.
  try {
    const { category, tag } = req.params;
    const { sortByPrice, page: pageQuery, limit: limitQuery } = req.query;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;

    const filter = {};
    // category filter
    if (category && category) filter.category = category;
    // tag filter
    if (tag) filter.tag = tag;

    const result = await findProductsByCategory({
      filter,
      page,
      limit,
      sortByPrice
    });

    res.status(200).json({
      data: result.products,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * Search products
 */
export const searchProducts = async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Từ khóa tìm kiếm là bắt buộc",
      });
    }

    const products = await Product.find(
      { $text: { $search: q }, isActive: true },
      { score: { $meta: "textScore" } },
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: products,
      total: products.length,
      message: "Tìm kiếm sản phẩm thành công",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi tìm kiếm sản phẩm",
      error: error.message,
    });
  }
};

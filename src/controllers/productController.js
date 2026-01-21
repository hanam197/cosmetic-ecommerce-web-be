import Product from "../models/Product.js";

/**
 * Get all products with pagination and filters
 */
export const getAllProducts = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 4, 1);
    const { category, tag, search } = req.query;

    const filter = {};

    // category filter (all = không filter)
    if (category && category !== "all") {
      filter.category = category;
    }

    // tag filter
    if (tag) {
      filter.tag = tag;
    }

    // search theo name
    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    const total = await Product.countDocuments(filter);

    // query dữ liệu với pagination
    const products = await Product.find(filter)
      // .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // tính toán pagination
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null,
      },
    });
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
      message: "Lấy sản phẩm theo danh mục thành công",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy sản phẩm theo danh mục",
      error: error.message,
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

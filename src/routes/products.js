import express from 'express';

const router = express.Router();

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Lấy danh sách sản phẩm
 *     description: API để lấy danh sách tất cả các sản phẩm mỹ phẩm
 *     tags:
 *       - Products
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Số trang (mặc định là 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Số sản phẩm mỗi trang (mặc định là 10)
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       price:
 *                         type: number
 *                       description:
 *                         type: string
 *       500:
 *         description: Lỗi server
 */
router.get('/api/products', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  const mockProducts = [
    {
      id: '1',
      name: 'Kem dưỡng da',
      price: 150000,
      description: 'Kem dưỡng da hữu cơ cao cấp',
    },
    {
      id: '2',
      name: 'Mặt nạ dưỡng ẩm',
      price: 200000,
      description: 'Mặt nạ dưỡng ẩm chuyên sâu',
    },
    {
      id: '3',
      name: 'Nước toner',
      price: 120000,
      description: 'Nước toner cân bằng da',
    },
  ];

  res.json({
    success: true,
    data: mockProducts.slice((page - 1) * limit, page * limit),
    pagination: {
      page,
      limit,
      total: mockProducts.length,
    },
  });
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Lấy chi tiết sản phẩm
 *     description: API để lấy chi tiết một sản phẩm theo ID
 *     tags:
 *       - Products
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của sản phẩm
 *     responses:
 *       200:
 *         description: Chi tiết sản phẩm thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     price:
 *                       type: number
 *                     description:
 *                       type: string
 *       404:
 *         description: Sản phẩm không tìm thấy
 *       500:
 *         description: Lỗi server
 */
router.get('/api/products/:id', (req, res) => {
  const { id } = req.params;
  
  const mockProducts = {
    '1': {
      id: '1',
      name: 'Kem dưỡng da',
      price: 150000,
      description: 'Kem dưỡng da hữu cơ cao cấp',
      ingredients: ['Vitamin E', 'Collagen', 'Glycerin'],
    },
    '2': {
      id: '2',
      name: 'Mặt nạ dưỡng ẩm',
      price: 200000,
      description: 'Mặt nạ dưỡng ẩm chuyên sâu',
      ingredients: ['Hyaluronic Acid', 'Aloe Vera'],
    },
    '3': {
      id: '3',
      name: 'Nước toner',
      price: 120000,
      description: 'Nước toner cân bằng da',
      ingredients: ['Rose Water', 'Green Tea Extract'],
    },
  };

  const product = mockProducts[id];
  
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Sản phẩm không tìm thấy',
    });
  }

  res.json({
    success: true,
    data: product,
  });
});

export default router;

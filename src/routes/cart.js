import express from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getAllCarts
} from '../controllers/cartController.js';

const router = express.Router();

/**
 * @swagger
 * /api/cart/{userId}:
 *   get:
 *     summary: Lấy giỏ hàng của người dùng
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của người dùng
 *     responses:
 *       200:
 *         description: Lấy giỏ hàng thành công
 *       400:
 *         description: User ID là bắt buộc
 *       500:
 *         description: Lỗi server
 */
router.get('/:userId', getCart);

/**
 * @swagger
 * /api/cart/{userId}/add:
 *   post:
 *     summary: Thêm sản phẩm vào giỏ
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - productName
 *               - price
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *               productName:
 *                 type: string
 *               price:
 *                 type: number
 *               quantity:
 *                 type: number
 *               image:
 *                 type: string
 *     responses:
 *       201:
 *         description: Thêm sản phẩm thành công
 *       400:
 *         description: Thiếu dữ liệu hoặc dữ liệu không hợp lệ
 *       500:
 *         description: Lỗi server
 */
router.post('/:userId/add', addToCart);

/**
 * @swagger
 * /api/cart/{userId}/item/{itemId}:
 *   patch:
 *     summary: Cập nhật số lượng sản phẩm
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: number
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Giỏ hoặc sản phẩm không tìm thấy
 *       400:
 *         description: Dữ liệu không hợp lệ
 */
router.patch('/:userId/item/:itemId', updateCartItem);

/**
 * @swagger
 * /api/cart/{userId}/item/{itemId}:
 *   delete:
 *     summary: Xóa sản phẩm khỏi giỏ
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Giỏ hoặc sản phẩm không tìm thấy
 */
router.delete('/:userId/item/:itemId', removeFromCart);

/**
 * @swagger
 * /api/cart/{userId}/clear:
 *   delete:
 *     summary: Xóa toàn bộ giỏ hàng
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Giỏ không tìm thấy
 */
router.delete('/:userId/clear', clearCart);

/**
 * @swagger
 * /api/cart/admin/all:
 *   get:
 *     summary: Lấy tất cả giỏ hàng (admin)
 *     tags: [Cart]
 *     responses:
 *       200:
 *         description: Lấy thành công
 *       500:
 *         description: Lỗi server
 */
router.get('/admin/all', getAllCarts);

export default router;

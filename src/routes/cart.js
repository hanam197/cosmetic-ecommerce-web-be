import express from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  mergeCart,
  getUserCart,
  syncCart,
  addToCartUser
} from '../controllers/cartController.js';

const router = express.Router();

/**
 * @swagger1
 * 
 * /api/cart/merge:
 *   post:
 *     summary: Hợp nhất giỏ hàng khách vào giỏ hàng user (khi user đăng nhập)
 *     tags: [Cart]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - guestCart
 *             properties:
 *               guestCart:
 *                 type: object
 *                 properties:
 *                   items:
 *                     type: array
 *     responses:
 *       200:
 *         description: Hợp nhất thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 */
router.post('/merge', mergeCart);

/**
 * @swagger
 * /api/cart/clear:
 *   delete:
 *     summary: Xóa toàn bộ giỏ hàng
 *     tags: [Cart]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Giỏ không tìm thấy
 */
router.delete('/clear', clearCart);

/**
 * @swagger
 * /api/cart/add:
 *   post:
 *     summary: Thêm sản phẩm vào giỏ
 *     tags: [Cart]
 *     parameters:
 *       - in: query
 *         name: userId
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
 *               - sku
 *               - productName
 *               - colorName
 *               - price
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *               sku:
 *                 type: string
 *               productName:
 *                 type: string
 *               colorName:
 *                 type: string
 *               price:
 *                 type: number
 *               oldPrice:
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
router.post('/add', addToCart);

/**
 * @swagger
 * /api/cart/item:
 *   patch:
 *     summary: Cập nhật số lượng sản phẩm
 *     tags: [Cart]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
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
router.patch('/item', updateCartItem);

/**
 * @swagger
 * /api/cart/item:
 *   delete:
 *     summary: Xóa sản phẩm khỏi giỏ
 *     tags: [Cart]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
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
router.delete('/item', removeFromCart);

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Lấy giỏ hàng của người dùng (null userId là khách)
 *     tags: [Cart]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: ID của người dùng (optional, null cho khách)
 *     responses:
 *       200:
 *         description: Lấy giỏ hàng thành công
 *       500:
 *         description: Lỗi server
 */
router.get('/', getCart);

/**
 * @swagger
 * /api/cart/user:
 *   get:
 *     summary: Lấy giỏ hàng của user đã login
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy giỏ hàng thành công
 *       401:
 *         description: Chưa đăng nhập
 *       500:
 *         description: Lỗi server
 */
router.get('/user', getUserCart);

/**
 * @swagger
 * /api/cart/sync:
 *   post:
 *     summary: Đồng bộ giỏ hàng từ frontend lên server (khi user login)
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     sku:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Đồng bộ thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa đăng nhập
 */
router.post('/sync', syncCart);

/**
 * @swagger
 * /api/cart/add-auth:
 *   post:
 *     summary: Thêm sản phẩm vào giỏ (cho user đã login)
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - sku
 *               - productName
 *               - colorName
 *               - price
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *               sku:
 *                 type: string
 *               productName:
 *                 type: string
 *               colorName:
 *                 type: string
 *               price:
 *                 type: number
 *               quantity:
 *                 type: integer
 *               image:
 *                 type: string
 *               oldPrice:
 *                 type: number
 *     responses:
 *       201:
 *         description: Thêm sản phẩm thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa đăng nhập
 */
router.post('/add-auth', addToCartUser);

export default router;

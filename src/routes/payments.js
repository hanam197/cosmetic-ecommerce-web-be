import express from 'express';
import { 
  createVNPayPayment, 
  handleVNPayReturn,
  handleVNPayIPN,
  getPaymentStatus,
  verifyVNPayReturn,
  vnpayWebhook 
} from '../controllers/paymentController.js';

const router = express.Router();

/**
 * @swagger
 * /api/payment/create-vnpay:
 *   post:
 *     summary: Tạo URL thanh toán VNPay
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - amount
 *               - orderCode
 *             properties:
 *               orderId:
 *                 type: string
 *               amount:
 *                 type: number
 *               orderCode:
 *                 type: string
 *               orderInfo:
 *                 type: string
 *               ipAddr:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tạo URL thanh toán thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       500:
 *         description: Lỗi server
 */
router.post('/create-vnpay', createVNPayPayment);

/**
 * @swagger
 * /api/payment/vnpay-return:
 *   get:
 *     summary: URL trả về từ VNPay
 *     tags: [Payment]
 *     parameters:
 *       - in: query
 *         name: vnp_ResponseCode
 *         schema:
 *           type: string
 *       - in: query
 *         name: vnp_TxnRef
 *         schema:
 *           type: string
 *       - in: query
 *         name: vnp_TransactionNo
 *         schema:
 *           type: string
 *       - in: query
 *         name: vnp_Amount
 *         schema:
 *           type: string
 *       - in: query
 *         name: vnp_TransactionStatus
 *         schema:
 *           type: string
 *       - in: query
 *         name: vnp_SecureHash
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xác minh thanh toán thành công
 *       400:
 *         description: Thanh toán không thành công
 *       500:
 *         description: Lỗi server
 */
router.get('/vnpay-return', handleVNPayReturn);

/**
 * @swagger
 * /api/payment/vnpay-ipn:
 *   get:
 *     summary: IPN Webhook từ VNPAY (xử lý callback thanh toán)
 *     tags: [Payment]
 *     parameters:
 *       - in: query
 *         name: vnp_ResponseCode
 *         schema:
 *           type: string
 *       - in: query
 *         name: vnp_TxnRef
 *         schema:
 *           type: string
 *       - in: query
 *         name: vnp_TransactionNo
 *         schema:
 *           type: string
 *       - in: query
 *         name: vnp_Amount
 *         schema:
 *           type: string
 *       - in: query
 *         name: vnp_SecureHash
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: IPN được xử lý thành công
 *       500:
 *         description: Lỗi server
 */
router.get('/vnpay-ipn', handleVNPayIPN);

/**
 * @swagger
 * /api/payment/{orderId}/status:
 *   get:
 *     summary: Kiểm tra trạng thái thanh toán
 *     tags: [Payment]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lấy trạng thái thanh toán thành công
 *       404:
 *         description: Đơn hàng không tìm thấy
 *       500:
 *         description: Lỗi server
 */
router.get('/:orderId/status', getPaymentStatus);

/**
 * @swagger
 * /api/payment/{orderId}/verify-return:
 *   get:
 *     summary: Xác thực kết quả trả về từ VNPay
 *     tags: [Payment]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: vnp_ResponseCode
 *         schema:
 *           type: string
 *       - in: query
 *         name: vnp_TxnRef
 *         schema:
 *           type: string
 *       - in: query
 *         name: vnp_TransactionNo
 *         schema:
 *           type: string
 *       - in: query
 *         name: vnp_Amount
 *         schema:
 *           type: string
 *       - in: query
 *         name: vnp_SecureHash
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xác thực thành công
 *       400:
 *         description: Xác thực thất bại
 *       500:
 *         description: Lỗi server
 */
router.get('/:orderId/verify-return', verifyVNPayReturn);

/**
 * @swagger
 * /api/payment/webhook:
 *   post:
 *     summary: Webhook từ VNPay (legacy endpoint)
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderCode:
 *                 type: string
 *               transactionId:
 *                 type: string
 *               transactionStatus:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Webhook được xử lý thành công
 *       500:
 *         description: Lỗi server
 */
router.post('/webhook', vnpayWebhook);

export default router;

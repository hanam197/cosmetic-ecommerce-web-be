import { VNPay } from 'vnpay';
import dotenv from 'dotenv';
dotenv.config();

class VNPayService {
  constructor() {
    this.vnpay = new VNPay({
      tmnCode: process.env.VNPAY_TMN_CODE,
      secureSecret: process.env.VNPAY_SECRET_KEY,
      vnpayHost: process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn',
      testMode: true,
      hashAlgorithm: 'SHA512',
      enableLog: true,
    });
    console.log('✓ VNPayService initialized with vnpay library');
  }

  /**
   * Tạo URL thanh toán
   * @param {Object} orderData - Dữ liệu đơn hàng
   * @returns {Object} - { success, paymentUrl, orderCode }
   */
  createPaymentUrl(orderData) {
    try {
      console.log('=== createPaymentUrl START ===');
      console.log('Order data:', orderData);

      const { orderId, orderCode, amount, orderInfo, ipAddr, bankCode } = orderData;

      const paymentUrl = this.vnpay.buildPaymentUrl({
        vnp_Amount: amount, // Amount in VND (not x100, library handles it)
        vnp_IpAddr: ipAddr || '127.0.0.1',
        vnp_ReturnUrl: process.env.VNPAY_RETURN_URL || 'http://localhost:3000/api/payment/vnpay-return',
        vnp_TxnRef: orderCode,
        vnp_OrderInfo: orderInfo || `Thanh toan don hang ${orderCode}`,
        vnp_OrderType: 'other',
        vnp_Locale: 'vn',
        ...(bankCode && { vnp_BankCode: bankCode }),
      });

      console.log('✓ Payment URL created successfully');
      console.log('=== createPaymentUrl SUCCESS ===');

      return {
        success: true,
        paymentUrl,
        orderCode,
      };
    } catch (error) {
      console.error('=== createPaymentUrl ERROR ===');
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Xác thực URL return từ VNPAY (khi user quay lại từ payment gateway)
   * @param {Object} query - Query parameters từ URL return
   * @returns {Object} - Kết quả xác thực
   */
  verifyReturnUrl(query) {
    try {
      console.log('=== verifyReturnUrl START ===');
      console.log('Query params:', query);

      const verify = this.vnpay.verifyReturnUrl(query);

      console.log('Verification result:', verify);

      if (!verify.isSuccess) {
        console.log('=== verifyReturnUrl FAILED ===');
        return {
          success: false,
          valid: false,
          message: verify.message,
          code: verify.vnp_ResponseCode || '99',
        };
      }

      console.log('=== verifyReturnUrl SUCCESS ===');
      return {
        success: true,
        valid: true,
        orderCode: verify.vnp_TxnRef,
        transactionId: verify.vnp_TransactionNo,
        amount: verify.vnp_Amount,
        bankCode: verify.vnp_BankCode,
        bankTranNo: verify.vnp_BankTranNo,
        cardType: verify.vnp_CardType,
        payDate: verify.vnp_PayDate,
        message: verify.message,
      };
    } catch (error) {
      console.error('=== verifyReturnUrl ERROR ===');
      console.error('Error:', error.message);
      return {
        success: false,
        valid: false,
        message: error.message,
        code: '99',
      };
    }
  }

  /**
   * Xác thực URL IPN từ VNPAY (webhook callback từ server VNPAY)
   * @param {Object} query - Query parameters từ IPN request
   * @returns {Object} - Kết quả xác thực
   */
  verifyIpnUrl(query) {
    try {
      console.log('=== verifyIpnUrl START ===');
      console.log('IPN Query params:', query);

      const verify = this.vnpay.verifyIpnUrl(query);

      console.log('IPN Verification result:', verify);

      if (!verify.isSuccess) {
        console.log('=== verifyIpnUrl FAILED ===');
        return {
          valid: false,
          message: verify.message,
          code: verify.vnp_ResponseCode || '97',
          orderId: verify.vnp_TxnRef,
          rspCode: verify.vnp_ResponseCode,
          transactionStatus: verify.vnp_TransactionStatus,
        };
      }

      console.log('=== verifyIpnUrl SUCCESS ===');
      return {
        valid: true,
        message: verify.message,
        code: '00',
        orderId: verify.vnp_TxnRef,
        rspCode: verify.vnp_ResponseCode,
        transactionStatus: verify.vnp_TransactionStatus,
        transactionNo: verify.vnp_TransactionNo,
        amount: verify.vnp_Amount,
        bankCode: verify.vnp_BankCode,
      };
    } catch (error) {
      console.error('=== verifyIpnUrl ERROR ===');
      console.error('Error:', error.message);
      return {
        valid: false,
        message: error.message,
        code: '99',
      };
    }
  }
}

export default new VNPayService();

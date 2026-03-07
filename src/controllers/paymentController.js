import OrderDAO from '../dao/OrderDAO.js';
import vnpayService from '../services/vnpayService.js';
import { z } from 'zod';

const createPaymentSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  amount: z.number().min(1, 'Amount is required'),
  orderCode: z.string().min(1, 'Order code is required'),
  orderInfo: z.string().optional(),
  ipAddr: z.string().optional(),
  bankCode: z.string().optional()
});

// Create VNPay payment URL
export const createVNPayPayment = async (req, res) => {
  try {
    console.log('=== createVNPayPayment START ===');
    console.log('Request body:', req.body);
    
    const parsedData = createPaymentSchema.safeParse(req.body);
    
    if (!parsedData.success) {
      return res.status(400).json({ error: parsedData.error.errors[0].message });
    }

    const { orderId, amount, orderCode, orderInfo, ipAddr, bankCode } = parsedData.data;
    console.log('Extracted data:', { orderId, amount, orderCode });

    // Verify order exists
    const order = await OrderDAO.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Verify amount matches
    if (order.totalPrice !== amount) {
      return res.status(400).json({ error: 'Payment amount does not match order total' });
    }

    // Create payment URL using vnpay library
    const paymentResult = vnpayService.createPaymentUrl({
      orderId,
      orderCode,
      amount,
      orderInfo: orderInfo || `Thanh toan don hang ${orderCode}`,
      ipAddr,
      bankCode
    });

    if (!paymentResult.success) {
      console.error('Payment creation failed:', paymentResult.message);
      return res.status(400).json({ error: paymentResult.message });
    }

    console.log('=== createVNPayPayment SUCCESS ===');
    return res.status(200).json({
      message: 'Payment URL created successfully',
      paymentUrl: paymentResult.paymentUrl,
      orderCode: paymentResult.orderCode
    });
  } catch (error) {
    console.error('=== createVNPayPayment ERROR ===');
    console.error('Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};

// Handle VNPay return (user returns from VNPay payment page)
export const handleVNPayReturn = async (req, res) => {
  try {
    console.log('=== handleVNPayReturn START ===');
    const query = req.query;
    console.log('Return params:', query);

    // Get frontend URL from env or default
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';

    // Verify VNPay return using vnpay library
    const verifyResult = vnpayService.verifyReturnUrl(query);
    console.log('Verification result:', verifyResult);

    if (!verifyResult.valid) {
      console.log('Invalid signature');
      return res.redirect(`${frontendUrl}/payment-failed?code=${verifyResult.code}&message=${encodeURIComponent(verifyResult.message)}`);
    }

    if (!verifyResult.success) {
      console.log('Verification failed');
      return res.redirect(`${frontendUrl}/payment-failed?code=${verifyResult.code}&message=${encodeURIComponent(verifyResult.message)}`);
    }

    // Find order
    const order = await OrderDAO.findByOrderCode(verifyResult.orderCode);
    if (!order) {
      console.log('Order not found:', verifyResult.orderCode);
      return res.redirect(`${frontendUrl}/payment-failed?code=404&message=${encodeURIComponent('Order not found')}`);
    }

    // Update payment status - payment success
    const updatedOrder = await OrderDAO.updatePaymentStatus(
      order._id,
      'completed',
      verifyResult.transactionId
    );

    console.log('=== handleVNPayReturn SUCCESS ===');
    
    // Redirect to FE success page with order info
    const redirectUrl = `${frontendUrl}/payment-success?orderId=${updatedOrder._id}&orderCode=${updatedOrder.orderCode}&transactionId=${verifyResult.transactionId}`;
    console.log('Redirecting to:', redirectUrl);
    return res.redirect(redirectUrl);
  } catch (error) {
    console.error('Error handling VNPay return:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    return res.redirect(`${frontendUrl}/payment-failed?code=500&message=${encodeURIComponent('Internal server error')}`);
  }
};

// VNPay IPN webhook handler (VNPAY server calls this endpoint)
export const handleVNPayIPN = async (req, res) => {
  try {
    console.log('=== handleVNPayIPN START ===');
    const query = req.query;
    console.log('IPN Params:', query);

    // Verify signature using vnpay library
    const verifyResult = vnpayService.verifyIpnUrl(query);
    console.log('IPN verification result:', verifyResult);

    if (!verifyResult.valid) {
      console.log(`Returning error code: ${verifyResult.code}`);
      return res.status(200).json({
        RspCode: verifyResult.code,
        Message: verifyResult.message
      });
    }

    const orderId = verifyResult.orderId;
    const rspCode = verifyResult.rspCode;

    console.log('Processing IPN for order:', orderId, 'Response Code:', rspCode);

    // Find order
    const order = await OrderDAO.findByOrderCode(orderId);
    if (!order) {
      console.log('Order not found:', orderId);
      return res.status(200).json({
        RspCode: '01',
        Message: 'Order not found'
      });
    }

    // Check if order has already been updated
    if (order.paymentStatus !== 'pending') {
      console.log('Order already processed - current status:', order.paymentStatus);
      return res.status(200).json({
        RspCode: '02',
        Message: 'This order has been updated to the payment status'
      });
    }

    // Process based on response code
    if (rspCode === '00') {
      // Payment successful
      console.log('Payment successful - updating order status');
      await OrderDAO.updatePaymentStatus(order._id, 'completed', verifyResult.transactionNo);
      console.log('Order status updated to completed');

      return res.status(200).json({
        RspCode: '00',
        Message: 'Confirm success'
      });
    } else {
      // Payment failed
      console.log('Payment failed - updating order status to failed');
      await OrderDAO.updatePaymentStatus(order._id, 'failed', verifyResult.transactionNo);

      return res.status(200).json({
        RspCode: '00',
        Message: 'Confirm success'
      });
    }
  } catch (error) {
    console.error('=== handleVNPayIPN ERROR ===');
    console.error('Error:', error);
    return res.status(200).json({
      RspCode: '99',
      Message: 'Internal server error'
    });
  }
};

// Get payment status
export const getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await OrderDAO.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    return res.status(200).json({
      success: true,
      orderId: order._id,
      orderCode: order.orderCode,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      totalPrice: order.totalPrice,
      orderStatus: order.orderStatus,
      transactionId: order.vnpayTransactionId || null
    });
  } catch (error) {
    console.error('Error getting payment status:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Verify VNPay return and get order details
export const verifyVNPayReturn = async (req, res) => {
  try {
    const { orderId } = req.params;
    const query = req.query;

    console.log('=== verifyVNPayReturn START ===');
    console.log('Query params:', query);

    // Verify VNPay signature
    const verifyResult = vnpayService.verifyReturnUrl(query);
    console.log('Verification result:', verifyResult);

    if (!verifyResult.valid || !verifyResult.success) {
      return res.status(400).json({
        success: false,
        message: verifyResult.message,
        code: verifyResult.code
      });
    }

    // Get order details
    const order = await OrderDAO.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Check payment status
    if (order.paymentStatus !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Payment status not completed',
        paymentStatus: order.paymentStatus
      });
    }

    console.log('=== verifyVNPayReturn SUCCESS ===');
    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      order: {
        _id: order._id,
        orderCode: order.orderCode,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        totalPrice: order.totalPrice
      },
      paymentDetails: {
        transactionId: verifyResult.transactionId,
        amount: verifyResult.amount,
        bankCode: verifyResult.bankCode,
        bankTranNo: verifyResult.bankTranNo,
        cardType: verifyResult.cardType,
        payDate: verifyResult.payDate
      }
    });
  } catch (error) {
    console.error('Error verifying VNPay return:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Webhook for VNPay (legacy endpoint)
export const vnpayWebhook = async (req, res) => {
  try {
    const { orderCode, transactionId, transactionStatus, amount } = req.body;

    const order = await OrderDAO.findByOrderCode(orderCode);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (transactionStatus === '00') {
      await OrderDAO.updatePaymentStatus(order._id, 'completed', transactionId);
      return res.status(200).json({ message: 'Payment confirmed' });
    }

    return res.status(200).json({ message: 'Webhook received' });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export default {
  createVNPayPayment,
  handleVNPayReturn,
  handleVNPayIPN,
  getPaymentStatus,
  verifyVNPayReturn,
  vnpayWebhook
};

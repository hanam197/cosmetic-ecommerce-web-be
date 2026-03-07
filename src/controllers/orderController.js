import OrderDAO from '../dao/OrderDAO.js';
import { z } from 'zod';

// Validation schemas
const createOrderSchema = z.object({
  userId: z.string().nullable().optional(),
  cartItems: z.array(z.object({
    productId: z.string(),
    sku: z.string(),
    productName: z.string(),
    colorName: z.string(),
    price: z.number().min(0),
    quantity: z.number().min(1),
    image: z.string().optional(),
    total: z.number().min(0)
  })),
  shippingAddress: z.object({
    recipientName: z.string().min(1),
    phoneNumber: z.string().min(1),
    province: z.string().optional(),
    district: z.string().optional(),
    ward: z.string().optional(),
    detailAddress: z.string().min(1)
  }),
  paymentMethod: z.enum(['vnpay', 'cod', 'bank_transfer']),
  shippingFee: z.number().min(0).optional(),
  discount: z.number().min(0).optional(),
  notes: z.string().optional()
});

export const createOrder = async (req, res) => {
  try {
    const parsedData = createOrderSchema.safeParse(req.body);
    if (!parsedData.success) {
      return res.status(400).json({ error: parsedData.error.errors[0].message });
    }

    const { userId, cartItems, shippingAddress, paymentMethod, shippingFee = 0, discount = 0, notes } = parsedData.data;

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
    const totalPrice = subtotal + shippingFee - discount;

    // Generate order code
    const orderCode = await OrderDAO.generateOrderCode();

    // Create order
    const orderData = {
      orderCode,
      userId,
      items: cartItems,
      shippingAddress,
      subtotal,
      shippingFee,
      discount,
      totalPrice,
      paymentMethod,
      notes
    };

    const order = await OrderDAO.create(orderData);

    // Return order details
    return res.status(201).json({
      message: 'Order created successfully',
      order: {
        _id: order._id,
        orderCode: order.orderCode,
        totalPrice: order.totalPrice,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await OrderDAO.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    return res.status(200).json({ order });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const result = await OrderDAO.findByUserId(userId, page, limit);

    return res.status(200).json({
      orders: result.orders,
      pagination: {
        total: result.total,
        page: result.page,
        pages: result.pages
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { orderStatus } = req.body;

    if (!['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].includes(orderStatus)) {
      return res.status(400).json({ error: 'Invalid order status' });
    }

    const order = await OrderDAO.updateOrderStatus(orderId, orderStatus);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    return res.status(200).json({
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await OrderDAO.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.orderStatus !== 'pending') {
      return res.status(400).json({ error: 'Can only cancel pending orders' });
    }

    const updatedOrder = await OrderDAO.updateOrderStatus(orderId, 'cancelled');

    return res.status(200).json({
      message: 'Order cancelled successfully',
      order: updatedOrder
    });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export default {
  createOrder,
  getOrderById,
  getUserOrders,
  updateOrderStatus,
  cancelOrder
};

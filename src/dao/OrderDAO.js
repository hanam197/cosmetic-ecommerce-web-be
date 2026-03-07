import Order from '../models/Order.js';

class OrderDAO {
  static async create(orderData) {
    try {
      const order = new Order(orderData);
      return await order.save();
    } catch (error) {
      throw new Error(`Error creating order: ${error.message}`);
    }
  }

  static async findById(orderId) {
    try {
      return await Order.findById(orderId)
        .populate('userId')
        .populate('items.productId');
    } catch (error) {
      throw new Error(`Error finding order: ${error.message}`);
    }
  }

  static async findByOrderCode(orderCode) {
    try {
      return await Order.findOne({ orderCode });
    } catch (error) {
      throw new Error(`Error finding order: ${error.message}`);
    }
  }

  static async findByUserId(userId, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;
      const orders = await Order.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('items.productId');
      
      const total = await Order.countDocuments({ userId });
      return {
        orders,
        total,
        page,
        pages: Math.ceil(total / limit)
      };
    } catch (error) {
      throw new Error(`Error finding orders: ${error.message}`);
    }
  }

  static async updatePaymentStatus(orderId, paymentStatus, vnpayTransactionId = null) {
    try {
      const updateData = { paymentStatus };
      if (vnpayTransactionId) {
        updateData.vnpayTransactionId = vnpayTransactionId;
      }
      if (paymentStatus === 'completed') {
        updateData.orderStatus = 'confirmed';
      }
      return await Order.findByIdAndUpdate(orderId, updateData, { new: true });
    } catch (error) {
      throw new Error(`Error updating payment status: ${error.message}`);
    }
  }

  static async updateOrderStatus(orderId, orderStatus) {
    try {
      return await Order.findByIdAndUpdate(orderId, { orderStatus }, { new: true });
    } catch (error) {
      throw new Error(`Error updating order status: ${error.message}`);
    }
  }

  static async delete(orderId) {
    try {
      return await Order.findByIdAndDelete(orderId);
    } catch (error) {
      throw new Error(`Error deleting order: ${error.message}`);
    }
  }

  static async generateOrderCode() {
    try {
      const timestamp = Date.now().toString().slice(-8);
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      return `ORD${timestamp}${random}`;
    } catch (error) {
      throw new Error(`Error generating order code: ${error.message}`);
    }
  }
}

export default OrderDAO;

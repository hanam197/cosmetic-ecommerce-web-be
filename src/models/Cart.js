import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required']
  },
  sku: {
    type: String,
    required: [true, 'SKU is required']
  },
  productName: {
    type: String,
    required: [true, 'Product name is required']
  },
  colorName: {
    type: String,
    required: [true, 'Color name is required']
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price must be greater than 0']
  },
  oldPrice: {
    type: Number,
    min: [0, 'Old price must be greater than 0']
  },
  image: {
    type: String
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  }
}, { _id: true, timestamps: true });

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null // guest
  },
  items: [cartItemSchema],
  totalPrice: {
    type: Number,
    default: 0,
    min: 0
  },
  totalQuantity: {
    type: Number,
    default: 0,
    min: 0
  }
}, { timestamps: true });



// Calculate total price and quantity before saving
cartSchema.pre('save', async function () {
  this.totalPrice = this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);

  this.totalQuantity = this.items.reduce((total, item) => {
    return total + item.quantity;
  }, 0);
});

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;

import mongoose from "mongoose";

const PaymentMethodSchema = new mongoose.Schema({
  type: { type: String, default: 'credit_card' },
  provider: { type: String, required: true },
  accountNumber: { type: String, required: true },
  holderName: { type: String, required: true },
  expiryDate: { type: String, required: true },
  isDefault: { type: Boolean, default: false }
});

const AddressSchema = new mongoose.Schema({
  recipientName: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  province: { type: String, required: true }, 
  provinceCode: { type: String, required: true }, 
  district: { type: String, required: true }, 
  districtCode: { type: String, required: true },
  ward: { type: String, required: true }, 
  wardCode: { type: String, required: true },
  detailAddress: { type: String, required: true }, 
  isDefault: { type: Boolean, default: false },
});

function arrayLimit(val) { return val.length <= 5; }

const UserSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { 
      type: String, 
      required: function() { return this.authProvider === 'local'; } 
    },
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
    addresses: { type: [AddressSchema] },
    paymentMethods: { 
      type: [PaymentMethodSchema],
      validate: [arrayLimit, '{PATH} exceeds the limit of 5']
    }
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);
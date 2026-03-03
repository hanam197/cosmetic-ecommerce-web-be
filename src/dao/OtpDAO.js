import Otp from '../models/Otp.js';

class OtpDAO {
  async saveOtp(email, code) {
    await Otp.deleteMany({ email }); 
    return await Otp.create({ email, code });
  }
  async findOtp(email) { return await Otp.findOne({ email }); }
  async deleteOtp(email) { return await Otp.deleteMany({ email }); }
}
export default new OtpDAO();
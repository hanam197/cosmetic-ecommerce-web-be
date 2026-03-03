import User from '../models/User.js';

class UserDAO {
  async findByEmail(email) { return await User.findOne({ email }); }
  async create(userData) { return await User.create(userData); }
  async updatePassword(email, newHashedPassword) {
    const user = await User.findOne({ email });
    if (!user) return null;
    user.password = newHashedPassword;
    return await user.save();
  }
}
export default new UserDAO();
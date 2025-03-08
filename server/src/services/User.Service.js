import Users from "../models/Users.js";

class UserService {
  static findUserByEmail = async (email) => {
    return await Users.findOne({ email });
  };
}

export default UserService;

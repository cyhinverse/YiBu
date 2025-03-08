import bcrypt from "bcrypt";
import UserService from "../services/User.Service.js";

const CheckComparePassword = async (password, email) => {
  const UserPassword = UserService.findUserByEmail(email);
  if (!UserPassword) {
    console.log(`User not found !`);
  }
  const CheckPassword = bcrypt.compare(password, UserPassword.password);
  return CheckPassword;
};

export default CheckComparePassword;

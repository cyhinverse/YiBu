import bcrypt from "bcrypt";

const checkComparePassword = async (password,passwordUser) => {
  const CheckPassword = await bcrypt.compare(password,passwordUser);
  return CheckPassword;
};

export default checkComparePassword;

import bcrypt from "bcrypt";

const HashPasswordForUser = async (password) => {
  try {
    const salt = 10;
    const PasswordHashed = await bcrypt.hash(password, salt);
    return PasswordHashed;
  } catch (e) {
    console.log(`Error hash password ${e}`);
  }
};

export default HashPasswordForUser;

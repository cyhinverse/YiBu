export const handleRequest = async (fn, messageError) => {
  try {
    const res = await fn();
    return res.data;
  } catch (error) {
    console.log(`${messageError}`, error.response?.data || error.message);
    throw error;
  }
};

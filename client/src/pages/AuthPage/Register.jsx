import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { register } from "../../slices/AuthSlice";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import Auth from "../../services/authService";
import toast from "react-hot-toast";

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password) {
      toast.error("Please fill all fields!");
      return;
    }

    try {
      const res = await Auth.register(formData);

      if (res.status === 201) {
        toast.success("Register successfully !");
        dispatch(register(res.data));
        navigate("/auth/login");
      } else {
        toast.error(res?.data?.message || "Register failed !");
      }
    } catch (error) {
      console.error("Lỗi đăng ký", error);
      toast.error("Something went wrong!");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      <div className="bg-white/95 backdrop-blur-sm w-full max-w-4xl p-8 rounded-2xl shadow-2xl flex flex-col md:flex-row animate-fadeIn hover:shadow-3xl transition-shadow duration-300">
        <div className="w-full md:w-1/2 flex items-center justify-center mb-8 md:mb-0">
          <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500 animate-slideLeft">
            Yibu
          </h1>
        </div>
        <div className="w-full md:w-1/2 space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500 animate-bounce-in">
              Create Account
            </h1>
            <p className="text-gray-500 animate-fade-in">
              Join our community today
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="transform transition-all duration-300 hover:scale-[1.02]">
                <label
                  htmlFor="username"
                  className="text-sm font-medium text-gray-700 animate-fade-in"
                >
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 focus:scale-[1.02] hover:shadow-md outline-none"
                  placeholder="John Doe"
                />
              </div>

              <div className="transform transition-all duration-300 hover:scale-[1.02]">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700 animate-fade-in"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 focus:scale-[1.02] hover:shadow-md outline-none"
                  placeholder="you@example.com"
                />
              </div>

              <div className="transform transition-all duration-300 hover:scale-[1.02]">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700 animate-fade-in"
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="mt-1 w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 focus:scale-[1.02] hover:shadow-md outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-xl font-medium 
              hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 
              transition-all duration-300 shadow-lg shadow-purple-500/30 
              hover:shadow-xl hover:shadow-purple-500/40 hover:scale-[1.02] 
              active:scale-95"
            >
              Sign up
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 animate-fade-in">
            Already have an account?{" "}
            <Link
              to="/auth/login"
              className="font-medium text-purple-500 hover:text-purple-600 transition-colors duration-300 hover:scale-110 inline-block"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;

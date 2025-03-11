import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { useDispatch } from "react-redux";
import Auth from "../../services/authService";
import toast from "react-hot-toast";
import { login } from "../../slices/AuthSlice";

const Login = () => {
  const dispatch = useDispatch();
  const navigator = useNavigate();
  const [data, setData] = useState({
    email: "",
    password: "",
  });
  const handleOnchangeValue = (e) => {
    setData({
      ...data,
      [e.target.name]: e.target.value,
    });
  };
  const handSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await Auth.login(data);
      if (res.code === 1) {
        toast.success("Login successfully!");
        localStorage.setItem("accessToken", res.accessToken);
        dispatch(login(res));
        navigator("/");
      }
    } catch (error) {
      console.log("Error::", error);
      toast.error("Login failed! Please try again.");
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      <div className="bg-white/95 backdrop-blur-sm w-full max-w-4xl p-8 rounded-2xl shadow-2xl flex animate-fadeIn hover:shadow-3xl transition-shadow duration-300">
        <div className="w-1/2 flex items-center justify-center">
          <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500 animate-slideLeft">
            Yibu
          </h1>
        </div>
        <div className="w-1/2 space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500 animate-bounce-in">
              Welcome Back
            </h1>
            <p className="text-gray-500 animate-slideUp">
              Please sign in to continue
            </p>
          </div>

          <form className="space-y-6" onSubmit={handSubmit}>
            <div className="space-y-4">
              <div className="transform transition-all duration-300 hover:scale-[1.02]">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700"
                >
                  Email Address
                </label>
                <input
                  onChange={handleOnchangeValue}
                  value={data.email}
                  type="email"
                  name="email"
                  id="email"
                  className="mt-1 w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 focus:scale-[1.02] hover:shadow-md outline-none"
                  placeholder="Enter your email"
                />
              </div>
              <div className="transform transition-all duration-300 hover:scale-[1.02]">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <input
                  onChange={handleOnchangeValue}
                  value={data.password}
                  type="password"
                  name="password"
                  id="password"
                  className="mt-1 w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 focus:scale-[1.02] hover:shadow-md outline-none"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div className="space-y-4">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-300 shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-95"
              >
                Sign in
              </button>

              <button
                type="button"
                className="w-full flex items-center justify-center gap-3 bg-white py-3 rounded-xl font-medium border border-gray-300 transform transition-all duration-300 hover:bg-gray-50 hover:scale-[1.02] hover:shadow-lg active:scale-95"
              >
                <FcGoogle className="w-5 h-5" />
                <span className="text-gray-700">Continue with Google</span>
              </button>
            </div>
          </form>

          <div className="space-y-3 text-center">
            <p className="text-gray-600 transform transition duration-200 hover:translate-y-[-2px]">
              Don't have an account?{" "}
              <Link
                to="/auth/register"
                className="text-purple-600 hover:text-purple-700 font-medium transition-colors duration-200"
              >
                Create account
              </Link>
            </p>
            <p className="text-gray-600 transform transition duration-200 hover:translate-y-[-2px]">
              <Link
                to="/auth/forgot-password"
                className="text-purple-600 hover:text-purple-700 font-medium transition-colors duration-200"
              >
                Forgot your password?
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

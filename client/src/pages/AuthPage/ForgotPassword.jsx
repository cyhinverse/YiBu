import React from "react";
import { Link, useNavigate } from "react-router-dom";

const ForgotPassword = () => {
  const navigate = useNavigate();
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
              Forgot Password
            </h1>
            <p className="text-gray-500 animate-slideUp">
              Enter your email to reset your password
            </p>
          </div>

          <form className="space-y-6">
            <div className="space-y-4">
              <div className="transform transition-all duration-300 hover:scale-[1.02]">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  className="mt-1 w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 focus:scale-[1.02] hover:shadow-md outline-none"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <button
              onClick={() => navigate("/auth/verify-code")}
              type="submit"
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-300 shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-95"
            >
              Reset Password
            </button>
          </form>

          <div className="text-center">
            <p className="text-gray-600 transform transition duration-200 hover:translate-y-[-2px]">
              Remembered your password?{" "}
              <Link
                to="/auth/login"
                className="text-purple-600 hover:text-purple-700 font-medium transition-colors duration-200"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

import React from "react";
import { Link } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";

const Login = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      <div className="bg-white/95 backdrop-blur-sm w-full max-w-md p-8 rounded-2xl shadow-2xl space-y-8 animate-fadeIn hover:shadow-3xl transition-shadow duration-300">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-800 animate-slideDown">
            Welcome Back
          </h1>
          <p className="text-gray-500 animate-slideUp">
            Please sign in to continue
          </p>
        </div>

        <form className="space-y-6">
          <div className="space-y-4">
            <div className="transform transition duration-200 hover:translate-x-1">
              <label
                htmlFor="email"
                className="text-sm font-medium text-gray-700"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                className="mt-1 w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm hover:shadow-md"
                placeholder="Enter your email"
              />
            </div>
            <div className="transform transition duration-200 hover:translate-x-1">
              <label
                htmlFor="password"
                className="text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                className="mt-1 w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm hover:shadow-md"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div className="space-y-4">
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg font-medium transform transition-all duration-300 hover:opacity-90 hover:scale-[1.02] hover:shadow-lg active:scale-95"
            >
              Sign in
            </button>

            <button
              type="button"
              className="w-full flex items-center justify-center gap-3 bg-white py-3 rounded-lg font-medium border border-gray-300 transform transition-all duration-300 hover:bg-gray-50 hover:scale-[1.02] hover:shadow-lg active:scale-95"
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
  );
};

export default Login;

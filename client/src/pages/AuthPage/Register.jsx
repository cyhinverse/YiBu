import React from "react";
import { Link } from "react-router-dom";

const Register = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4 animate-gradient-x">
      <div className="w-full max-w-md space-y-8 bg-white/90 backdrop-blur-sm p-8 rounded-3xl shadow-2xl animate-fade-in-up">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 animate-bounce-in">
            Create Account
          </h1>
          <p className="text-gray-500 animate-fade-in">
            Join our community today
          </p>
        </div>

        <form className="mt-8 space-y-6">
          <div className="space-y-4">
            <div className="transform transition-all duration-300 hover:scale-[1.02]">
              <label
                htmlFor="name"
                className="text-sm font-medium text-gray-700"
              >
                Full Name
              </label>
              <input
                type="text"
                id="name"
                className="mt-1 w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 focus:scale-[1.02] hover:shadow-md"
                placeholder="John Doe"
              />
            </div>

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
                className="mt-1 w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 focus:scale-[1.02] hover:shadow-md"
                placeholder="you@example.com"
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
                type="password"
                id="password"
                className="mt-1 w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 focus:scale-[1.02] hover:shadow-md"
                placeholder="••••••••"
              />
            </div>

            <div className="transform transition-all duration-300 hover:scale-[1.02]">
              <label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-gray-700"
              >
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                className="mt-1 w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 focus:scale-[1.02] hover:shadow-md"
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
  );
};

export default Register;

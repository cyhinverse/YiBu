import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { login } from "../../redux/actions/authActions";
import { Button, Input } from "../../components/Common";

const Login = () => {
  const dispatch = useDispatch();
  const navigator = useNavigate();
  const [data, setData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleOnchangeValue = (e) => {
    setData({
      ...data,
      [e.target.name]: e.target.value,
    });
  };

  const handSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await dispatch(login(data)).unwrap();
      
      if (res && (res.code === 1 || res.accessToken)) {
        toast.success("Welcome back!");
        
        const user = res.user || res;
        
        const isAdmin = user.isAdmin || user.role === "admin";
        if (isAdmin) {
          navigator("/admin");
        } else {
          navigator("/");
        }
      }
    } catch (error) {
      console.log("Error::", error);
      toast.error(error?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-surface">
      {/* Left Side - Brand Panel (Hidden on automated mobile test, visible on desktop) */}
      <div className="hidden lg:flex w-1/2 bg-surface-highlight relative items-center justify-center overflow-hidden">
         <div className="absolute inset-0 bg-primary/5"></div>
         <div className="relative z-10 text-center p-12">
            <h1 className="text-7xl font-black font-heading tracking-tighter text-text-primary mb-4">
              Yibu.
            </h1>
            <p className="text-xl text-text-secondary font-light max-w-md mx-auto">
              Simplicity in connection.
            </p>
         </div>
         {/* Minimal Abstract Shape */}
         <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-surface">
        <div className="w-full max-w-md space-y-10">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold font-heading text-text-primary tracking-tight">
              Sign in
            </h2>
            <p className="text-text-secondary">
              Welcome back to Yibu
            </p>
          </div>

          <form className="space-y-8" onSubmit={handSubmit}>
            <div className="space-y-6">
              <Input
                label="Email"
                type="email"
                name="email"
                placeholder="name@example.com"
                value={data.email}
                onChange={handleOnchangeValue}
                className="bg-transparent border-surface-highlight focus:border-primary rounded-lg"
              />
              
              <div className="space-y-2">
                <Input
                  label="Password"
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  value={data.password}
                  onChange={handleOnchangeValue}
                  className="bg-transparent border-surface-highlight focus:border-primary rounded-lg"
                />
                <div className="flex justify-end">
                   <Link
                    to="/auth/forgot-password"
                    className="text-sm font-medium text-text-secondary hover:text-primary transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full py-4 text-sm font-semibold tracking-wide shadow-none hover:shadow-lg transition-all rounded-xl"
                isLoading={isLoading}
              >
                Sign In
              </Button>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-surface-highlight"></div>
                <span className="flex-shrink-0 mx-4 text-xs text-text-secondary uppercase tracking-widest">Or</span>
                <div className="flex-grow border-t border-surface-highlight"></div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full py-4 border-surface-highlight hover:bg-surface-highlight text-text-primary font-medium rounded-xl flex items-center justify-center gap-2"
              >
                <FcGoogle className="w-5 h-5" />
                <span>Google</span>
              </Button>
            </div>
          </form>

          <p className="text-center text-sm text-text-secondary">
            No account yet?{" "}
            <Link
              to="/auth/register"
              className="font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

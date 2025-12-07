import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { useDispatch } from "react-redux";
import Auth from "../../services/authService";
import toast from "react-hot-toast";
import { login } from "../../redux/slices/AuthSlice";
import { Button, Input, Card } from "../../components/Common";

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
      const res = await Auth.login(data);
      if (res.code === 1) {
        toast.success("Login successfully!");
        localStorage.setItem("accessToken", res.accessToken);

        if (res.user) {
          console.log("Dữ liệu user sau khi login:", res.user);
          localStorage.setItem("user", JSON.stringify(res.user));
          dispatch(login(res.user));

          // Kiểm tra nếu người dùng là admin thì chuyển hướng đến trang admin
          const isAdmin = res.user.isAdmin || res.user.role === "admin";
          if (isAdmin) {
            console.log("User is admin, redirecting to admin dashboard");
            navigator("/admin");
          } else {
            // Nếu không phải admin, chuyển hướng đến trang chủ
            navigator("/");
          }
        } else {
          // Nếu không có dữ liệu người dùng, chuyển hướng đến trang chủ
          navigator("/");
        }
      }
    } catch (error) {
      console.log("Error::", error);
      toast.error("Login failed! Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-secondary to-accent p-4">
      <Card className="w-full max-w-4xl flex flex-col md:flex-row !p-0 overflow-hidden shadow-3xl bg-white/90 dark:bg-black/90 backdrop-blur-md border-0">
        
        {/* Left Side - Brand / Info */}
        <div className="w-full md:w-1/2 bg-gradient-to-br from-primary/10 to-secondary/10 p-12 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-slate-900/[0.04] bg-[bottom_1px_center] dark:bg-grid-slate-400/[0.05] [mask-image:linear-gradient(0deg,transparent,black)]"></div>
          
          <h1 className="text-6xl font-black font-heading text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary animate-fade-in-up mb-6 relative z-10">
            Yibu
          </h1>
          <p className="text-text-secondary text-lg relative z-10 animate-fade-in delay-100">
            Connect, share, and inspire in a vibrant community designed for you.
          </p>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12">
          <div className="space-y-2 mb-8 text-center md:text-left">
            <h2 className="text-3xl font-bold font-heading text-text-primary animate-fade-in">
              Welcome Back
            </h2>
            <p className="text-text-secondary animate-fade-in delay-75">
              Please sign in to continue
            </p>
          </div>

          <form className="space-y-6" onSubmit={handSubmit}>
            <div className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                name="email"
                placeholder="Enter your email"
                value={data.email}
                onChange={handleOnchangeValue}
                className="animate-slideUp delay-100"
              />
              
              <div>
                <Input
                  label="Password"
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  value={data.password}
                  onChange={handleOnchangeValue}
                  className="animate-slideUp delay-150"
                />
                <div className="flex justify-end mt-2 animate-slideUp delay-200">
                   <Link
                    to="/auth/forgot-password"
                    className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-2 animate-slideUp delay-300">
              <Button
                type="submit"
                variant="gradient"
                className="w-full py-3 shadow-xl shadow-primary/20"
                isLoading={isLoading}
              >
                Sign in
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-text-secondary/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-surface text-text-secondary">Or provided with</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full py-3 border-surface-highlight bg-surface hover:bg-surface-highlight !text-text-primary"
                startIcon={<FcGoogle className="w-5 h-5" />}
              >
                Continue with Google
              </Button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-text-secondary animate-fade-in delay-500">
            Don't have an account?{" "}
            <Link
              to="/auth/register"
              className="font-bold text-primary hover:text-primary/80 transition-colors"
            >
              Create account
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Login;

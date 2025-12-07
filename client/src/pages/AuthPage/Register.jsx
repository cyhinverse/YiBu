import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { register } from "../../redux/slices/AuthSlice";
import { useNavigate, Link } from "react-router-dom";
import Auth from "../../services/authService";
import toast from "react-hot-toast";
import { Button, Input, Card } from "../../components/Common";

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    username: "",
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

    if (
      !formData.name ||
      !formData.email ||
      !formData.password ||
      !formData.username
    ) {
      toast.error("Please fill all fields!");
      return;
    }

    setIsLoading(true);
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
      toast.error(error.response?.data?.message || "Something went wrong!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary via-primary to-accent p-4">
      <Card className="w-full max-w-5xl flex flex-col md:flex-row !p-0 overflow-hidden shadow-3xl bg-white/90 dark:bg-black/90 backdrop-blur-md border-0">
        
        {/* Left Side - Brand / Info */}
        <div className="w-full md:w-5/12 bg-gradient-to-br from-secondary/10 to-primary/10 p-12 flex flex-col items-center justify-center text-center relative overflow-hidden order-1 md:order-1">
          <div className="absolute inset-0 bg-grid-slate-900/[0.04] bg-[bottom_1px_center] dark:bg-grid-slate-400/[0.05] [mask-image:linear-gradient(0deg,transparent,black)]"></div>
          
          <h1 className="text-5xl font-black font-heading text-transparent bg-clip-text bg-gradient-to-r from-secondary to-primary animate-fade-in-up mb-6 relative z-10">
            Join Yibu
          </h1>
          <p className="text-text-secondary text-lg relative z-10 animate-fade-in delay-100">
            Be part of a community that celebrates creativity and connection.
          </p>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-7/12 p-8 md:p-12 order-2 md:order-2">
          <div className="space-y-2 mb-8 text-center md:text-left">
            <h2 className="text-3xl font-bold font-heading text-text-primary animate-fade-in">
              Create Account
            </h2>
            <p className="text-text-secondary animate-fade-in delay-75">
               Start your journey with us today
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                type="text"
                name="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                className="animate-slideUp delay-100"
              />

              <Input
                label="Username"
                type="text"
                name="username"
                placeholder="johndoe123"
                value={formData.username}
                onChange={handleChange}
                className="animate-slideUp delay-100"
              />
            </div>

            <Input
              label="Email Address"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              className="animate-slideUp delay-150"
            />

            <Input
              label="Password"
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              className="animate-slideUp delay-200"
            />

            <div className="pt-4 animate-slideUp delay-300">
              <Button
                type="submit"
                variant="gradient"
                className="w-full py-3 shadow-xl shadow-secondary/20 bg-gradient-to-r from-secondary to-primary"
                isLoading={isLoading}
              >
                Sign up
              </Button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-text-secondary animate-fade-in delay-500">
            Already have an account?{" "}
            <Link
              to="/auth/login"
              className="font-bold text-secondary hover:text-secondary/80 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Register;

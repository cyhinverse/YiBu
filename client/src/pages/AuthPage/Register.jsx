import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { register } from "../../redux/actions/authActions";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Button, Input } from "../../components/Common";
import { FcGoogle } from "react-icons/fc";

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
      const res = await dispatch(register(formData)).unwrap();
      if(res) {
        toast.success("Registration successful!");
        navigate("/auth/login");
      }
    } catch (error) {
      console.error("Registration error", error);
      toast.error(error?.message || "Something went wrong!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-surface">
      {/* Left Side - Brand Panel */}
      <div className="hidden lg:flex w-1/2 bg-surface-highlight relative items-center justify-center overflow-hidden">
         <div className="absolute inset-0 bg-secondary/5"></div>
         <div className="relative z-10 text-center p-12">
            <h1 className="text-7xl font-black font-heading tracking-tighter text-text-primary mb-4">
              Join.
            </h1>
            <p className="text-xl text-text-secondary font-light max-w-md mx-auto">
              Start your journey today.
            </p>
         </div>
         <div className="absolute top-24 right-24 w-64 h-64 bg-secondary/10 rounded-full blur-3xl"></div>
      </div>

      {/* Right Side - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-surface">
        <div className="w-full max-w-md space-y-10">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold font-heading text-text-primary tracking-tight">
              Create Account
            </h2>
            <p className="text-text-secondary">
              Free forever. No credit card needed.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Full Name"
                type="text"
                name="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                className="bg-transparent border-surface-highlight focus:border-secondary rounded-lg"
              />

              <Input
                label="Username"
                type="text"
                name="username"
                placeholder="johndoe"
                value={formData.username}
                onChange={handleChange}
                className="bg-transparent border-surface-highlight focus:border-secondary rounded-lg"
              />
            </div>

            <Input
              label="Email"
              type="email"
              name="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              className="bg-transparent border-surface-highlight focus:border-secondary rounded-lg"
            />

            <Input
              label="Password"
              type="password"
              name="password"
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
              className="bg-transparent border-surface-highlight focus:border-secondary rounded-lg"
            />

            <div className="space-y-4 pt-2">
              <Button
                type="submit"
                variant="primary" // Reusing primary but could be secondary if we wanted distinct separate brand colors per page. Sticking to primary for consistency.
                size="lg"
                className="w-full py-4 text-sm font-semibold tracking-wide shadow-none hover:shadow-lg transition-all rounded-xl"
                isLoading={isLoading}
              >
                Sign Up
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
                startIcon={<FcGoogle className="w-5 h-5" />}
              >
                Sign up with Google
              </Button>
            </div>
          </form>

          <p className="text-center text-sm text-text-secondary">
            Already have an account?{" "}
            <Link
              to="/auth/login"
              className="font-semibold text-primary hover:text-primary/80 transition-colors"
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

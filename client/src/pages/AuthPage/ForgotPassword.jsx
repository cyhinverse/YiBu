import  { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Input } from "../../components/Common";


export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
        setIsLoading(false);
        navigate("/auth/verify-code"); 
    }, 1000);
  };

  return (
    <div className="min-h-screen flex bg-surface">
      {/* Left Side - Brand Panel */}
      <div className="hidden lg:flex w-1/2 bg-surface-highlight relative items-center justify-center overflow-hidden">
         <div className="absolute inset-0 bg-primary/5"></div>
         <div className="relative z-10 text-center p-12">
            <h1 className="text-7xl font-black font-heading tracking-tighter text-text-primary mb-4">
              Recover.
            </h1>
            <p className="text-xl text-text-secondary font-light max-w-md mx-auto">
              Don't worry, we'll help you get back in.
            </p>
         </div>
         <div className="absolute bottom-24 right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-surface">
        <div className="w-full max-w-md space-y-10">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold font-heading text-text-primary tracking-tight">
              Forgot Password?
            </h2>
            <p className="text-text-secondary">
              Enter your email to reset your password
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <Input
              label="Email Address"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-transparent border-surface-highlight focus:border-primary rounded-lg"
            />

            <div className="space-y-4 pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full py-4 text-sm font-semibold tracking-wide shadow-none hover:shadow-lg transition-all rounded-xl"
                isLoading={isLoading}
              >
                Reset Password
              </Button>

              <Link
                to="/auth/login"
                className="flex items-center justify-center w-full py-4 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
              >
                Back to Sign In
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};


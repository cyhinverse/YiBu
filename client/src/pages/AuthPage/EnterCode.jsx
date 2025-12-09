import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Sparkles, ArrowLeft, Check } from "lucide-react";

const EnterCode = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [verified, setVerified] = useState(false);
  const inputRefs = useRef([]);

  const handleChange = (index, value) => {
    if (value.length > 1) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    // Fake verification
    setTimeout(() => {
      setIsLoading(false);
      setVerified(true);
    }, 1500);
  };

  const handleResend = () => {
    console.log("Resend code");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex w-1/2 bg-black items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-neutral-900 to-black" />

        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-white/3 rounded-full blur-3xl" />

        <div className="relative z-10 text-center px-12">
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-8">
            <Sparkles size={28} className="text-black" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
            Verify
          </h1>
          <p className="text-white/60 text-lg max-w-sm mx-auto">
            Enter the code we sent to your email to verify your identity.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white dark:bg-black">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center mb-10">
            <div className="w-12 h-12 rounded-full bg-black dark:bg-white flex items-center justify-center">
              <Sparkles size={22} className="text-white dark:text-black" />
            </div>
          </div>

          {!verified ? (
            <>
              <div className="mb-10 text-center">
                <h2 className="text-3xl font-bold text-black dark:text-white mb-2">
                  Enter code
                </h2>
                <p className="text-neutral-500">
                  We sent a 6-digit code to your email
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Code inputs */}
                <div className="flex justify-center gap-3">
                  {code.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-12 h-14 text-center text-xl font-semibold bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-all"
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || code.some((d) => !d)}
                  className="w-full py-3.5 bg-black dark:bg-white text-white dark:text-black font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 dark:border-black/30 border-t-white dark:border-t-black rounded-full animate-spin" />
                  ) : (
                    "Verify Code"
                  )}
                </button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-neutral-500">
                  Didn't receive the code?{" "}
                  <button
                    onClick={handleResend}
                    className="font-medium text-black dark:text-white hover:underline"
                  >
                    Resend
                  </button>
                </p>
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
                <Check
                  size={28}
                  className="text-green-600 dark:text-green-400"
                />
              </div>
              <h2 className="text-2xl font-bold text-black dark:text-white mb-2">
                Verified!
              </h2>
              <p className="text-neutral-500 mb-8">
                Your email has been verified successfully.
              </p>
              <Link
                to="/auth/login"
                className="inline-flex items-center justify-center w-full py-3.5 bg-black dark:bg-white text-white dark:text-black font-medium rounded-xl hover:opacity-90 transition-opacity"
              >
                Continue to Sign In
              </Link>
            </div>
          )}

          {/* Back to login */}
          {!verified && (
            <div className="mt-10 text-center">
              <Link
                to="/auth/login"
                className="inline-flex items-center gap-2 text-neutral-500 hover:text-black dark:hover:text-white transition-colors"
              >
                <ArrowLeft size={16} />
                Back to sign in
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnterCode;

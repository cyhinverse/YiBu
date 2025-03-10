import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";

const EnterCode = () => {
  const inputsRef = useRef([]);
  const [valueInput, setValueInput] = useState(Array(6).fill(""));

  const handleInputChange = (e, index) => {
    const value = e.target.value;
    const newValueInput = [...valueInput];
    newValueInput[index] = value;
    setValueInput(newValueInput);
    if (value.length === 1 && index < 5) {
      inputsRef.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && index > 0 && !e.target.value) {
      inputsRef.current[index - 1].focus();
    }
  };

  const handleValue = (e) => {
    e.preventDefault();
    console.log(valueInput.join(""));
  };

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
              Enter Code
            </h1>
            <p className="text-gray-500 animate-slideUp">
              Please enter the 6-digit code sent to your email
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleValue}>
            <div className="flex justify-center space-x-2">
              {[...Array(6)].map((_, index) => (
                <input
                  value={valueInput[index]}
                  key={index}
                  type="text"
                  maxLength="1"
                  ref={(el) => (inputsRef.current[index] = el)}
                  onChange={(e) => handleInputChange(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="w-12 h-12 text-center text-xl bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 focus:scale-[1.02] hover:shadow-md outline-none"
                />
              ))}
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-300 shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-95"
            >
              Verify Code
            </button>
          </form>

          <div className="text-center">
            <p className="text-gray-600 transform transition duration-200 hover:translate-y-[-2px]">
              Didn't receive the code?{" "}
              <Link
                to="/auth/resend-code"
                className="text-purple-600 hover:text-purple-700 font-medium transition-colors duration-200"
              >
                Resend Code
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnterCode;

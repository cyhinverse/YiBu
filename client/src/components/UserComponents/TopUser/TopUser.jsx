import React from "react";

const TopUser = ({ content }) => {
  return (
    <div className="bg-white border h-full border-gray-300 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
      {/* Header với gradient và animation */}
      <h1 className="text-center text-2xl md:text-3xl font-bold mb-6 bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent hover:scale-105 transition-transform duration-300">
        Đề xuất
      </h1>

      <div className="flex flex-col gap-4">
        {content.map((user, index) => (
          <div
            key={index}
            className="flex items-center justify-between px-5 py-4 rounded-lg
            bg-gradient-to-r from-gray-50 to-gray-100
            hover:from-violet-100 hover:to-pink-100
            transition-all duration-300 transform hover:scale-[1.02] hover:shadow-md
            cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div
                className="w-10 h-10 flex items-center justify-center rounded-full 
                bg-violet-100 text-violet-600 font-semibold
                shadow-sm hover:bg-violet-200 transition-colors"
              >
                {index + 1}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-700">{user.content}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopUser;

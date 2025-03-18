import React from "react";

const PostOption = ({ show }) => {
  const options = ["Lưu bài viết", "Báo cáo", "Ẩn bài viết"];

  return (
    <div
      className={`flex flex-col shadow-xl h-fit w-[130px] bg-white absolute z-30 top-5 right-5 rounded-md gap-0.5 items-center justify-center transition-all duration-200 ease-out border border-gray-300
      ${
        show
          ? "opacity-100 scale-100"
          : "opacity-0 scale-90 pointer-events-none"
      }`}
    >
      {options.map((op, i) => (
        <div
          key={i}
          className="text-black w-full px-2 h-[40px] border-b border-gray-300 flex items-center justify-center cursor-pointer hover:opacity-80"
        >
          {op}
        </div>
      ))}
    </div>
  );
};

export default PostOption;

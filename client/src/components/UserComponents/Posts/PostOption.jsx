import React from "react";

const PostOption = () => {
  const options = ["Lưu bài viết", "Báo cáo ", "Ẩn bài viết"];
  return (
    <div className="flex flex-col h-fit w-[120px] bg-purple-400 absolute z-30 top-5 right-5 rounded-md gap-0.5 items-center justify-center">
      {options.map((op, i) => (
        <div
          key={i}
          className="text-white w-full px-2 h-[40px] border-b border-gray-300 flex items-center justify-center cursor-pointer hover:opacity-80"
        >
          {op}
        </div>
      ))}
    </div>
  );
};

export default PostOption;

import React from "react";

const CreatePost = () => {
  return (
    <div className="w-full h-[50px] bg-white mb-1 flex px-5 items-center rounded-t-xl">
      <span className="inline-block w-full text-gray-300">
        what do you think about the future....
      </span>
      <button className="w-[90px] h-[40px]  bg-black text-white rounded-md hover:opacity-70 cursor-pointer">
        Post
      </button>
    </div>
  );
};

export default CreatePost;

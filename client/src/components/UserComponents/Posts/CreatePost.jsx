import React, { useState } from "react";
import ModelPost from "./ModelPost";

const CreatePost = () => {
  const [modalBox, setModalBox] = useState(false);

  return (
    <>
      <div className="w-full bg-white  shadow-lg p-4 transition-all duration-300 hover:shadow-xl">
        <div className="flex items-center">
          <div className="relative">
            <img
              className="h-[40px] w-[40px] rounded-full object-cover border-1 border-gray-300"
              src="https://plus.unsplash.com/premium_photo-1683817138631-c5fb4990d01d?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="user"
            />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          </div>

          <div
            onClick={() => setModalBox(true)}
            className="flex-1  px-3 py-3 cursor-pointer transition-colors duration-200"
          >
            <p className="text-black/20 font-medium">What's hot?</p>
          </div>

          <button
            onClick={() => setModalBox(true)}
            className="px-4 py-2 bg-white text-black/70 rounded-md border border-gray-300 font-medium  transform hover:scale-105 transition-all duration-300 focus:outline-none cursor-pointer  "
          >
            Post
          </button>
        </div>
      </div>
      {modalBox && <ModelPost closeModal={() => setModalBox(false)} />}
    </>
  );
};

export default CreatePost;

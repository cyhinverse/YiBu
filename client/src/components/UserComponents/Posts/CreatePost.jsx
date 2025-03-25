import React, { useState } from "react";
import ModelPost from "./ModelPost";
import { useSelector } from "react-redux";

const CreatePost = () => {
  const [modalBox, setModalBox] = useState(false);
  const user = useSelector((state) => state?.auth?.user);
  return (
    <>
      <div className="w-full bg-white border-b border-gray-300   p-4 transition-all duration-300 ">
        <div className="flex items-center">
          <div className="relative">
            <img
              className="h-[40px] w-[40px] rounded-full object-cover border-1 border-gray-300"
              src={user?.avatar}
              alt="user"
            />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          </div>

          <div
            onClick={() => setModalBox(true)}
            className="flex-1  px-3 py-3 cursor-pointer transition-colors duration-200"
          >
            <p className=" font-medium">What's hot?</p>
          </div>

          <button
            onClick={() => setModalBox(true)}
            className="px-4 py-2 bg-white rounded-md border border-gray-300 font-medium  transform hover:scale-105 transition-all duration-300 focus:outline-none cursor-pointer  "
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

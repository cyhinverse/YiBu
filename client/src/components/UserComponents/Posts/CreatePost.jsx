import React, { useState } from "react";
import ModelPost from "./ModelPost";

const CreatePost = () => {
  const [modalBox, setModalBox] = useState(false);

  return (
    <>
      <div className="w-full h-[50px] bg-white flex px-5 items-center rounded-t-xl shadow-md">
        <span
          onClick={() => setModalBox(true)}
          className="inline-block w-full text-gray-400 cursor-text"
        >
          What do you think about the future....
        </span>
        <button
          onClick={() => setModalBox(true)}
          className="w-[90px] h-[40px] bg-purple-500 text-white rounded-md hover:opacity-70 cursor-pointer"
        >
          Post
        </button>
      </div>
      {modalBox && <ModelPost closeModal={() => setModalBox(false)} />}
    </>
  );
};

export default CreatePost;

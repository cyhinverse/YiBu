import React, { useState } from "react";
import ModelPost from "./ModelPost";
import { useSelector } from "react-redux";
import { Button } from "../../../Common";
import { IoImageOutline } from "react-icons/io5";

const CreatePost = () => {
  const [modalBox, setModalBox] = useState(false);
  const user = useSelector((state) => state?.auth?.user);

  return (
    <>
      <div className="w-full bg-surface border-b border-surface-highlight p-4 transition-all duration-300">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <img
              className="h-10 w-10 rounded-full object-cover border border-surface-highlight"
              src={user?.avatar || "https://via.placeholder.com/40"}
              alt="user"
            />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-surface"></div>
          </div>

          <div
            onClick={() => setModalBox(true)}
            className="flex-1 bg-background hover:bg-surface-highlight px-4 py-2 rounded-full cursor-pointer transition-colors duration-200 border border-transparent hover:border-surface-highlight"
          >
            <p className="text-text-secondary font-medium">What's on your mind?</p>
          </div>

          <Button
            onClick={() => setModalBox(true)}
            variant="primary"
            size="sm"
            className="shadow-lg shadow-primary/20"
            startIcon={<IoImageOutline className="w-5 h-5" />}
          >
            Post
          </Button>
        </div>
      </div>
      {modalBox && <ModelPost closeModal={() => setModalBox(false)} />}
    </>
  );
};

export default CreatePost;

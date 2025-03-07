import React from "react";
import "./index.css";
import Profile from "./Profile";
import SuggestFriends from "./SuggestFriends";

const HomeProfile = () => {
  return (
    <div className="flex w-full h-full bg-gray-100 gap-4 ">
      <Profile/>
      <SuggestFriends/>
    </div>
  );
};

export default HomeProfile;

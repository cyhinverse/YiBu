import { Music, Phone, Video } from "lucide-react";
import React from "react";
import { useContext } from "react";
import { DataContext } from "../../../DataProvider";


const HeaderMessageContent = () => {
  const {showHideMusic,setShowHideMusic} = useContext(DataContext)
  return (
    <div className="w-auto  h-[9%]  rounded-xl shadow-md justify-between mx-1 px-5 flex border border-gray-300">
      <div className="flex items-center gap-2 w-[200px] h-full hover:bg-violet-200  rounded-xl px-2 transition-all ease-in-out duration-300 cursor-pointer ">
        <img
          className="h-[40px] w-[40px] rounded-full object-cover"
          src="https://images.unsplash.com/photo-1599110364868-364162848518?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Avatar"
        />
        <div className="flex flex-col ml-2">
          <span className="text-black hover:text-violet-500">Nam Nguyen</span>
          <span className="text-black/20 text-sm">Active 3m ago</span>
        </div>
      </div>

      <div className="flex gap-4 h-full items-center">
        <Phone className="cursor-pointer" />
        <Video className="cursor-pointer" />
        <Music onClick={() => setShowHideMusic(!showHideMusic)} className="cursor-pointer"  />
      </div>
    </div>
  );
};

export default HeaderMessageContent;

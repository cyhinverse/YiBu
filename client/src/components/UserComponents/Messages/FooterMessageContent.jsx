import { Bone, Image, Mic, SquarePlus } from "lucide-react";
import React from "react";

const FooterMessageContent = () => {
  return (
    <div className="w-auto  h-[9%] items-center mx-1  rounded-xl  justify-between  flex  gap-2">
      <div className="w-[20%] h-full flex justify-center rounded-xl shadow-md border border-gray-300 items-center gap-2 ">
        <SquarePlus size={20} />
        <Image size={20} />
        <Mic size={20} />
      </div>
      <div className="w-[70%] h-full flex justify-center rounded-xl shadow-md outline-none border border-gray-300">
        <input
          type="text"
          className="w-full h-full px-3 font-normal text-black/20 border-none outline-none"
          placeholder="Aa"
        />
      </div>
      <div className="w-[10%] bg-violet-200 h-full rounded-xl flex justify-center items-center shadow-md">
        <Bone size={20} />
      </div>
    </div>
  );
};

export default FooterMessageContent;

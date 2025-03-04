import React from "react";
import HeaderMessageContent from "./HeaderMessageContent";
import MainMessageContent from "./MainMessageContent";
import FooterMessageContent from "./FooterMessageContent";

const MessageContents = () => {
  return (
    <div className="w-full h-full flex flex-col gap-3">
      <HeaderMessageContent />
      <MainMessageContent />
      <FooterMessageContent />
    </div>
  );
};

export default MessageContents;

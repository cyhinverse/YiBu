import React from "react";

const MessageOptions = ({ showOptions }) => {
  const MessageOp = [
    {
      id: 1,
      name: "Disable messages",
    },
    {
      id: 2,
      name: "Message security",
    },
    {
      id: 3,
      name: "Store messages",
    },
    {
      id: 4,
      name: "Exit",
    },
  ];
  return (
    showOptions && (
      <div className="z-20 flex flex-col gap-1 w-fit p-4 rounded-md border border-gray-300 h-fit bg-purple-500 absolute top-5 ">
        {MessageOp.map((option) => (
          <div
            className="text-white font-medium  w-full text-nowrap bg-white/20 hover:opacity-60 cursor-pointer p-2 rounded-md outline-none"
            key={option.id}
          >
            {option.name}
          </div>
        ))}
      </div>
    )
  );
};

export default MessageOptions;

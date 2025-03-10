import React from "react";

const MessageOptions = ({ showOptions }) => {
  const MessageOp = [
    { id: 1, name: "Disable messages" },
    { id: 2, name: "Message security" },
    { id: 3, name: "Save messages" },
    { id: 4, name: "Add users" },
    { id: 5, name: "Exit" },
  ];

  return (
    showOptions && (
      <div className="z-20 absolute top-8 right-0 w-48 bg-white shadow-lg border border-gray-200 rounded-xl p-2 flex flex-col gap-1 animate-fadeIn">
        {MessageOp.map((option) => (
          <div
            key={option.id}
            className="px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-purple-100 hover:text-purple-700 cursor-pointer transition-colors"
          >
            {option.name}
          </div>
        ))}
      </div>
    )
  );
};

export default MessageOptions;

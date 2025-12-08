import React from 'react';
 

const TopUser = ({ content = [] }) => {
  return (
    <div className="p-4">
      <h2 className="text-lg font-bold font-heading mb-4 text-text-primary tracking-tight">
        Suggested Users
      </h2>
      <div className="flex flex-col gap-2">
        {content.map((user, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-2 rounded-lg 
            hover:bg-surface-highlight transition-all duration-200 cursor-pointer group"
          >
            <div className="flex items-center gap-3 w-full">
              <div
                className="w-8 h-8 flex shrink-0 items-center justify-center rounded-full 
                bg-surface-highlight text-text-secondary font-semibold text-sm 
                group-hover:bg-primary group-hover:text-white transition-colors"
              >
                {index + 1}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-text-primary text-sm font-medium truncate group-hover:text-primary transition-colors">
                  {user.content}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopUser;

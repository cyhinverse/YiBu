
import { Card } from "../../../../Common";

const TopUser = ({ content }) => {
  return (
    <Card className="h-full !p-0 overflow-hidden bg-surface shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="p-6">
        <h1 className="text-center text-xl md:text-2xl font-bold mb-6 bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">
          Đề xuất
        </h1>

        <div className="flex flex-col gap-3">
          {content.map((user, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-xl
              bg-surface-highlight/50
              hover:bg-violet-50 dark:hover:bg-violet-900/20
              border border-transparent hover:border-violet-200 dark:hover:border-violet-800
              transition-all duration-300 cursor-pointer group"
            >
              <div className="flex items-center gap-3 w-full">
                <div
                  className="w-8 h-8 flex shrink-0 items-center justify-center rounded-full 
                  bg-violet-100 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300 
                  font-bold text-sm shadow-sm group-hover:scale-110 transition-transform"
                >
                  {index + 1}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-text-primary text-sm font-medium truncate">
                    {user.content}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default TopUser;

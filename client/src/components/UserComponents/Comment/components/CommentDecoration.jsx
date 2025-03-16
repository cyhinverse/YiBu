const CommentDecoration = ({ replies }) => {
  return (
    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-300 via-pink-300 to-blue-300 rounded-full">
      <div className="absolute -left-1 top-0 w-3 h-3 rounded-full bg-purple-400 shadow-md shadow-purple-200 animate-pulse-slow"></div>
      <div className="absolute -left-1 top-1/3 w-2 h-2 rounded-full bg-pink-400 shadow-sm shadow-pink-200"></div>
      <div className="absolute -left-1 top-2/3 w-2 h-2 rounded-full bg-blue-400 shadow-sm shadow-blue-200"></div>
      <div className="absolute -left-1 bottom-0 w-3 h-3 rounded-full bg-indigo-400 shadow-md shadow-indigo-200 animate-pulse-slow"></div>

      {replies.map(
        (reply, index) =>
          reply.isChildReply && (
            <div
              key={`flower-${reply.id}`}
              className="absolute -right-6"
              style={{
                top: `${((index + 1) * 100) / (replies.length + 1)}%`,
                transform: "translateY(-50%)",
              }}
            >
              <div className="flower-stem"></div>
              <div className="flower flower-pointing">
                <div className="petal petal-1"></div>
                <div className="petal petal-2"></div>
                <div className="petal petal-3"></div>
                <div className="petal petal-4"></div>
                <div className="petal petal-5"></div>
                <div className="flower-center"></div>
              </div>
            </div>
          )
      )}
    </div>
  );
};

export default CommentDecoration;

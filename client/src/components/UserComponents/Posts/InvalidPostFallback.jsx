const InvalidPostFallback = ({ message }) => (
  <div className="w-full p-4 border-b border-gray-200">
    <div className="flex items-center space-x-2">
      <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
      <div>
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-3 w-16 bg-gray-100 rounded mt-2 animate-pulse"></div>
      </div>
    </div>
    <div className="mt-3 text-sm text-red-500">{message}</div>
  </div>
);

export default InvalidPostFallback;

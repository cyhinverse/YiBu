import React from 'react'

const SuggestFriends = () => {
  return (
    <div className="flex-1 h-full bg-white rounded-2xl shadow-lg p-6">
    <h2 className="text-lg font-semibold mb-4">Gợi ý kết bạn</h2>
    <ul className="space-y-4">
      {["Nguyễn Văn A", "Trần Thị B", "Lê Văn C"].map((name) => (
        <li key={name} className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
          <div>
            <p className="text-sm font-medium">{name}</p>
            <button className="text-xs text-blue-500 hover:underline">
              Kết bạn
            </button>
          </div>
        </li>
      ))}
    </ul>
  </div>
  )
}

export default SuggestFriends

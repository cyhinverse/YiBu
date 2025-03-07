import React from 'react';
import { Pencil, PlusCircle } from 'lucide-react';
import { Post } from '../Posts';

const Profile = () => {
  return (
    <div className="w-[75%] h-full bg-white  rounded-3xl shadow-2xl overflow-y-scroll space-y-3 scroll-pr" >
      

      <div className="relative bg-gradient-to-tr from-black to-purple-500 p-6 rounded-2xl shadow-lg">

        <div className="flex items-center gap-6">
          <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-lg">
            <img
              src="https://plus.unsplash.com/premium_photo-1671656349322-41de944d259b?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="User Avatar"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="text-white">
            <h2 className="text-3xl font-bold">Nguyễn Văn Z</h2>
            <p className="text-sm opacity-90 mt-1">Fullstack Developer 🚀</p>
            <p className="text-sm opacity-90 mt-1">📍 Hồ Chí Minh, Việt Nam</p>
          </div>


          <button
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-white hover:bg-purple-100 text-purple-700 rounded-full shadow-md transition-all"
          >
            <Pencil size={18} />
          </button>
        </div>

        <p className="text-center text-purple-100 italic mt-6">
          "Đam mê công nghệ, cháy hết mình với từng dòng code."
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-md border border-purple-100 text-gray-800 space-y-4">
        <h3 className="text-2xl font-semibold text-violet-700 mb-4">Thông tin cá nhân</h3>
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-gray-500">Ngày sinh</p>
            <p className="font-medium">01/01/2000</p>
          </div>
          <div>
            <p className="text-gray-500">Giới tính</p>
            <p className="font-medium">Nam</p>
          </div>
          <div>
            <p className="text-gray-500">Email</p>
            <p className="font-medium">nguyenvanz@example.com</p>
          </div>
          <div>
            <p className="text-gray-500">Số điện thoại</p>
            <p className="font-medium">+84 123 456 789</p>
          </div>
          <div className="col-span-2">
            <p className="text-gray-500">Địa chỉ</p>
            <p className="font-medium">123 Đường ABC, Quận 1, TP. Hồ Chí Minh</p>
          </div>
        </div>
      </div>


      <div className="bg-white p-6 rounded-2xl shadow-md border border-purple-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-300">
            <img
              src="https://plus.unsplash.com/premium_photo-1671656349322-41de944d259b?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="User Avatar"
              className="w-full h-full object-cover"
            />
          </div>
          <input
            type="text"
            placeholder="Bạn đang nghĩ gì?"
            className="flex-1 p-3 bg-gray-100 rounded-full text-sm text-gray-700 placeholder-gray-400 outline-none"
          />
          <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-md">
            <PlusCircle size={18} />
            Đăng
          </button>
        </div>
      </div>
      <Post/>
      <Post/>
    </div>
  );
};

export default Profile;

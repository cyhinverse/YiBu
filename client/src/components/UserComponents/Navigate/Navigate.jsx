import React, { useContext } from "react";
import { Bell, Home, MessageCircle, MonitorPlay, Search } from "lucide-react";
import { DataContext } from "../../../DataProvider";

const Navigate = () => {
  const { hideSearch, setHideSearch } = useContext(DataContext);

  return (
    <>
      <div className="flex min-w-[250px] items-center px-3 h-full shadow-xl  rounded-xl bg-amber-50 ">
        {hideSearch && <Search size={20} />}
        <input
          onClick={() => setHideSearch(!hideSearch)}
          className="indent-2 h-[35px] outline-none cursor-pointer"
          type="text"
          placeholder="Search event..."
        />
      </div>
      <div className="flex max-w-[250px] justify-between shadow-xl rounded-xl h-full items-center px-7 bg-amber-50">
        <div className="w-[50px] h-[50px] flex items-center justify-center rounded-xl hover:opacity-25 transition-all ease-out cursor-pointer">
          <Home />
        </div>
        <div className="w-[50px] h-[50px] flex items-center justify-center rounded-xl hover:opacity-25 transition-all ease-out cursor-pointer">
          <MessageCircle />
        </div>
        <div className="w-[50px] h-[50px] flex items-center justify-center rounded-xl hover:opacity-25 transition-all ease-out cursor-pointer">
          <MonitorPlay />
        </div>
      </div>
      <div className="flex max-w-[200px] justify-end items-center gap-3 bg-amber-50 h-full px-5 shadow-xl rounded-xl">
        <Bell className="cursor-pointer" size={25} />
        <img
          className="h-[40px] w-[40px] rounded-full object-cover cursor-pointer"
          src="https://plus.unsplash.com/premium_photo-1671656349322-41de944d259b?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt=""
        />
      </div>
    </>
  );
};

export default Navigate;

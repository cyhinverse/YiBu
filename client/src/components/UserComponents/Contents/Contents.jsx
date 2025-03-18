import React from "react";
import { CreatePost } from "../Posts";
import "./index.css";
import { TrendingTopics } from "../TrendingTopics";
import TopUser from "../TopUser/TopUser";
import PostLists from "../Posts/PostLists";
import { useDispatch } from "react-redux";
import { useEffect } from "react";
import POST from "../../../services/postService";
import { getAllPost, getPostUserById } from "../../../slices/PostSlice";

const Contents = () => {
  const trendingTopics = [
    { name: "#ChillCuốiTuần", posts: "12.4K" },
    { name: "#MondayMood", posts: "8.1K" },
    { name: "#FoodieLife", posts: "5.9K" },
    { name: "#CodeNewbie", posts: "3.4K" },
    { name: "#Travel2025", posts: "10.7K" },
  ];
  const contentPost = [
    { content: "Nguoi anh em o dong nai bat duoc ca sau" },
    { content: "Mot vu no lon tai cac nha may hat nhan cua my" },
    { content: "Chi phu cac quoc gia dang yeu cau trong cay" },
    { content: "Di em gai duoi que" },
  ];

  const dispatch = useDispatch();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await POST.GET_ALL_USER();
        dispatch(getAllPost(res.posts));
      } catch (error) {
        console.error("Error ", error);
      }
    };
    fetchPosts();
  }, []);

  return (
    <div className="w-[95vw] h-[86vh] bg-purple-50 mt-5 shadow-md rounded-xl m-auto flex flex-col md:flex-row gap-6 ">
      <div className="w-full md:w-[100%] h-full rounded-xl flex flex-col md:flex-row justify-between gap-6">
        <div className="hidden md:block md:w-1/4 h-full">
          <TopUser content={contentPost} />
        </div>
        <div className="w-full md:w-1/2 h-full overflow-y-scroll content-post rounded-t-xl border border-gray-300">
          <CreatePost />
          <PostLists />
        </div>

        <div className="hidden md:block md:w-1/4">
          <TrendingTopics trendingTopics={trendingTopics} />
        </div>
      </div>
    </div>
  );
};

export default Contents;

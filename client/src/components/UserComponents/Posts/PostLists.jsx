import React, { useEffect, useState } from "react";
import Post from "./Post";
import POST from "../../../services/postService";
import { useDispatch } from "react-redux";
import { GetPostUserByID } from "../../../slices/PostSlice";

const PostLists = () => {
  const [postList, setPostList] = useState([]);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await POST.GET_POST_USER_BY_ID();
        setPostList(res.post);
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    };

    fetchPosts();
  }, []);

  useEffect(() => {
    if (postList.length > 0) {
      dispatch(GetPostUserByID(postList));
    }
  }, [postList, dispatch]);

  return (
    <div>
      {postList.length > 0 ? (
        postList.map((post) => <Post key={post._id} data={post} />)
      ) : (
        <p>No posts available</p>
      )}
    </div>
  );
};

export default PostLists;

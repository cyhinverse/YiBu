import Post from "./Post";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

const PostLists = () => {
  const location = useLocation();
  const path = location.pathname;
  const data = useSelector((s) => s.post.commonPost);

  return (
    <div>
      {path.includes("/") ? (
        data?.map((post) => <Post key={post._id} data={post} />)
      ) : (
        <p>No posts available</p>
      )}
    </div>
  );
};

export default PostLists;

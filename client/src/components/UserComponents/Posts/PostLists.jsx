import Post from "./Post";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

const PostLists = ({ lastPostElementRef }) => {
  const location = useLocation();
  const path = location.pathname;
  const data = useSelector((s) => s.post?.commonPost || []);
  const postOfUser = useSelector((s) => s.post?.userPost || []);

  return (
    <div>
      {path === "/"
        ? data.map((post, index) => {
            if (data.length === index + 1) {
              return (
                <div key={post._id} ref={lastPostElementRef}>
                  <Post data={post} />
                </div>
              );
            } else {
              return <Post key={post._id} data={post} />;
            }
          })
        : postOfUser.map((post) => <Post key={post._id} data={post} />)}
    </div>
  );
};

export default PostLists;

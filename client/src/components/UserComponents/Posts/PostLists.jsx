import Post from "./Post";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

const PostLists = ({ lastPostElementRef }) => {
  const location = useLocation();
  const path = location.pathname;
  const data = useSelector((s) => s.post?.commonPost || []);
  const postOfUser = useSelector((s) => s.post?.userPost || []);
  const hiddenPosts = useSelector(
    (state) => state.hiddenPosts?.hiddenPosts || []
  );

  // Lọc các bài viết đã ẩn
  const filterHiddenPosts = (posts) => {
    if (!Array.isArray(posts) || !Array.isArray(hiddenPosts)) return posts;
    return posts.filter((post) => !hiddenPosts.includes(post._id));
  };

  const filteredData = filterHiddenPosts(data);
  const filteredUserPosts = filterHiddenPosts(postOfUser);

  return (
    <div>
      {path === "/"
        ? filteredData.map((post, index) => {
            if (filteredData.length === index + 1) {
              return (
                <div key={post._id} ref={lastPostElementRef}>
                  <Post data={post} />
                </div>
              );
            } else {
              return <Post key={post._id} data={post} />;
            }
          })
        : filteredUserPosts.map((post) => <Post key={post._id} data={post} />)}
    </div>
  );
};

export default PostLists;

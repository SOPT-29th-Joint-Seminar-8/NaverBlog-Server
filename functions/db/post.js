const _ = require('lodash');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

const getParsedDate = (date) => {
  let month = date.getMonth() + 1;
  let day = date.getDate();

  return `${date.getFullYear()}. ${month}. ${day}.`;
};

const getMain = async (client) => {
  // 블로그 메인 가져오기
  let { rows: banner } = await client.query(
    `
        SELECT blog_id, banner_image, today_count, total_count, blog_name,
                profile_name, blog_category, neighbor_num
        FROM blog b
        WHERE b.blog_id = 1
        `,
  );
  banner = convertSnakeToCamel.keysToCamel(banner);

  // 게시글 데이터 불러오기
  let { rows: posts } = await client.query(
    `
        SELECT p.post_id, p.title, p.content, p.heart_num,
                p.secret_comment_num, p.is_like, p.created_at, count(c) as comment_num
        FROM post p
        LEFT JOIN comment c on p.post_id = c.post_id
        WHERE p.is_deleted = FALSE
        GROUP BY p.post_id, p.title, p.content, p.heart_num,
                p.secret_comment_num, p.is_like, p.created_at
        ORDER BY p.created_at asc
        `,
  );

  posts = posts.map((post) => ({ ...post, created_at: getParsedDate(post.created_at) }));
  posts = convertSnakeToCamel.keysToCamel(posts);

  const result = {
    banner,
    posts,
  };

  return result;
};

const like = async (client, postId, state) => {
  if (state === 'true') state = false;
  else state = true;

  console.log(state);
  await client.query(
    `
    UPDATE post
    SET is_like = $1
    WHERE post_id = $2;
    `,
    [state, postId],
  );
};
module.exports = { getMain, like };

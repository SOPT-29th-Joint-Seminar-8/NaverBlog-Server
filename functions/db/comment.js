const _ = require('lodash');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

// date parsing 함수
const getParsedDate = (date) => {
  let month = date.getMonth() + 1;
  let day = date.getDate();
  let hour = date.getHours();
  let minute = date.getMinutes();

  hour = hour >= 10 ? hour : '0' + hour;
  minute = minute >= 10 ? minute : '0' + minute;

  return `${date.getFullYear()}. ${month}. ${day}. ${hour}:${minute}`;
};

const getAllComments = async(client, post_id) => {
    // 전체 댓글 수 가져오기
    const { rows: commentNum } = await client.query(
        `
        SELECT count(*) AS comment_num
        FROM "comment" c
        WHERE c.post_id = $1
        AND c.is_deleted = FALSE;
        `,
        [post_id]
    );

    // 비밀 댓글 수 가져오기
    const { rows: secretCommentNum } = await client.query(
        `
        SELECT secret_comment_num
        FROM "post" p
        WHERE p.post_id = $1
        AND p.is_deleted = FALSE;
        `,
    [post_id],
  );

  // 모든 댓글 가져오기
  let { rows: comments } = await client.query(
    `
        SELECT comment_id, group_id, user_name, is_owner, content, heart_num, is_like, created_at
        FROM "comment" c
        WHERE post_id = $1
        AND is_deleted = FALSE
        ORDER BY group_id, created_at;
        `,
    [post_id],
  );

  // 날짜 데이터 파싱
  comments = comments.map((comment) => ({ ...comment, created_at: getParsedDate(comment.created_at) }));

  comments = convertSnakeToCamel.keysToCamel(comments);

  // 각 group_id의 댓글 수 가져오기
  const { rows: group } = await client.query(
    `
        SELECT group_id, count(group_id)
        FROM "comment" c
        WHERE post_id = $1
        AND is_deleted = FALSE
        GROUP BY group_id
        ORDER BY group_id
        `,
    [post_id],
  );

    let result = {}; // 최종적으로 return하려는 객체
    result = commentNum[0] // 전체 댓글 개수 넣어주기
    result = {...result, secret_comment_num: secretCommentNum[0].secret_comment_num } // 비밀 댓글 개수 넣어주기
    result["comments"] = []; // 댓글 리스트를 넣어주기 위한 comments 프로퍼티 생성

  // 위에서 생성한 comments 프로퍼티에 원댓글 먼저 넣어주기
  let j = 0;

  for (let i = 0; i < group.length; i++) {
    result['comments'].push(comments[j]); // 원댓글 추가
    result['comments'][i]['reply'] = []; // 나중에 답글 리스트를 넣어주기 위한 빈 배열 함께 생성
    j += parseInt(group[i].count);
  }

  // 원댓글에 답글 데이터 넣어주기
  let index = 0;

  for (let i = 0; i < group.length; i++) {
    // 현재 group에 해당하는 답글을 차례로 넣어줌
    for (j = index + 1; j < index + parseInt(group[i].count); j++) {
      result['comments'][i]['reply'].push(comments[j]);
    }
    index = index + parseInt(group[i].count);
  }

  return convertSnakeToCamel.keysToCamel(result);
};

const addOriginComment = async (client, postId, userName, content) => {
  // 마지막 groupId 가져오기
  const { rows: groupId } = await client.query(
    `
        SELECT MAX(group_id)
        FROM "comment"
        `,
  );

  const maxGroupId = groupId[0].max;

  // 새로운 그룹과 함께 원댓글 생성
  let { rows } = await client.query(
    `
        INSERT INTO "comment"
        (group_id, post_id, user_name, content)
        VALUES
        ($1, $2, $3, $4)
        RETURNING comment_id, group_id, user_name, is_owner, content, heart_num, is_like, created_at
        `,
    [maxGroupId + 1, postId, userName, content],
  );

  rows[0].created_at = getParsedDate(rows[0].created_at);
  rows = convertSnakeToCamel.keysToCamel(rows);

    //증가된 전체 댓글 수 가져오기
    const { rows: num } = await client.query(
        `
        SELECT count(*) AS comment_num
        FROM "comment" c
        WHERE c.post_id = $1
        AND c.is_deleted = FALSE;
        `,
    [postId],
  );

  let result; // 최종적으로 return하려는 객체
  result = num[0]; // 전체 댓글 개수 넣어주기
  result['newComment'] = rows[0]; // 새로 작성한 원댓글

  return convertSnakeToCamel.keysToCamel(result);
};

const addReplyComment = async (client, postId, userName, content, groupId) => {
  // 기존의 그룹에 새로운 답글 생성
  let { rows } = await client.query(
    `
        INSERT INTO "comment"
        (group_id, post_id, user_name, content)
        VALUES
        ($1, $2, $3, $4)
        RETURNING comment_id, group_id, user_name, is_owner, content, heart_num, is_like, created_at
        `,
    [groupId, postId, userName, content],
  );

  rows[0].created_at = getParsedDate(rows[0].created_at);
  rows = convertSnakeToCamel.keysToCamel(rows);

    // 증가된 전체 댓글 수 가져오기
    const { rows: num } = await client.query(
        `
        SELECT count(*) AS comment_num
        FROM "comment" c
        WHERE c.post_id = $1
        AND c.is_deleted = FALSE;
        `,
    [postId],
  );

  let result; // 최종적으로 return하려는 객체
  result = num[0]; // 전체 댓글 개수 넣어주기
  result['newComment'] = rows[0]; // 새로 작성한 답글

  return convertSnakeToCamel.keysToCamel(result);
};

const like = async (client, commentId, state) => {
  if (state === 'true') state = false;
  else state = true;

  console.log(state);
  await client.query(
    `
      UPDATE comment
      SET is_like = $1
      WHERE comment_id = $2;
      `,
    [state, commentId],
  );
};

module.exports = { getAllComments, addOriginComment, addReplyComment, like };

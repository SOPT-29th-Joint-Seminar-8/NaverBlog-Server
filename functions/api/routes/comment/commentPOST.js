const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const { commentDB } = require('../../../db');

module.exports = async (req, res) => {
  const { postId, userName, content, groupId } = req.body;
  if (!postId || !userName || !content || !groupId) return res.status(statusCode.BAD_REQUEST).send(util.fail(responseMessage.NULL_VALUE));

  let client;

  try {
    client = await db.connect(req);

    if(groupId == -1) { // 원댓글 생성하는 경우
      const newComment = await commentDB.addOriginComment(client, postId, userName, content);
      res.status(statusCode.OK).send(util.success(responseMessage.ADD_ONE_COMMENT_SUCCESS, newComment));
    } else { // 답글 생성하는 경우
      const newComment = await commentDB.addReplyComment(client, postId, userName, content, groupId);
      res.status(statusCode.OK).send(util.success(responseMessage.ADD_ONE_COMMENT_SUCCESS, newComment));
    }
  } catch (error) {
    functions.logger.error(`[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`, `[CONTENT] ${error}`);
    console.log(error);
    res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.fail(responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
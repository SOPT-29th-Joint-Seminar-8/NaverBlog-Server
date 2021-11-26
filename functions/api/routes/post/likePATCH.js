const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const { postDB } = require('../../../db');

module.exports = async (req, res) => {
  let client;

  const { post_id } = req.params;
  const { state } = req.query;
  if (!state || !post_id) return res.status(statusCode.BAD_REQUEST).send(util.fail(responseMessage.NULL_VALUE));

  try {
    client = await db.connect(req);

    await postDB.like(client, post_id, state);
    res.status(statusCode.OK).send(util.nsuccess(responseMessage.POST_PATCH_LIKE_SUCCESS));
  } catch (error) {
    functions.logger.error(`[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`, `[CONTENT] ${error}`);
    console.log(error);
    res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.fail(responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};

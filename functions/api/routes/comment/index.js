const express = require('express');
const router = express.Router();

router.get('/:post_id', require('./commentPostIdGET'));
router.post('/', require('./commentPOST'));
router.patch('/:comment_id/like', require('./likePATCH'));
module.exports = router;

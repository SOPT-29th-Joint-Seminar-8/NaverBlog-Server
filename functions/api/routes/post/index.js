const express = require('express');
const router = express.Router();

router.get('/main', require('./mainGET'));
router.patch('/:post_id/like', require('./likePATCH'));
module.exports = router;

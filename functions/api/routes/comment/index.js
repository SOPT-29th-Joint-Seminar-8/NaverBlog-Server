const express = require('express');
const router = express.Router();

router.get('/:post_id', require('./commentPostIdGET'));
router.post('/', require('./commentPOST'));

module.exports = router;
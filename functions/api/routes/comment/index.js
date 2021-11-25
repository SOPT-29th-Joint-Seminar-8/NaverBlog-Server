const express = require('express');
const router = express.Router();

router.get('/:post_id', require('./commentPostIdGET'));

module.exports = router;
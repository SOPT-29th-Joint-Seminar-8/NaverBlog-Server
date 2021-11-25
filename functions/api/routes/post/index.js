const express = require('express');
const router = express.Router();

router.get('/main', require('./mainGET'));

module.exports = router;

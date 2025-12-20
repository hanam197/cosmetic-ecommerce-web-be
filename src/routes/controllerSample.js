const express = require('express');
const router = express.Router();
const { getSample } = require('../controllers/sampleController');

router.get('/controller-sample', getSample);

module.exports = router;


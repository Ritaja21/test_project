const express = require('express');
const { searchOpenAlex } = require('../Controller/OpenAlexController');

const router = express.Router();

// GET /api/openalex?q=machine+learning
router.get('/', searchOpenAlex);

module.exports = router;

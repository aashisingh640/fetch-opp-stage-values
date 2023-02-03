const express = require('express');
const router = express.Router();

const controller = require('../controllers/api.js');

router.get('/picklist-values', controller.getPicklistValues);

module.exports = router;
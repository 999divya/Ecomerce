const express = require('express');
const route = express.Router();
const logoutController = require('../controllers/userController');

route.get('/', logoutController.logoutHandler)


module.exports = route;
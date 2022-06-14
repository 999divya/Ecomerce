const { Router } = require('express');
const express = require('express');
const route = express.Router();
const loginController = require('../controllers/userController')



route.get('/', (req,res)=>{
    lk=false;
    res.render('login',{lk:false});
});






route.post('/',  loginController.loginHandler)



module.exports = route;

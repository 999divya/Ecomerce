const express = require('express');
const route = express.Router();
const registerController = require('../controllers/userController')

route.get('/', async(req,res)=>{
    const lk=false;

    let refer = (await req.query.refer) ? req.query.refer : null;
    res.render('register',{refer})
});

route.post('/', registerController.registerHandler)



module.exports = route;
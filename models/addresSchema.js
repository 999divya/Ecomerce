const mongoose = require('mongoose');//object modelling tool for mongodb
const Schema = mongoose.Schema;
const User = require('../models/userSchema')

const addressSchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
 userfname:{
     type:String
 },
 userlname:{
    type:String
},
 usermob:{
     type:Number
 },
    firstname:{
        type:String,
        required:true
    },
    lastname:{
        type:String,
        required:true
    },
    mobile:{
        type:String,
        required:true
    },
    city:{
        type:String,
        required:true
    },
    pincode:{
        type:String,
        required:true
    },
    state:{
        type:String,
        required:true
    },
    shipping:{
        type:String,
        required:true
    }
});

module.exports = mongoose.model('Address', addressSchema)
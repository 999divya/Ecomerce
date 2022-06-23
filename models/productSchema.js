const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new Schema({
    ID: {
        type: mongoose.Types.ObjectId,
    },
    name:{
        type:String,
        required:true
    },
    code:{
        type:String,
        required:true
    },
    price:{
        type:Number
        
    },
    percentage:{
        type:Number
    },
    discount:{
        type:Number
    },
    realAmount:{
        type:Number
    },
    brand:{
        type:String,
      
    },
    size:{
        type:String,
        required:true
    },
    type:{
        type:String,
    },
    description:{
        type:String,
        required:true
    }, 
    category:{
        type:String,
        required:true
    },
    haspercent:{
        type:Boolean,
    },
    Image:Array,
   
});

module.exports = mongoose.model('Product', productSchema)//products
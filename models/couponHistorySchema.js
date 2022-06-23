const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const couponhistoryschema = new mongoose.Schema({

    user :{ 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    order:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'orders'
    },
    paymentMethod:{
        type: String,
        required: true
    },
    couponcode:{
        type:String
    },
    date:{
        type: String,
    }, 

    totalAmount:{
        type:String     
    },
    percentage:{
        type:Number,       
    },
    discount:{
        type:Number       
    },
    discountedAmt:{
        type:Number,       
    },
    Orderdate:{
        type:String
    },
    status:{
        type:String,
        required:true,
    }
    
});

module.exports= mongoose.model('Couponhistory', couponhistoryschema);
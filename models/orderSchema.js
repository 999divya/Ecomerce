const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderschema = new mongoose.Schema({
    deliveryDetails:{
        type: Object,
        required: true
    },
    User:{type:String},
    user :{ 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    paymentMethod:{
        type: String,
        required: true
    },
    date:{
        type: String,
    },
    time:{
        type: String,
     
    },
    products:{
        type:Array,
        required:true
    },
    totalAmount:{
        type:Number,
        required:true
    },
    dateIso:{
        type:Date
    },
    status:{
        type:String,
        required:true,
    },
    totalMRP:{
        type:Number
    },
    totalOfferDiscount:{
        type:Number
    },
    couponcode:{
        type:String
    },

    couponpercent:{
        type:Number
    },
    coupondiscount:{
        type:Number
    },
    usedwalletamount:{
        type:Number
    }

});

module.exports= mongoose.model('Order', orderschema);//orders


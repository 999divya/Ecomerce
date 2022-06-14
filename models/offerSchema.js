const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const offerSchema = new mongoose.Schema({
    percentage:{
        type: Number,
        required: true
    },
    proId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'products'
    },
    productname:{
        type:String,
        required:true
    },
    productprice:{
        type:Number,
        required:true
    },
    offername:{
        type:String,
        required:true
    },
    fromDate:{
        type: Date,
        required: true
    },
    toDate:{
        type: Date,
        required: true
    },
    status:{
        type: String,
        default: "Active"
    }
})

module.exports = mongoose.model('Offer',offerSchema);
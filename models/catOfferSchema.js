const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const catOfferSchema = new mongoose.Schema({
    percentage:{
        type: Number,
        required: true
    },
    catId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'categories'
    },
    categoryname:{
        type:String,
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
  
    status: {
        type: String,
        default: "Active"
    },
})

module.exports = mongoose.model('catOffer',catOfferSchema);
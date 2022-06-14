
   
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const couponSchema = new mongoose.Schema({

    couponcode: {
        type: 'string',
        required: true
    },
    percentage: {
        type: Number,
        required: true
    },
    fromDate: {
        type: Date,
        required: true
    },
    toDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        default: "Active"
    },
 users:Array
})

module.exports = mongoose.model('Coupon', couponSchema);

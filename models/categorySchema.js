const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const categorySchema = new Schema({
    ID: {
        type:Number
        // type: mongoose.Types.ObjectId,
    },
    category: {
        type: String,
        // unique:true,
        required: true
    },
    percentage:{
        type:Number,
    },
    Image:Array
});

module.exports = mongoose.model('Category', categorySchema);
const mongoose = require('mongoose')
const Schema = mongoose.Schema;


const cartSchema = new Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    products: Array

})

const cartdb = mongoose.model('Cart', cartSchema)
module.exports = cartdb;




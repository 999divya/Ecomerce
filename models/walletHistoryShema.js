const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const wallethistoryschema = new mongoose.Schema({

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
    date:{
        type: String,
    },     
    WalletAmount:{
        type:Number       
    },
    appliedWalletAmount:{
        type:Number,       
    },
    currentWalletAmount:{
        type:Number       
    },
    creditedAmount:{
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

module.exports= mongoose.model('Wallethistory', wallethistoryschema);
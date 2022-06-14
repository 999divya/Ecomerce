const user = require('../models/userSchema');
const Product = require('../models/productSchema');
const Category = require('../models/categorySchema');
const order = require('../models/orderSchema');
const cart = require('../models/cartSchema');
var ObjectId = require('mongoose').Types.ObjectId;

var accountSID = process.env.TWILIO_ACCOUNT_SID;
var authToken = process.env.TWILIO_AUTH_TOKEN;
var serviceSID = process.env.TWILIO_SERVICE_SID;

const client = require("twilio")(accountSID, authToken);

//otp page of user login
exports.otpHandler = async (req, res) => {

    const theUser = await user.findOne({
        mobile: req.body.mobile
    })
  

    if (!theUser) {
        res.render('otp-mobile', { message: 'User not found' });
    }
    else {
        client.verify.services(serviceSID)
            .verifications.create({
                to: `+91${req.body.mobile}`,
                channel: "sms"
            })
            .then((respon) => {
                res.render('otp-login', { mobile: req.body.mobile });

            }).catch((err)=>{
                console.log(err.message)
            })
    }

}

//otp checking for user-login

exports.otpChecker = async (req, res) => {
 
    const otp = req.body.otp1 + req.body.otp2 + req.body.otp3 + req.body.otp4;

    client.verify.services(serviceSID)
        .verificationChecks.create({
            to: `+91${req.body.mobile}`,
            code: otp,
        })
        .then(async(respon) => {
            if (respon.valid) {
                const userdata= await user.findOne({mobile: req.body.mobile});
                    req.session.user = userdata;
                    req.session.isLoggedin = true;
                    // const womenProductDetails = await Product.find({
                    //     category: "WOMEN"
                    // });
                    // const kidsProductDetails = await Product.find({
                    //     category: "KIDS"
                    // });
const userId = req.session.user._id;
                    var cartcount = await cart.find({ user: ObjectId(userId) })
                    var count=0;
                       if (cartcount==''||cartcount==null||cartcount==undefined) {

                          count=0;  
                       }else{
                          count = cartcount[0].products?.length;
                       }
                    const productDetails = await Product.find()
                    const categoryDetails = await Category.find()

        if (req.session.isLoggedin)
         {
             if(productDetails && categoryDetails && req.session.user){
                 
                 res.render('userviews/user-home', { lk:true, products: productDetails,count, categorys: categoryDetails, userdetails: req.session.user})
                }
                else{
                    res.redirect('/');

           }
        }
      
        }
        else {
        res.render('otp-mobile', { message: 'invalid otp', mobile: req.body.mobile });
        }
        }).catch((err)=>{
            console.log(err.message);
        })
} 

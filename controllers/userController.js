const user = require('../models/userSchema');
const bcrypt = require('bcrypt');
const Product = require('../models/productSchema')
const order = require('../models/orderSchema')
const Category = require('../models/categorySchema')
const url = require('url');
const cart = require('../models/cartSchema')
var ObjectId = require('mongoose').Types.ObjectId;
const createReferal = require("referral-code-generator");
const offer = require('../models/offerSchema')
const moment = require('moment')
const catOffer = require('../models/categorySchema');
const Address = require('../models/addresSchema');
const { route } = require('../routes/adminRoutes/adminroute');
const Coupon = require('../models/couponSchema')
const swal = require('sweetalert2');
const wallethistory = require('../models/walletHistoryShema')



exports.registerHandler = async (req, res) => {

    const { fname, lname, email, mobile, pass, repass, isAdmin } = req.body;

    if (pass.length > 2 && (mobile.length > 1 && mobile.length === 10)) {
        if (fname && lname && email && mobile) {
            if (req.body.pass === req.body.repass) {
                const duplicate = await user.findOne({ email: req.body.email }).exec();
                if (duplicate) {

                    res.render('register', { message: 'Duplicate user found' })
                } else {
                    try {

                        const refereduser = await user.findOne({ refer: req.body.refered })

                        let refer = createReferal.alphaNumeric("uppercase", 2, 3);
                        // req.body.refer = refer;

                        let wallet = 0;
                        if (req.body.refered !== '' && refereduser !== undefined) {
                            //    const addRefreal = await user.upda({_id:refereduser._id},
                            //    {$set:{wallet:{$inc:100}}})


                            await user.updateOne({ _id: ObjectId(refereduser._id) }, { $inc: { wallet: 100 } })

                        }


                        if (refereduser) {
                            const result = await user.create({
                                "firstname": fname,
                                "lastname": lname,
                                "email": email,
                                "mobile": mobile,
                                "password": pass,
                                "isActive": true,
                                "wallet": req.body.refered !== '' ? 50 : 0,
                                "refer": refer,
                                "referedBy": refereduser ? ObjectId(refereduser._id) : ''
                                // "isAdmin":true
                            })

                        } else {
                            const result = await user.create({
                                "firstname": fname,
                                "lastname": lname,
                                "email": email,
                                "mobile": mobile,
                                "password": pass,
                                "isActive": true,
                                "wallet": req.body.refered !== '' ? 50 : 0,
                                "refer": refer
                                // "isAdmin":true
                            })

                        }



                        res.render('login', { message: 'Registration completed successfully' });
                    } catch (err) {
                        console.log(err.message);
                    }
                }
            }
        }
    } else {

        res.render('register', { message: 'Invalid mobile number' })
    }
}





exports.loginHandler = async (req, res) => {

    const passw = await bcrypt.hash(req.body.pass, 10);
    if (req.session.isLoggedin) {
        res.redirect('/home-page')
        // res.render('userviews/user-home', { lk: true, userdetails: req.session.user })
    }
    else {
        try {

            const foundUser = await user.findOne({
                email: req.body.email
            });


            if (!foundUser || foundUser.isActive === false) {
                res.render('login', { message: 'User not found or user is blocked' });
            } else {

                const isMatch = await bcrypt.compare(req.body.pass, foundUser.password);

                if (isMatch) {



                    if (foundUser.isAdmin) {


                        req.session.admin = foundUser
                        const admin = req.session.admin.isAdmin;

                        req.session.adminLoggedin = true;



                        if (req.session.adminLoggedin) {
                            res.redirect('/admin')

                        } else {
                            res.redirect('/login')
                        }
                    } else {

                        const productDetails = await Product.find()
                        const categoryDetails = await Category.find()
                        req.session.user = foundUser

                        req.session.isLoggedin = true;

                        if (req.session.isLoggedin) {

                            if (req.session.oldUrl) {
                                var oldUrl = req.session.oldUrl
                                req.session.oldUrl = null;
                                res.redirect(oldUrl);

                            } else {
                                res.redirect('/home-page')

                            }

                        } else {
                            res.redirect('/login')
                        }
                    }
                } else {
                    res.render('login', { message: 'username or password is incorrect' });
                }
            }
        } catch (err) {
            console.log(err.message);
        }
    }
}








exports.showAllUsers = async (req, res) => {
    if (req.session.adminLoggedin) {

        try {
            const allUsers = await user.find({});

            res.render('adminviews/view-users', { admin: true, Allusers: allUsers })
        } catch (err) {
            console.log(err.message);
        }

    } else {
        res.redirect('/login')
    }
}

//admin search user..................
exports.userSearch = async (req, res) => {
    if (req.session.adminLoggedin) {
        try {
            const searchResult = await user.find({
                firstname: new RegExp(req.query.searchdata, "i"),
            })


            res.render('adminviews/view-users', { admin: true, Allusers: searchResult, k: true })

        } catch (err) {
            console.log(err.message);
        }
    } else {
        res.redirect('/login')
    }

}




exports.userBlockHandler = async (req, res) => {
    if (req.session.adminLoggedin) {

        const userdetailsbyID = await user.findOne({
            _id: req.params.id
        }).exec()


        const blockeachuser = await user.findOneAndUpdate({

            _id: req.params.id
        }, { isActive: !userdetailsbyID.isActive });

        const allUsers = await user.find({});
        res.redirect('/admin/view-users');

    } else {
        res.redirect('/login')
    }
}



// exports.showAllProducts = async (req, res) => {
//     if(req.session.isLoggedin){
//     const womenProductDetails = await Product.find({
//         category: "WOMEN"
//     }).exec()
//     const kidsProductDetails = await Product.find({
//         category: "KIDS"
//     }).exec()

//     res.render('userviews/user-home', { lk:true, womenDetails: womenProductDetails, kidsDetails: kidsProductDetails })
// }

// }

exports.logoutHandler = async (req, res) => {



    if (req.session) {
        delete req.session.user;
        delete req.session.admin;

        req.session.isLoggedin = false;
        req.session.adminLoggedin = false;
        req.session.destroy();
        res.render('login', { message: 'User logout successfully' })
    }

}



exports.showWallet = async (req, res) => {

    if (req.session.isLoggedin) {
        let referaluser = await user.findOne({ _id: req.session.user?._id })
        let refer = referaluser.refer;
        let wallet = referaluser.wallet;
      
        let referalLink = "http://localhost:5500/register?refer=" + refer;
        res.render('userviews/wallet', { lk: false, refer, wallet, referalLink, userdetails: req.session.user })
    }


}


exports.walletAmount = async (req, res) => {



    let userid = req.session.user._id;
    let totalamount =   req.session.coupontotalvalue?  req.session.coupontotalvalue:req.session.totalvalue;
    var data = req.body;


    let obj = {}

    let userData = await user.findOne({ _id: ObjectId(userid) })

    if (userData) {

        if (userData.wallet < data.amount) {
            obj.msg = "lesser amount"
            obj.status = false

        } else {
            req.session.wallet =userData.wallet;
            req.session.usedwalletamount  =  parseInt(req.session.usedwalletamount?req.session.usedwalletamount:0)+parseInt(data.amount);
              let currentWlletAmount = parseInt(req.session.wallet) - parseInt(req.session.usedwalletamount);
     
    
            req.session.currentWlletAmount=currentWlletAmount;
     
            obj.walletdiscount= req.session.usedwalletamount;
            obj.totalamount = totalamount - data.amount;
            req.session.totalvalue = totalamount - data.amount;



            obj.status = true
            obj.msg = "Wallet amount successfully applied"
        }
    } else {
        obj.status = false
        obj.msg = "no user found"
    }

    res.json({ status: obj.status, walletdiscount:obj.walletdiscount, total: obj.totalamount, msg: obj.msg });



}



exports.backToHome = async (req, res) => {

   
const userdetails =  req.session?.user;
   
        const ProductDetails = await Product.find()
        const categoryDetails = await Category.find()
        const newArrivals = await Product.find().sort({_id:-1}).limit(8);
        const womenFashion = await Product.find({category:"WOMEN"}).sort({_id:-1}).limit(8);
        const kidsWorld = await Product.find({category:"KIDS"}).sort({_id:-1}).limit(8);

        // if (req.session.isLoggedin) {
            const userId = req.session.user?._id;
           
        const cartcount = await cart.findOne({
            user: ObjectId(userId)
        })
  
        if (cartcount == '' || cartcount == null || cartcount == undefined) {

            count = 0;
        } else {
            count = cartcount.products.length;
        }
    // }
        res.render('userviews/user-home', { lk: true, newArrivals, womenFashion, kidsWorld, count, products: ProductDetails, categorys: categoryDetails, userdetails })



}



exports.userProfile = async (req, res) => {


    if (req.session.isLoggedin) {

        res.render('userviews/userprofile', { lk: false, userdetails: req.session.user })
    }


}


exports.saveUserProfile = async (req, res) => {



    if (req.session.isLoggedin) {


        const userdetails = await user.updateOne({
            _id: req.body.profid

        }, {
            $set: {

                firstname: req.body.fname,
                lastname: req.body.lname,
                mobile: req.body.mobile,
                email: req.body.email,
            }

        }


        );


        res.json({ status: true, userdetails })
        // }
    }



}




exports.editUserProfile = async (req, res) => {


    if (req.session.isLoggedin) {

        res.render('userviews/edit-profile', { lk: false, userdetails: req.session.user })
    }

}



exports.getUserAddress = async (req, res) => {

    if (req.session.isLoggedin) {
        const userId = req.session.user._id;
        const addresses = await Address.find({
            userId: ObjectId(userId)
        })

        res.render('userviews/user-address', { lk: false, userdetails: req.session.user, addres: addresses })
    }



}

exports.saveUserAddress = async (req, res) => {

    if (req.session.isLoggedin) {
        const userId = req.session.user._id;

        const doc = await Address.updateOne({
            _id: req.body.userid

        }, {
            $set: {

                firstname: req.body.firstname,
                lastname: req.body.lastname,
                mobile: req.body.mobile,
                city: req.body.city,
                pincode: req.body.pincode,
                state: req.body.state,
                shipping: req.body.Home === 'on' ? 'Home' : req.body.Office === 'on' ? 'Office' : 'null'

            }

        }


        );


        res.json({ status: true, doc })
        // }
    }



}




exports.editUserAddress = async (req, res) => {



    if (req.session.isLoggedin) {
        // const userId = req.session.user._id

        const address = await Address.findOne({ _id: req.params.id })

        res.render('userviews/edit-user-address', { lk: false, userdetails: req.session.user, addres: address })
    }


}



exports.deleteUserAddress = async (req, res) => {


    if (req.session.isLoggedin) {
        // const userId = req.session.user._id

        // const address = await Address.deleteOne({_id:req.session.id})
        const address = await Address.deleteOne({ _id: req.params.id })
        res.redirect('/user-address')
    }



}

exports.uploadPic = async (req, res) => {

    if (req.session.isLoggedin) {
        const image = req.files?.pic;
        const id = Date.now()
        const uploadpath = "/userasset/images/userpic/" + id + ".jpeg";
        const uploadfile = "./public/userassets/images/userpic/" + id + ".jpeg";
        image.mv(uploadfile)
        const addpicofuser = await user.updateOne({ _id: req.session.user._id }, { $set: { uploadpic: uploadpath } })
        const userdetails = await user.findOne({ _id: req.session.user._id })
        res.render('userviews/userprofile', { userdetails })
    }
}



exports.savePasswordAgain = async (req, res) => {


    if (req.session.isLoggedin) {
        const userpass = req.session.user.password;

        const isMatch = await bcrypt.compare(req.body.oldpass, userpass);
       
        const newpassw = await bcrypt.hash(req.body.newpass, 10);


        if (isMatch) {

            const userdetails = await user.updateOne({
                _id: req.body.passid

            }, {
                $set: {

                    password: newpassw,

                }

            }

            );

            res.json({ status: true })
        }

    }

}



exports.editPasswordAgain = async (req, res) => {


    if (req.session.isLoggedin) {

        res.render('userviews/change-password', { lk: false, userdetails: req.session.user })
    }


}


exports.categorySearchViewAtHome = async (req, res) => {

 const userdetails = req.session?.user;

        const categoryDetails = await Category.find()

        const searchDetails = await Product.find({
            name: new RegExp(req.query.searchdata, "i")
        })

        res.render('userviews/category-view', { lk: true, products: searchDetails, categorys: categoryDetails, userdetails })
    

}



exports.showtheCategoryView = async (req, res) => {

    const userdetails = req.session?.user;
    const ProductDetails = await Product.find()
    const categoryDetails = await Category.find()

    res.render('userviews/category-view', { lk: true, products: ProductDetails, categorys: categoryDetails,userdetails })


}

exports.allTheCategoryView = async (req, res) => {

    const userdetails = req.session?.user;
    const ProductDetails = await Product.find({
        category: req.body.category
    })
    const categoryDetails1 = await Category.findOne({
        category: req.body.category
    })
    const categoryDetails = await Category.find()


    const userId = req.session.user?._id;
    if(req.session.isLoggedin){
        var cartcount = await cart.find({ user: ObjectId(userId) })
        var count = 0;
        if (cartcount == '' || cartcount == null || cartcount == undefined) {
    
            count = 0;
        } else {
            count = cartcount[0].products?.length;
        }
    
    }
 

    res.render('userviews/category-view', { lk: true, count, products: ProductDetails, categorys: categoryDetails, userdetails })

}





exports.walletHistory = async(req,res)=>{
 
    if(req.session.isLoggedin){
        const userId = req.session.user._id;
        const findwallethistory = await wallethistory.find({user:ObjectId(userId)}).sort({_id:-1})
        res.render('userviews/walletHistory',{findwallethistory ,userdetails:req.session.user})
    }
}


exports.aboutUs = async(req,res)=>{
    const userdetails = req.session?.user
    const ProductDetails = await Product.find({
        category: req.body.category
    })
    const categoryDetails1 = await Category.findOne({
        category: req.body.category
    })
    const categoryDetails = await Category.find()
    if(req.session.isLoggedin){
        const userId = req.session.user?._id;
        var cartcount = await cart.find({ user: ObjectId(userId) })
        var count = 0;
        if (cartcount == '' || cartcount == null || cartcount == undefined) {
    
            count = 0;
        } else {
            count = cartcount[0].products?.length;
        }
    
    }
    res.render('userviews/aboutUs',{lk:true, userdetails, count, products: ProductDetails, categorys: categoryDetails})
}
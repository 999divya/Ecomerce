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

                        const refereduser = await user.findOne({refer:req.body.refered})
  
                        let refer = createReferal.alphaNumeric("uppercase", 2, 3);
                        // req.body.refer = refer;
                   
                        let wallet = 0;
                        if(req.body.refered!==''&& refereduser!==undefined){
                        //    const addRefreal = await user.upda({_id:refereduser._id},
                        //    {$set:{wallet:{$inc:100}}})

                           
                           await user.updateOne({_id:ObjectId(refereduser._id)},{ $inc:{wallet:100}})

                        }
                          

                            if(refereduser){
                        const result = await user.create({
                            "firstname": fname,
                            "lastname": lname,
                            "email": email,
                            "mobile": mobile,
                            "password": pass,
                            "isActive": true,
                            "wallet":req.body.refered!==''? 50 : 0,
                            "refer":refer,
                            "referedBy": refereduser ? ObjectId(refereduser._id) : ''
                            // "isAdmin":true
                        })
                       
                        } else{
                            const result = await user.create({
                                "firstname": fname,
                                "lastname": lname,
                                "email": email,
                                "mobile": mobile,
                                "password": pass,
                                "isActive": true,
                                "wallet":req.body.refered!==''? 50 : 0,
                                "refer":refer
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
       
        res.render('userviews/user-home', { lk:true, userdetails:req.session.user})
    }
     else {
        try {

            const foundUser = await user.findOne({
                email: req.body.email
            });


            if (!foundUser || foundUser.isActive === false) {
                res.render('login', {message: 'User not found or user is blocked' });
            } else {

                const isMatch = await bcrypt.compare(req.body.pass, foundUser.password);

                if (isMatch) {
                    
                    // req.session.user = foundUser._id;
                    // req.session.isloggedin = true;
                    
                        if (foundUser.isAdmin) {
                            req.session.admin = foundUser
                            req.session.adminLoggedin = true;


                            if(req.session.adminLoggedin){
                                let totalorders = await order.find().count()
                                let totalusers = await user.find().count()
                                let totalproducts = await Product.find().count()
                                let totalincomes = await order.aggregate([
                                  {$match:{
                                    status:"Deliverd"
                                  }
                                },
                                  {
                                    $group:{
                                    _id:null,
                                    total:{$sum:"$totalAmount"}
                                  }
                                }
                                ])
                        
                              
                       
                                const totalincome = totalincomes[0]?.total;
                                res.render('adminviews/dashboard',{admin:true, totalorders,totalincome, totalusers, totalproducts})

                            // res.render('adminviews/dashboard', { admin: true })
                        }
                        } else {

                            const productDetails = await Product.find()
                            const categoryDetails = await Category.find()
                            let today = new Date()
                            const offerdetails = await offer.find({})
                            let todate = moment(offerdetails.toDate).format('YYYY-MM-DD')
                            let fromdate = moment(offerdetails.fromDate).format('YYYY-MM-DD')
                            var to = new Date(todate);
                            var from = new Date(fromdate); // gives 1486492200000
                           
                            const setOfferExpiry = await offer.updateMany({toDate:{$lt:today}},{$set:{status:"Expired", percentage:0}})
                            const setOfferExpiryCat = await catOffer.updateMany({toDate:{$lt:today}},{$set:{status:"Expired", percentage:0}})
                            const status = await offer.find({status:"Expired"})
                            
                            const Allproducts = await Product.updateMany({proId:ObjectId(status.proId)},{$set:{percentage:0, realAmount:status.productprice}})
                          
                            
                          

                            req.session.user = foundUser
     
                            req.session.isLoggedin = true;
                         
                            // req.session.oldUrl=req.url;
                            // console.log(req.url);

                       


                            
                            if (req.session.isLoggedin) {


                                const userId = req.session.user._id;
                                if(req.session.user._id){
                                    
                                    var cartcount = await cart.find({ user: ObjectId(userId) })
                                 var count=0;
                                    if (cartcount==''||cartcount==null||cartcount==undefined) {

                                       count=0;  
                                    }else{
                                       count = cartcount[0].products?.length;
                                    }
                                 
                                }
                            
                            
                                if(req.session.oldUrl){
                                    var oldUrl =  req.session.oldUrl
                                    req.session.oldUrl=null;
                                    res.redirect(oldUrl);














                                    // const expiredCategory = await catOffer.find({ status: "Expired" })
                                    // // console.log("expiredCategory" + expiredCategory);
                            
                                    // expiredCategory.map(async (category) => {
                                    //     const Allcatagory = await Category.updateOne({ _id: ObjectId(category.catId) }, { $set: { percentage: 0 } })
                                    //     // console.log("expiredCatproducts" + category.categoryname);
                            
                                    //     const providetheproducts = await Product.find({ category: category.categoryname })
                            
                            
                                    //     providetheproducts.map(async (product) => {
                                            
                                    //         const productoffers = await offer.find({proId: product._id})
                                    //      console.log('productoffers', productoffers);
                                    //         if(!productoffers){
                                    //             console.log('productofferscheck');
                                    //             const Allcatagoryproducts = await Product.updateOne({ _id: product._id }, { $set: { percentage: 0, discount: 0, realAmount: product.price } })
                                    //         }
                                    //     })
                            
                                    // })
                            
                                    // //    console.log("findexpiredProducts",findexpiredProducts);
                            
                            
                                    // // findexpiredProducts.map(async(products)=>{
                                    // //     const Allcatagoryproducts = await Product.updateOne({category:products.categoryname},{$set:{percentage:0,discount:0, realAmount:products.productprice}})
                            
                                    // //     })
                            
                            
                            
                                    // const expiredProducts = await  offer.find({ status: "Expired" })
                            
                                    // expiredProducts.map(async (products) => {
                                    //     const categoryactive = await catOffer.findOne({ status: "Active", categoryname: products.category })
                                    //     if(categoryactive){
                                    //        console.log('activecategory')
                            
                                    //        const pervalue = categoryactive.percentage/100;
                                    //        const disamount =  products.productprice*pervalue;
                                    //        const discount = products.productprice-discount;
                                    //        realAmount=discount?discount:products.productprice;
                                    //         await Product.updateOne({ _id: ObjectId(products.proId) }, { $set: { percentage: categoryactive.percentage, discount: discount, realAmount: realAmount } })
                                    //     } else {
                            
                                    //     const Allproducts = await Product.updateOne({ _id: ObjectId(products.proId) }, { $set: { percentage: 0, discount: 0, realAmount: products.productprice } })
                                    //     }
                                      
                            
                            
                            
                                    // })
                            


















                                
                                }else{
                                    res.render('userviews/user-home', { lk:true,products: productDetails,count, categorys: categoryDetails, userdetails:req.session.user})
                                }
                            

                                
                        }
                    }
                } else {
                    res.render('login', {message: 'username or password is incorrect' });
                }
            }
        } catch (err) {
            console.log(err.message); 
        }
    }
}




exports.showAllUsers = async (req, res) => {
    if(req.session.adminLoggedin){
  
    try {
        const allUsers = await user.find({});
       
        res.render('adminviews/view-users', { admin: true, Allusers: allUsers })
    } catch (err) {
        console.log(err.message);
    }

    }
}

//admin search user..................
exports.userSearch = async (req, res) => {
    if( req.session.adminLoggedin){
    try {
        const searchResult = await user.find({
            firstname: new RegExp(req.query.searchdata, "i"),
        })


        res.render('adminviews/view-users', { admin: true, Allusers: searchResult, k: true })

    } catch (err) {
        console.log(err.message);
    }
}

}




exports.userBlockHandler = async (req, res) => {
    if( req.session.adminLoggedin){

    const userdetailsbyID = await user.findOne({
        _id: req.params.id
    }).exec()


    const blockeachuser = await user.findOneAndUpdate({
        
        _id: req.params.id
    }, { isActive: !userdetailsbyID.isActive });

    const allUsers = await user.find({});
    res.redirect('/admin/view-users');

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

       req.session.isLoggedin=false;
       req.session.adminLoggedin=false;
       req.session.destroy();
       res.render('login',{message:'User logout successfully'})
    }
   
}



exports.showWallet = async(req,res)=>{

    if (req.session.isLoggedin) {
        let referaluser = await user.findOne({ _id: req.session.user?._id })
        console.log(referaluser);
        let refer = referaluser.refer;
        let wallet = referaluser.wallet;
        console.log(refer);
        let referalLink = "http://localhost:5500/register?refer=" + refer;
        res.render('userviews/wallet', { lk: false, refer, wallet, referalLink, userdetails: req.session.user })
    }


}


exports.walletAmount = async(req,res)=>{



    let userid = req.session.user._id;
    let totalamount = req.session.totalvalue;
    var data = req.body;

    // console.log('from totalamount', totalamount);

    let obj = {}

    let userData = await user.findOne({ _id: ObjectId(userid) })

    if (userData) {

        if (userData.wallet < data.amount) {
            obj.msg = "lesser amount"
            obj.status = false

        } else {
            let currentWlletAmount = userData.wallet - data.amount;
            console.log('userData.wallet', userData.wallet)
            console.log('amount from client', data.amount)
            console.log('from totalamount', totalamount)

            obj.totalamount = totalamount - data.amount;
            req.session.totalvalue = totalamount - data.amount;
            console.log('redused total amounrt', req.session.totalvalue)
            await user.updateOne({
                _id: ObjectId(userid)
            }, { $set: { wallet: currentWlletAmount } })

            obj.status = true
            obj.msg = "Wallet amount successfully applied"
        }
    } else {
        obj.status = false
        obj.msg = "no user found"
    }

    res.json({ status: obj.status, total: obj.totalamount, msg: obj.msg });



}



exports.backToHome = async(req,res)=>{

    if (req.session.isLoggedin) {

        const userId = req.session.user?._id;
        const ProductDetails = await Product.find()
        const categoryDetails = await Category.find()


        const cartcount = await cart.findOne({
            user: ObjectId(userId)
        })

        if (cartcount == '' || cartcount == null || cartcount == undefined) {

            count = 0;
        } else {
            count = cartcount.products.length;
        }

        res.render('userviews/user-home', { lk: true, count, products: ProductDetails, categorys: categoryDetails, userdetails: req.session.user })
    }


}



exports.userProfile = async(req,res)=>{


    if (req.session.isLoggedin) {

        res.render('userviews/userprofile', { lk: false, userdetails: req.session.user })
    }


}


exports.saveUserProfile = async(req,res)=>{



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




exports.editUserProfile = async(req,res)=>{


    if (req.session.isLoggedin) {

        res.render('userviews/edit-profile', { lk: false, userdetails: req.session.user })
    }

}



exports.getUserAddress = async(req,res)=>{

    if (req.session.isLoggedin) {
        const userId = req.session.user._id;
        const addresses = await Address.find({
            userId: ObjectId(userId)
        })

        res.render('userviews/user-address', { lk: false, userdetails: req.session.user, addres: addresses })
    }



}

exports.saveUserAddress = async(req,res)=>{

    if (req.session.isLoggedin) {
        const userId = req.session.user._id;
        // if(req.body.id=''){


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
                shipping: req.body.shipping === 'on' ? 'home' : 'office'

            }

        }


        );


        res.json({ status: true, doc })
        // }
    }



}




exports.editUserAddress = async(req,res)=>{



    if (req.session.isLoggedin) {
        // const userId = req.session.user._id





        const address = await Address.findOne({ _id: req.params.id })

        res.render('userviews/edit-user-address', { lk: false, userdetails: req.session.user, addres: address })
    }


}



exports.deleteUserAddress = async(req,res)=>{


    if (req.session.isLoggedin) {
        // const userId = req.session.user._id

        // const address = await Address.deleteOne({_id:req.session.id})



        const address = await Address.deleteOne({ _id: req.params.id })
        res.redirect('/user-address')
    }



}

exports.uploadPic = async(req,res)=>{

    if(req.session.isLoggedin){
        const image = req.files?.pic;
        const id = Date.now()
        const uploadpath = "/userasset/images/userpic/"+id+".jpeg";
        const uploadfile = "./public/userassets/images/userpic/"+id+".jpeg";
        image.mv(uploadfile)
        const addpicofuser = await user.updateOne({_id:req.session.user._id},{$set:{uploadpic:uploadpath}})
        const userdetails = await user.findOne({_id:req.session.user._id})
        res.render('userviews/userprofile',{userdetails})
    }
}



exports.savePasswordAgain = async(req, res)=>{


    if (req.session.isLoggedin) {
        const userpass = req.session.user.password;




        // const oldpassw = await bcrypt.hash(req.body.oldpass, 10);
        // console.log("oooooooooooooooo"+oldpassw );
        const isMatch = await bcrypt.compare(req.body.oldpass, userpass);
        console.log("ismatch",isMatch);
        const newpassw = await bcrypt.hash(req.body.newpass, 10);
        console.log("newpassw",newpassw);

        if (isMatch) {

            const userdetails = await user.updateOne({
                _id: req.body.passid

            }, {
                $set: {

                    password: newpassw,

                }

            }

            );
            console.log('userdetails')
            res.json({ status: true})
        }





    }



}



exports.editPasswordAgain = async(req,res)=>{


    if (req.session.isLoggedin) {

        res.render('userviews/change-password', { lk: false, userdetails: req.session.user })
    }


}


exports.categorySearchViewAtHome = async(req,res)=>{

    if (req.session.isLoggedin) {

        const categoryDetails = await Category.find()

        const searchDetails = await Product.find({
            name: new RegExp(req.query.searchdata, "i")
        })

        res.render('userviews/category-view', { lk: true, products: searchDetails, categorys: categoryDetails, userdetails: req.session.user })
    }

}



exports.showtheCategoryView = async(req,res)=>{


    const ProductDetails = await Product.find()
    const categoryDetails = await Category.find()

    res.render('userviews/category-view', { lk: true, products: ProductDetails, categorys: categoryDetails })


}

exports.allTheCategoryView = async(req,res)=>{


    const ProductDetails = await Product.find({
        category: req.body.category
    })
    const categoryDetails1 = await Category.findOne({
        category: req.body.category
    })
    const categoryDetails = await Category.find()


    const userId = req.session.user?._id;
    var cartcount = await cart.find({ user: ObjectId(userId) })
    var count = 0;
    if (cartcount == '' || cartcount == null || cartcount == undefined) {

        count = 0;
    } else {
        count = cartcount[0].products?.length;
    }


    res.render('userviews/category-view', { lk: true, count, products: ProductDetails, categorys: categoryDetails, userdetails: req.session.user })

}
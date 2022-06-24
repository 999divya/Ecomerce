const express = require('express');
const route = express.Router();
const userController = require('../../controllers/userController');
const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema');
// const { Router } = require('express');
const otpController = require('../../controllers/otpController')
const cartController = require('../../controllers/cartController')
// const user = require('../../models/userSchema')
var ObjectId = require('mongoose').Types.ObjectId;
const Coupon = require('../../models/couponSchema')
// const order = require('../../models/orderSchema')
// const offer = require('../../models/offerSchema')
// const catOffer = require('../../models/catOfferSchema')
const cart = require('../../models/cartSchema');
// const Address = require('../../models/addresSchema')
const orderController = require('../../controllers/orderController')
const swal = require('sweetalert2');
// const bcrypt = require('bcrypt');
// const moment = require('moment')
// const Razorpay = require('razorpay');

// var paypal = require('paypal-rest-sdk')

// var instance = new Razorpay({
//     key_id: 'rzp_test_gpdw4Vd4R7dTYf',
//     key_secret: 'npUb30BVu4ACBJS1cPtRcsw7'
// })


// paypal.configure({
//     'mode': 'sandbox', //sandbox or live
//     'client_id': 'Aae-Pk_s8KONIPW-WdbGN-u_MyUtGCnmc_70SIhGectvo3DZcYAvlFtk3NTkMVB8bAauS74nD3Ij68jQ',
//     'client_secret': 'EPtaR696s87nWMKibGT4vHocyy_Vi0TGT79EpW3bi_aJ3Y4r4gsvhcSghCBV65uYLNAGenBUy4lS9y1I'
// });


// const crypto = require('crypto');

// const isLoggedin = (req, res, next) => {

//     req.session.isLoggedin = true;
//     if (req.session.isLoggedin) {
//         next()

//     } else {
//         res.redirect('/login');
//     }
// }



route.get('/otp-mobile', (req, res) => {
    res.render('otp-mobile');
})
route.post('/mobile', otpController.otpHandler);
route.post('/otp', otpController.otpChecker);


// route.get('/getCartCount/:id',(cartController.cartCount))


route.get('/', async (req, res) => {
 
    const ProductDetails = await Product.find()
    const categoryDetails = await Category.find()
    const newArrivals = await Product.find().sort({_id:-1}).limit(8);
    const womenFashion = await Product.find({category:"WOMEN"}).sort({_id:-1}).limit(8);
    const kidsWorld = await Product.find({category:"KIDS"}).sort({_id:-1}).limit(8);



    res.render('userviews/user-home', { newArrivals,womenFashion,kidsWorld, lk: true, products: ProductDetails, categorys: categoryDetails })

});




route.get('/home-page', async(req,res)=>{
    const productDetails = await Product.find()
    const newArrivals = await Product.find().sort({_id:-1}).limit(8);
    const womenFashion = await Product.find({category:"WOMEN"}).sort({_id:-1}).limit(8);
    const kidsWorld = await Product.find({category:"KIDS"}).sort({_id:-1}).limit(8);
    const categoryDetails = await Category.find()
    if (req.session.isLoggedin) {
        const userId = req.session.user._id;
        if (req.session.user._id) {

            var cartcount = await cart.find({ user: ObjectId(userId) })
            var count = 0;
            if (cartcount == '' || cartcount == null || cartcount == undefined) {

                count = 0;
            } else {
                count = cartcount[0].products?.length;
            }

        }

        res.render('userviews/user-home', { lk: true,newArrivals,kidsWorld, products: productDetails,womenFashion, count, categorys: categoryDetails, userdetails: req.session.user })
        // res.render('userviews/user-home', { lk: true, userdetails: req.session.user })



    }
})


route.get('/show-coupondata',async (req,res)=>{
  if(req.session.isLoggedin){
    let userid = req.session.user._id;

    let allusedCoupons=await Coupon.find({users:{$elemMatch:{users:ObjectId(userid)}}})
    let notusedCoupons=await Coupon.find({users:{$not:{$elemMatch:{users:ObjectId(userid)}}}})
   
    
    res.render('userviews/couponData',{lk:false,allusedCoupons,notusedCoupons,userdetails:req.session.user})
  }

})



const productController = require('../../controllers/productController')

route.get('/product-details/:id', productController.productDetailsAtUser)


route.get('/add-to-cart/:id', cartController.addToCart)
route.get('/cart', cartController.showCartItems)

route.post('/deleteCartItem', cartController.deleteItem)

route.post('/change-product-quantity', cartController.changeQuantity)


route.get('/checkout', orderController.checkoutDisplay)

// route.get('/', userController.showAllProducts);





route.post('/category-view', userController.allTheCategoryView);


const niceInvoice = require("nice-invoice");
route.get('/download-invoice/:id',(req,res)=>{

    const invoiceDetail = {
        shipping: {
          name: "Micheal",
          address: "1234 Main Street",
          city: "Dubai",
          state: "Dubai",
          country: "UAE",
          postal_code: 94111
        },
        items: [
          {
            item: "Chair",
            description: "Wooden chair",
            quantity: 1,
            price: 50.00, 
            tax: "10%"
          },
          {
            item: "Watch",
            description: "Wall watch for office",
            quantity: 2,
            price: 30.00,
            tax: "10%"
          },
          {
            item: "Water Glass Set",
            description: "Water glass set for office",
            quantity: 1,
            price: 35.00,
            tax: ""
          }
        ],
        subtotal: 156,
        total: 156,
        order_number: 1234222,
        header:{
            company_name: "Nice Invoice",
            company_logo: "logo.png",
            company_address: "Nice Invoice. 123 William Street 1th Floor New York, NY 123456"
        },
        footer:{
          text: "Any footer text - you can add any text here"
        },
        currency_symbol:"$", 
        date: {
          billing_date: "08 August 2020",
          due_date: "10 September 2020",
        }
    };
    niceInvoice(invoiceDetail, 'your-invoice-name.pdf');
})



route.get('/category-view', userController.showtheCategoryView)




route.get('/category-searchview', userController.categorySearchViewAtHome)






route.get('/myorders', orderController.showMyOrdersAtUserSide)







route.get('/user-address', userController.getUserAddress)


route.get('/delete-address/:id', userController.deleteUserAddress)





route.get('/edit-address/:id',userController.editUserAddress)


route.post('/save-user-address', userController.saveUserAddress)










route.get('/edit-profile/:id', userController.editUserProfile)



route.post('/save-profile',userController.saveUserProfile)



route.get('/userprofile', userController.userProfile)










route.get('/edit-password/:id', userController.editPasswordAgain)


route.post('/upload-pic', userController.uploadPic)

route.post('/save-password', userController.savePasswordAgain)








route.post('/select-orderaddress',orderController.selectOrderAddress)


// route.post('/saveOrder-address', orderController.saveNewAddress)
//save-address
route.get('/order-address',orderController.orderAddress)

route.post('/place-order', orderController.placeOrder)


route.post('/verify-payment', orderController.paymentVerification)

route.get('/back-to-home', userController.backToHome)






// route.get('/order-success',(req,res)=>{
//     if(req.session.isLoggedin){
//     res.render('userviews/place-order',{lk:false, userdetails:req.session.user})
//     }
// })

route.get('/show-my-orders', orderController.showMyOrders)

route.get('/logout', userController.logoutHandler)



// route.get('/view-userorders', orderController.handleUserOrders)
route.get('/cancelEachUserOrder/:id', orderController.cancelUserOrders)
// route.post('/change-userdelivery-status',orderController.userDeliveryStatus)
route.post('/change-userdelivery-status', orderController.userDeliveryStatus)

route.get('/order-successful', orderController.orderSuccessful)

route.get('/wallet',userController.showWallet)

route.get('/wallethistory', userController.walletHistory)

route.post('/WalletAmount', userController.walletAmount)




const couponController = require('../../controllers/couponController')

route.post('/apply-coupon', couponController.applyCoupon)



route.get('/order-failed', orderController.orderFailed)



route.get('/show-products/:id', orderController.showUserSideOrderedProducts)

route.get('/coupon-history', couponController.couponHistory)




route.get('/invoice/:id', orderController.invoicehandler)




route.get('/aboutUs', userController.aboutUs)
module.exports = route;
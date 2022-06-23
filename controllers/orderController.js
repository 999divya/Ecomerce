const cart = require('../models/cartSchema');
var ObjectId = require('mongoose').Types.ObjectId;
const Product = require('../models/productSchema');
const Category = require('../models/categorySchema');
const user = require('../models/userSchema');
const Address = require('../models/addresSchema');
const order = require('../models/orderSchema')
const moment = require('moment')
const Razorpay = require('razorpay');
var paypal = require('paypal-rest-sdk');
const { route } = require('../routes/adminRoutes/adminroute');
const swal = require('sweetalert2');
const wallethistory = require('../models/walletHistoryShema')
const Coupon = require('../models/couponSchema')
const CouponData = require('../models/couponHistorySchema')

var instance = new Razorpay({
    key_id:process.env.KEY_ID ,
    key_secret: process.env.KEY_SECRET
})



paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': process.env.CLIENT_ID,
    'client_secret':process.env.CLIENT_SECRET 
});



exports.checkoutDisplay = async (req, res) => {

    if (req.session.isLoggedin) {

        const userId = req.session.user._id;

        const userDetail = await user.findOne({
            user: ObjectId(userId)
        })


        const addresses = await Address.find({
            userId: ObjectId(userId)
        })


        let totalamount = await cart.aggregate([
            { $match: { user: ObjectId(userId) } },
            { $unwind: "$products" },
            { $project: { item: "$products.item", quantity: "$products.quantity" } },
            { $lookup: { from: "products", localField: "item", foreignField: '_id', as: 'product' } },
            { $project: { item: 1, quantity: 1, product: { $arrayElemAt: ["$product", 0] } } },
            { $group: { _id: null, total: { $sum: { $multiply: ['$quantity', { $toInt: '$product.price' }] } } } }
        ])
        let actualMRP = totalamount[0]?.total;
      

        let totalamount1 = await cart.aggregate([
            { $match: { user: ObjectId(userId) } },
            { $unwind: "$products" },
            { $project: { item: "$products.item", quantity: "$products.quantity" } },
            { $lookup: { from: "products", localField: "item", foreignField: '_id', as: 'product' } },
            { $project: { item: 1, quantity: 1, product: { $arrayElemAt: ["$product", 0] } } },
            { $group: { _id: null, total: { $sum: { $multiply: ['$quantity', { $toInt: '$product.realAmount' }] } } } }


        ])
        let totalvalue1 = totalamount1[0]?.total;
  
        let totaldiscount = totalvalue1 - actualMRP;
     

        let walletdiscount = req.session.usedwalletamount;

        res.render('userviews/checkout', { totalvalue1, walletdiscount, lk: false, userdetails: req.session.user, addres: addresses, totaldiscount, actualMRP, coupondiscount: req.session.coupondiscount, totalvalue: req.session.totalvalue });
    } else {
        res.redirect('/login')
    }
}








// exports.saveNewAddress= async (req,res)=>{

//     if(req.body.mobile.length===10){
// if(req.session.isLoggedin){

//     const userId=req.session.user._id;
//         const address= await new Address({
//             userId: ObjectId(userId),
//             firstname:req.body.firstname,
//             lastname:req.body.lastname,
//             mobile:req.body.mobile,
//             city:req.body.city,
//             pincode:req.body.pincode,
//             state:req.body.state,
//             shipping:req.body.shipping==='on'?'home' : 'office'
//         })
//        await address.save()
//         res.render('userviews/order-address',{userdetails:req.session.user, lk:false});

// }
//     }
// }













exports.placeOrder = async (req, res) => {

    if (req.session.isLoggedin) {
       
        const userId = req.session.user._id;
        const cartItems = await cart.findOne({
            userId: ObjectId(userId)

        })
        req.session.cartItems=cartItems;
        let deliveryObj = {
            userfname: req.session.user.firstname,
            userlname: req.session.user.lastname,
            usermob: req.session.user.mobile,
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            mobile: req.body.mobile,
            city: req.body.city,
            pincode: req.body.pincode,
            state: req.body.state,
            shipping: req.body.Office === 'on' ? 'Office' : req.body.Home === 'on' ? 'Home' : 'Home'
        }



        req.session.address = deliveryObj;

        let status = req.body.paymentMethod === 'COD' ? 'Placed' : 'pending';

        let dateIso = new Date()
        let date1 = moment(dateIso).format('YYYY/MM/DD')
        let time1 = moment(dateIso).format('HH:mm:ss')

        const orderObject = {
            user: ObjectId(userId),
            deliveryDetails: deliveryObj,
            paymentMethod: req.body.paymentMethod,
            dateIso: dateIso,
            date: date1,
            time: time1,
            totalAmount: req.body.total,
            status: status,
            products: cartItems?.products
        }



        req.session.order = orderObject;



        req.session.payment = orderObject.paymentMethod;
        req.session.totalvalue = orderObject.totalAmount;


        let orderItems = await new order(orderObject)
req.session.orderItems = orderItems;
        let address = await new Address({
            user: ObjectId(userId),
            firstname: deliveryObj.firstname,
            lastname: deliveryObj.lastname,
            mobile: deliveryObj.mobile,
            city: deliveryObj.city,
            pincode: deliveryObj.pincode,
            state: deliveryObj.state,
            shipping: deliveryObj.shipping === 'Home' ? 'Home' : 'Office'
        })

        await orderItems.save();


        const orderItemsID=await order.findOne({_id:orderItems._id})

        req.session.orderid = orderItemsID._id;
   
        await address.save();
        var date = Date.now()
        var orderdate = moment(date).format('YYYY-MM-DD');
        const orderId = orderItems._id;
        let total = parseInt(req.session.totalvalue)



        if (orderItems.paymentMethod == 'COD') {


        //TO DECREASE THE PRODUCT QUANTITY BEFORE PLACING THE ORDER FROM THE PRODUCT COLLECTION.
       // if( req.body.paymentMethod =='COD'){
 
            const decIds = await Product.updateOne({ "_id": ObjectId(  req.session.orderItems.products[0]?.item) },
            {
                $inc: { "quantity": -req.session.cartItems?.products[0]?.quantity }
            })

            
        //TO TRANSFER THE CART ITEMS PRODUCT ARRAY TO ORDER SUCCESS PAGE

        const productIds = await cart.aggregate([
            {
                $match: { user: ObjectId(userId) }
            },
            {
                $unwind: "$products"
            },
            {
                $project: {
                    _id: 0,
                    item: "$products.item"
                }
            }
        ])


        const productIdsArray = [];

        for (i of productIds) {
            productIdsArray.push(i.item);
        }
        req.session.products = productIdsArray;


        await cart.deleteOne({ user: ObjectId(userId) })

        //}


            const walletDetails = await wallethistory.create(
                {
                    user: ObjectId(userId),
                    order: ObjectId(orderId),
                    paymentMethod: 'COD',
                    Orderdate: orderdate,
                    WalletAmount: req.session.wallet,
                    appliedWalletAmount: req.session.usedwalletamount,
                    currentWalletAmount: req.session.currentWlletAmount,
                    creditedAmount: 0,
                    status: "Wallet amount deducted"
                }
            )


            const couponhistory = await CouponData.create({
                user: ObjectId(userId),
                order: ObjectId(orderId),
                paymentMethod: 'COD',
                Orderdate: orderdate,
                couponcode: req.session.couponcode,
                totalAmount:  req.session.incomingtotal,
                percentage:  req.session.couponpercent?req.session.couponpercent:0 ,
                discount: req.session.coupondiscount?req.session.coupondiscount:0,
                discountedAmt: req.session.coupontotalvalue?req.session.coupontotalvalue:0,
                status: "Coupon amount deducted"
            })

            res.json({ status: true, paymentMethod: 'COD' })

        } else if (orderItems.paymentMethod == 'Razorpay') {


            var options = {
                amount: total * 100,
                currency: "INR",
                receipt: "" + orderId
            }
            instance.orders.create(options, function (err, order) {
                if (err) {
                    console.log(err);
                } else {
                    const walletDetails = wallethistory.create(
                        {
                            user: ObjectId(userId),
                            order: ObjectId(orderId),
                            paymentMethod: 'Razorpay',
                            Orderdate: orderdate,
                            WalletAmount: req.session.wallet,
                            appliedWalletAmount: req.session.usedwalletamount,
                            currentWalletAmount: req.session.currentWlletAmount,
                            creditedAmount: 0,
                            status: "Wallet amount deducted"
                        }
                    )


                    const couponhistory =  CouponData.create({
                        user: ObjectId(userId),
                        order: ObjectId(orderId),
                        paymentMethod: 'Razorpay',
                        Orderdate: orderdate,
                        couponcode: req.session.couponcode,
                        totalAmount:  req.session.incomingtotal,
                        percentage:  req.session.couponpercent?req.session.couponpercent:0 ,
                        discount: req.session.coupondiscount?req.session.coupondiscount:0,
                        discountedAmt: req.session.coupontotalvalue?req.session.coupontotalvalue:0,
                        status: "Coupon amount deducted"
                    })
                    res.json(order);
                }
            })
        }
        else {
            val = total / 74;
            totalPrice = val.toFixed(2);
            let totals = totalPrice.toString();
            const create_payment_json = {
                intent: "sale",
                payer: {
                    payment_method: "paypal",
                },
                redirect_urls: {
                    return_url: "http://localhost:5500/order-successful",
                    cancel_url: "http://localhost:5500/order-failed",
                },
                transactions: [
                    {
                        item_list: {
                            items: [
                                {
                                    name: "Kstyles",
                                    sku: "item",
                                    price: totals,
                                    currency: "USD",
                                    quantity: 1,
                                },
                            ],
                        },
                        amount: {
                            currency: "USD",
                            total: totals,
                        },
                        description: "This is the payment description.",
                    },
                ],
            };
            paypal.payment.create(create_payment_json, async function (error, payment) {
                if (error) {
                    throw error;
                } else {
                  
                    for (let i = 0; i < payment.links.length; i++) {

                        if (payment.links[i].rel === "approval_url") {
                            let link = payment.links[i].href;
                            link = link.toString();

                            const walletDetails = await wallethistory.create(
                                {
                                    user: ObjectId(userId),
                                    order: ObjectId(orderId),
                                    paymentMethod: 'paypal',
                                    Orderdate: orderdate,
                                    WalletAmount: req.session.wallet,
                                    appliedWalletAmount: req.session.usedwalletamount,
                                    currentWalletAmount: req.session.currentWlletAmount,
                                    creditedAmount: 0,
                                    status: "Wallet amount deducted"
                                }
                            )


                    const couponhistory = await CouponData.create({
                        user: ObjectId(userId),
                        order: ObjectId(orderId),
                        paymentMethod: 'paypal',
                        Orderdate: orderdate,
                        couponcode: req.session.couponcode,
                        totalAmount:  req.session.incomingtotal,
                        percentage:  req.session.couponpercent?req.session.couponpercent:0 ,
                        discount: req.session.coupondiscount?req.session.coupondiscount:0,
                        discountedAmt: req.session.coupontotalvalue?req.session.coupontotalvalue:0,
                        status: "Coupon amount deducted"
                    })

                            res.json({ paypal: true, url: link })
                        }
                        
                    }
                }
            });
        }


    } else {
        res.redirect('/login')
    }

}







exports.paymentVerification = async (req, res) => {
    if (req.session.isLoggedin) {

        const crypto = require('crypto');
        let hmac = crypto.createHmac('sha256', process.env.KEY_SECRET);
        hmac.update(req.body.payment.razorpay_order_id + '|' + req.body.payment.razorpay_payment_id);
        hmac = hmac.digest('hex')

        if (hmac == req.body.payment.razorpay_signature) {








//TO DECREASE THE PRODUCT QUANTITY BEFORE PLACING THE ORDER FROM THE PRODUCT COLLECTION.
       // if( req.body.paymentMethod =='COD'){
      
            const decIds = await Product.updateOne({ "_id": ObjectId(req.session.orderItems?.products[0]?.item) },
            {
                $inc: { "quantity": -req.session.cartItems?.products[0]?.quantity }
            })

            
        //TO TRANSFER THE CART ITEMS PRODUCT ARRAY TO ORDER SUCCESS PAGE
const userId = req.session.user._id;
        const productIds = await cart.aggregate([
            {
                $match: { user: ObjectId(userId) }
            },
            {
                $unwind: "$products"
            },
            {
                $project: {
                    _id: 0,
                    item: "$products.item"
                }
            }
        ])


        const productIdsArray = [];

        for (i of productIds) {
            productIdsArray.push(i.item);
        }
        req.session.products = productIdsArray;

     



        await cart.deleteOne({ user: ObjectId(userId) })

        //}








            res.json({ status: true })
        } else {
 
            res.json({ status: false, errMsg: 'Payment failed' })
        }
    } else {
        res.redirect('/login')
    }
}



//admin side displaying orders

exports.handleOrders = async (req, res) => {

    if (req.session.adminLoggedin) {






        const orderDetails = await order.aggregate([


            // {
            //     $unwind: "$products"
            // },

            {
                $lookup: {
                    from: "products",
                    localField: 'item',
                    foreignField: '_id',
                    as: 'products'
                }
            },



        ]).sort({ _id: -1 })


        res.render('adminviews/view-orders', { admin: true, Order: orderDetails })

    } else {
        res.redirect('/login')
    }
}


//admin side cancelling orders

exports.cancelOrders = async (req, res) => {
    if (req.session.adminLoggedin) {
        const orderId = req.params.id;

        const orders = await order.findOne({ _id: orderId })


        const deleteorders = await order.updateOne({ _id: orderId }, {
            $set: { status: 'cancelled' }
        })

        const creditPaymentToWallet = await user.updateOne({ _id: req.session.user._id }, {})

        res.redirect('/admin/view-orders')
    } else {
        res.redirect('/login')
    }
}



//adminside  status change to cancel

exports.deliveryStatus = async (req, res) => {
    if (req.session.adminLoggedin) {
        const orderId = req.body.orderId;


        const statusdata = await order.updateOne({ _id: ObjectId(orderId) },
            {
                $set: {
                    status: req.body.status
                }
            })

    } else {
        res.redirect('/login')
    }
}






// exports.orderPlacing = async (req,res)=>{
//     if(req.session.isLoggedin){
//         const userId = req.session.user._id;

//         let cartItems = await cart.find({userId:ObjectId(userId)})

//         res.render('userviews/order-address',{userdetails:req.session.user, lk:false})

//     }

// }


exports.showMyOrders = async (req, res) => {
    if (req.session.isLoggedin) {
        const userId = req.session.user._id;



        const myOrders = await order.aggregate([
            {
                $match: {
                    user: ObjectId(userId)
                }
            }

        ]).sort({ _id: -1 })


        let totalamount = await cart.aggregate([
            { $match: { user: ObjectId(userId) } },
            { $unwind: "$products" },
            { $project: { item: "$products.item", quantity: "$products.quantity" } },
            { $lookup: { from: "products", localField: "item", foreignField: '_id', as: 'product' } },
            { $project: { item: 1, quantity: 1, product: { $arrayElemAt: ["$product", 0] } } },
            { $group: { _id: null, total: { $sum: { $multiply: ['$quantity', { $toInt: '$product.price' }] } } } }


        ])
        let totalvalue = totalamount[0]?.total;

        const userid = req.session.user._id;
        const updateorders= await order.updateOne({_id:ObjectId(req.session.orderid), user:ObjectId(userid),status:'pending', $in:['Razorpay', 'paypal']},{$set:{status:'cancelled'}})
     
        res.render('userviews/myorders', { userdetails: req.session.user, orders: myOrders, totalvalue: req.session.totalvalue })

    } else {
        res.redirect('/login')
    }

}




exports.cancelUserOrders = async (req, res) => {

    if (req.session.isLoggedin) {

        const orderId = req.params.id;

        const orders = await order.findOne({ _id: orderId })

        const addwallet = await wallethistory.findOne({ order: req.params.id })
        const currentwalletamt = req.session.user.wallet;

        let updatedamount = parseInt(orders?.totalAmount) + parseInt(addwallet?.appliedWalletAmount ? addwallet.appliedWalletAmount : 0);
       const orderamount =orders.totalAmount;
  
        const newwalletamt = currentwalletamt + updatedamount;
      
        const findwallet = await wallethistory.updateOne({ order: req.params.id }, {
            $set: {
                user: ObjectId(req.session.user._id),
                order: ObjectId(req.params.id),
                WalletAmount: currentwalletamt,
                appliedWalletAmount:addwallet?.appliedWalletAmount ? addwallet.appliedWalletAmount:0,
                currentWalletAmount: newwalletamt,
                creditedAmount: orderamount,
                status: "Order Cancelled, amount credited",
            },
        }, { upsert: true })

    

        const pullUserFromCoupon = await Coupon.updateOne({couponcode:orders.couponcode},{
            $pull:{users:{users:ObjectId(req.session.user._id)}}
        })


        const userwalletUpdate = await user.updateOne({ _id: req.session.user._id }, { $set: { wallet: newwalletamt } })
        const deleteorders = await order.updateOne({ _id: orderId }, {
            $set: { status: 'cancelled' }
        })
        const couponhistory = await CouponData.updateOne({
            order: ObjectId(orderId)},{$set:{
            status: "Order cancelled, coupon is available to use"}
        })

        res.redirect('/show-my-orders')
    } else {
        res.redirect('/login')
    }

}



exports.userDeliveryStatus = async (req, res) => {
    if (req.session.adminLoggedin) {
        const orderId = req.body.orderId;

        const statusdata = await order.updateOne({ _id: ObjectId(orderId) },
            {
                $set: {
                    status: req.body.status
                }
            })

    } else {
        res.redirect('/login')
    }
}



exports.showMyOrdersAtUserSide = async (req, res) => {

    if (req.session.isLoggedin) {

        
         
        res.render('userviews/myorders', { lk: true, userdetails: req.session.user })
    }
}


exports.displayOrderedProducts = async (req, res) => {//  /show-products/:id
    if (req.session.adminLoggedin) {
        const myOrders = await order.aggregate([
            {
                $match: { _id: ObjectId(req.params.id) }
            },

            { $unwind: "$products" },


            {
                $lookup: {
                    from: 'products',
                    localField: 'products.item',
                    foreignField: '_id',
                    as: 'product'
                }
            }


        ])


        res.render('adminviews/find-orderedproducts.hbs', { admin: true, Orders: myOrders })
    } else {
        res.redirect('/login')
    }
}



exports.showUserSideOrderedProducts = async (req, res) => {


    if (req.session.isLoggedin) {

        const userId = req.session.user._id;

        const myOrders = await order.aggregate([
            {
                $match: { _id: ObjectId(req.params.id) }
            },

            { $unwind: "$products" },


            {
                $lookup: {
                    from: 'products',
                    localField: 'products.item',
                    foreignField: '_id',
                    as: 'product'
                }
            }

        ])



        res.render('userviews/ordered-products', { lk: false, userdetails: req.session.user, orders: myOrders })

    } else {
        res.redirect('/login')
    }



}



exports.invoicehandler = async (req, res) => { // /invoice


    if (req.session.isLoggedin) {

        // const myOrders = await order.aggregate([
        //     {
        //         $match: { _id: ObjectId(req.params.id) }
        //     }

        // { $unwind: "$products" },


        // {
        //     $lookup: {
        //         from: 'products',
        //         localField: 'products.item',
        //         foreignField: '_id',
        //         as: 'product'
        //     }
        // }


        // ])



        const myOrders = await order.findOne({ _id: req.params.id })
        const productdetails = await order.aggregate([
            {
                $match: { _id: ObjectId(req.params.id) }
            },

            { $unwind: "$products" },
            // { $project: { item: "$products.item", quantity: "$products.quantity" } },


            {
                $lookup: {
                    from: 'products',
                    localField: 'products.item',
                    foreignField: '_id',
                    as: 'product'
                }
            },



        ])


        res.render('userviews/template', { lk: false, userdetails: req.session.user, orders: myOrders, products: productdetails })

    } else {
        res.redirect('/login')
    }

}


exports.orderFailed = async (req, res) => {//  /order-failed 

    if (req.session.isLoggedin) {
        const userid = req.session.user._id;
        const updateorders= await order.updateOne({_id:ObjectId(req.session.orderid), user:ObjectId(userid),status:'pending', $in:['Razorpay', 'paypal']},{$set:{status:'cancelled'}})
        res.render('userviews/order-failed', { lk: false, userdetails: req.session.user,updateorders })
    } else {
        res.redirect('/login')
    }
}

exports.orderSuccessful = async (req, res) => {

    if (req.session.isLoggedin) {
        const userid = req.session.user._id;
        const updateorders = await order.updateOne({_id:ObjectId(req.session.orderid), user:ObjectId(userid), status: "pending"}, {$set: { status: "Placed"}})
        await user.updateOne({
            _id: ObjectId(userid)
        }, { $set: { wallet: req.session.currentWlletAmount } })
       

        let objUser = req.session.couponuser;
  
        if (objUser != undefined) {
            objUser.users = ObjectId(req.session.user._id);


            const pushUserToCoupon = await Coupon.updateOne({
                _id: ObjectId(req.session.couponid),
            }, { $push: { users: objUser } })


            const orderid= req.session.orderid;
            let couponcode = req.session.couponcode;
            let percent = req.session.couponpercent? req.session.couponpercent:0;
            let discount =req.session.coupondiscount? req.session.coupondiscount:0 ;
            let disAmt = req.session.coupontotalvalue? req.session.coupontotalvalue:0;
  
            
            const updateCouponHistory = await CouponData.updateOne({_id:ObjectId(orderid)},{$set:{
                couponcode:couponcode,
                percentage: percent  ,
                discount:discount,
                discountedAmt:disAmt
              
                }})
            
        }


const orderid= req.session.orderid;


const updateOrderItems = await order.updateOne({_id:ObjectId(orderid)},{$set:{
totalMRP:  req.session.withoutAnyOfferAmount,
totalOfferDiscount: req.session.totaldiscountamount,
couponcode:req.session.couponcode,
couponpercent: req.session.couponpercent,
coupondiscount: req.session.coupondiscount,
usedwalletamount:  req.session.usedwalletamount



    // req.session.couponpercent = percentage;
    // req.session.coupondiscount = discountVal;
    // req.session.usedwalletamount
    // req.session.withoutAnyOfferAmount
    // req.session.totaldiscountamount(offer)


}})

const orderItems = await order.find({_id:req.session.orderid})


  //TO DECREASE THE PRODUCT QUANTITY BEFORE PLACING THE ORDER FROM THE PRODUCT COLLECTION.
       // if( req.body.paymentMethod =='COD'){

        const userId = req.session.user?._id;


        const cartItems = await cart.aggregate([

            { $match: { user: ObjectId(userId) } },
            { $unwind: "$products" },
            { $project: { item: "$products.item", quantity: "$products.quantity" } },
            { $lookup: { from: "products", localField: "item", foreignField: '_id', as: 'product' } },
            { $project: { item: 1, quantity: 1, product: { $arrayElemAt: ["$product", 0] } } }


        ])

    const productIds = await cart.aggregate([
        {
            $match: { user: ObjectId(userid) }
        },
        {
            $unwind: "$products"
        },
        {
            $project: {
                _id: 0,
                item: "$products.item"
            }
        }
    ])


    const productIdsArray = [];

    for (let ids of productIds) {
        productIdsArray.push(ids.item);
    }
    req.session.products = productIdsArray;


  await  cart.deleteOne({ user: ObjectId(userid) })
 

req.session.usedwalletamount = 0;
        res.render('userviews/order-successful', { lk: false, userdetails: req.session.user })
    } else {
        res.redirect('/login')
    }
}





exports.orderAddress = async (req, res) => {


    if (req.session.isLoggedin) {
        const userId = req.session.user._id;
        let totalamount = await cart.aggregate([
            { $match: { user: ObjectId(userId) } },
            { $unwind: "$products" },
            { $project: { item: "$products.item", quantity: "$products.quantity" } },
            { $lookup: { from: "products", localField: "item", foreignField: '_id', as: 'product' } },
            { $project: { item: 1, quantity: 1, product: { $arrayElemAt: ["$product", 0] } } },
            { $group: { _id: null, total: { $sum: { $multiply: ['$quantity', { $toInt: '$product.price' }] } } } }


        ])

        let totalamount1 = await cart.aggregate([
            { $match: { user: ObjectId(userId) } },
            { $unwind: "$products" },
            { $project: { item: "$products.item", quantity: "$products.quantity" } },
            { $lookup: { from: "products", localField: "item", foreignField: '_id', as: 'product' } },
            { $project: { item: 1, quantity: 1, product: { $arrayElemAt: ["$product", 0] } } },
            { $group: { _id: null, total: { $sum: { $multiply: ['$quantity', { $toInt: '$product.realAmount' }] } } } }

        ])
        let totalvalue1 = totalamount1[0]?.total;
    
        let actualMRP = totalamount[0]?.total;
        let totaldiscount = totalvalue1 - actualMRP;


        let walletdiscount = req.session.usedwalletamount;
      

        res.render('userviews/order-address', { totalvalue1 , walletdiscount, userdetails: req.session.user, actualMRP, totaldiscount, coupondiscount: req.session.coupondiscount, totalvalue: req.session.totalvalue });
    } else {
        res.redirect('/login')
    }

}


exports.selectOrderAddress = async (req, res) => {


    if (req.session.isLoggedin) {


        let address = await Address.findOne({ _id: req.query.addressId })

        const userId = req.session.user._id;
  
      
        const cartItems = await cart.findOne({
            userId: ObjectId(userId)

        })

        req.session.cartItems=cartItems;
        let deliveryObj = {
            userfname: req.session.user.firstname,
            userlname: req.session.user.lastname,
            usermob: req.session.user.mobile,
            firstname: address.firstname,
            lastname: address.lastname,
            mobile: address.mobile,
            city: address.city,
            pincode: address.pincode,
            state: address.state,
            shipping: address.shipping
        }



        req.session.address = deliveryObj;
        let status = req.query.payment === 'COD' ? 'Placed' : 'pending';

        let dateIso = new Date()
        let date1 = moment(dateIso).format('YYYY/MM/DD')
        let time1 = moment(dateIso).format('HH:mm:ss')




        let totalAmount = req.session.totalvalue;



        const orderObject = {
            user: ObjectId(userId),
            deliveryDetails: deliveryObj,
            paymentMethod: req.query.payment,
            dateIso: dateIso,
            date: date1,
            time: time1,
            totalAmount: totalAmount,
            status: status,
            products: cartItems?.products
        }


        req.session.order = orderObject;
        req.session.payment = orderObject.paymentMethod;
        req.session.totalvalue = orderObject.totalAmount;

        let orderItems = await new order(orderObject);

        await orderItems.save();

        const orderItemsID=await order.findOne({_id:orderItems._id});

        req.session.orderid = orderItemsID._id;
        var date = Date.now()
        var orderdate = moment(date).format('YYYY-MM-DD');
        const orderId = orderItems._id;
        let total = parseInt(req.session.totalvalue)



        if (orderItems.paymentMethod == 'COD') {

        //to decrease the quantity of products in the cart item
    
        const decIds = await Product.updateOne({ _id: ObjectId(orderItems?.products[0].item) },
        {
            $inc: { "quantity": -cartItems?.products[0].quantity }
        })

    //to transfer the cart items to the order success page

    const productIds = await cart.aggregate([
        {
            $match: { user: ObjectId(userId) }
        },
        {
            $unwind: "$products"
        },
        {
            $project: {
                _id: 0,
                item: "$products.item"
            }
        }
    ])



    const productIdsArray = [];
    for (i of productIds) {
        productIdsArray.push(i.item);
    }



    req.session.products = productIdsArray;
    await cart.deleteOne({ user: ObjectId(userId) })

            const walletDetails = await wallethistory.create(
                {
                    user: ObjectId(userId),
                    order: ObjectId(orderId),
                    paymentMethod: 'COD',
                    Orderdate: orderdate,
                    WalletAmount: req.session.wallet,
                    appliedWalletAmount: req.session.usedwalletamount,
                    creditedAmount: 0,
                    currentWalletAmount: req.session.currentWlletAmount,
               
                    status: "order placed, applied wallet amount will be deducted!"
                }
            )

            const couponhistory = await CouponData.create({
                user: ObjectId(userId),
                order: ObjectId(orderId),
                paymentMethod: 'COD',
                Orderdate: orderdate,
                couponcode: req.session.couponcode,
                totalAmount:  req.session.incomingtotal,
                percentage:  req.session.couponpercent?req.session.couponpercent:0 ,
                discount: req.session.coupondiscount?req.session.coupondiscount:0,
                discountedAmt: req.session.coupontotalvalue?req.session.coupontotalvalue:0,
                status: "order placed, applied cannot be used again!"
            })
       
            res.json({ status: true, paymentMethod: 'COD' })

        } else if (orderItems.paymentMethod == 'Razorpay') {

            var options = {
                amount: total * 100,
                currency: "INR",
                receipt: "" + orderId
            }
            instance.orders.create(options, function (err, order) {
                if (err) {
                    console.log(err);
                } else {

                    const walletDetails = wallethistory.create(
                        {
                            user: ObjectId(userId),
                            order: ObjectId(orderId),
                            paymentMethod: 'Razorpay',
                            Orderdate: orderdate,
                            WalletAmount: req.session.wallet,
                            appliedWalletAmount: req.session.usedwalletamount,
                            creditedAmount: 0,
                            currentWalletAmount: req.session.currentWlletAmount,
                           
                            status: "Wallet amount deducted"
                        }
                    )
                    const couponhistory =  CouponData.create({
                        user: ObjectId(userId),
                        order: ObjectId(orderId),
                        paymentMethod: 'Razorpay',
                        Orderdate: orderdate,
                        couponcode: req.session.couponcode,
                        totalAmount:  req.session.incomingtotal,
                        percentage:  req.session.couponpercent?req.session.couponpercent:0 ,
                        discount: req.session.coupondiscount?req.session.coupondiscount:0,
                        discountedAmt: req.session.coupontotalvalue?req.session.coupontotalvalue:0,
                        status: "Coupon amount deducted"
                    })
                    res.json(order);
                }
            })
        } else {


            val = total / 74;
            totalPrice = val.toFixed(2);
            let totals = totalPrice.toString();
        
            const create_payment_json = {
                intent: "sale",
                payer: {
                    payment_method: "paypal",
                },
                redirect_urls: {
                    return_url: "http://localhost:5500/order-successful",
                    cancel_url: "http://localhost:5500/order-failed",
                },
                transactions: [
                    {
                        item_list: {
                            items: [
                                {
                                    name: "Kstyles",
                                    sku: "item",
                                    price: totals,
                                    currency: "USD",
                                    quantity: 1,
                                },
                            ],
                        },
                        amount: {
                            currency: "USD",
                            total: totals,
                        },
                        description: "This is the payment description.",
                    },
                ],
            };
            paypal.payment.create(create_payment_json, function (error, payment) {
                if (error) {
                    throw error;
                } else {
          
                    for (let i = 0; i < payment.links.length; i++) {

                        if (payment.links[i].rel === "approval_url") {
                            let link = payment.links[i].href;
                            link = link.toString();



                            const walletDetails = wallethistory.create(
                                {
                                    user: ObjectId(userId),
                                    order: ObjectId(orderId),
                                    paymentMethod: 'paypal',
                                    Orderdate: orderdate,
                                    WalletAmount: req.session.wallet,
                                    appliedWalletAmount: req.session.usedwalletamount,
                                    creditedAmount: 0,
                                    currentWalletAmount: req.session.currentWlletAmount,
                                    status: "Wallet amount deducted"
                                }
                            )
                            const couponhistory =  CouponData.create({
                                user: ObjectId(userId),
                                order: ObjectId(orderId),
                                paymentMethod: 'paypal',
                                Orderdate: orderdate,
                                couponcode: req.session.couponcode,
                                totalAmount:  req.session.incomingtotal,
                                percentage:  req.session.couponpercent?req.session.couponpercent:0 ,
                                discount: req.session.coupondiscount?req.session.coupondiscount:0,
                                discountedAmt: req.session.coupontotalvalue?req.session.coupontotalvalue:0,
                                status: "Coupon amount deducted"
                            })
                            
                            res.json({ paypal: true, url: link })
                        }
                    }
                }
            });
        }


    } else {
        res.redirect('/login')
    }

}




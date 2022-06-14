const cart = require('../models/cartSchema')
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


var instance = new Razorpay({
    key_id: 'rzp_test_gpdw4Vd4R7dTYf',
    key_secret: 'npUb30BVu4ACBJS1cPtRcsw7'
})



paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': 'Aae-Pk_s8KONIPW-WdbGN-u_MyUtGCnmc_70SIhGectvo3DZcYAvlFtk3NTkMVB8bAauS74nD3Ij68jQ',
    'client_secret': 'EPtaR696s87nWMKibGT4vHocyy_Vi0TGT79EpW3bi_aJ3Y4r4gsvhcSghCBV65uYLNAGenBUy4lS9y1I'
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
        let totalvalue = totalamount[0]?.total;

        res.render('userviews/checkout', { lk: false, userdetails: req.session.user, addres: addresses, totalvalue: req.session.totalvalue });
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
            shipping: req.body.shipping === 'on' ? 'Home' : 'Office'
        }



        req.session.address = deliveryObj;

        let status = req.body.paymentMethod === 'COD' ? 'Placed' : 'Pending';

        let dateIso = new Date()
        let date1 = moment(dateIso).format('YYYY/MM/DD')
        let time1 = moment(dateIso).format('HH:mm:ss')

        const orderObject = {
            user: ObjectId(userId),
            deliveryDetails: deliveryObj,
            paymentMethod: req.body.paymentMethod,
            date: date1,
            time: time1,
            totalAmount: req.body.total,
            status: status,
            products: cartItems?.products
        }


        console.log('orderObject',orderObject);
        req.session.order = orderObject;



        req.session.payment = orderObject.paymentMethod;
        req.session.totalvalue = orderObject.totalAmount;


        let orderItems = await new order(orderObject)

        let address = await new Address({
            user: ObjectId(userId),
            firstname: deliveryObj.firstname,
            lastname: deliveryObj.lastname,
            mobile: deliveryObj.mobile,
            city: deliveryObj.city,
            pincode: deliveryObj.pincode,
            state: deliveryObj.state,
            shipping: deliveryObj.shipping === 'on' ? 'home' : 'office'
        })




        //TO DECREASE THE PRODUCT QUANTITY BEFORE PLACING THE ORDER FROM THE PRODUCT COLLECTION.
        const decIds = await Product.updateOne({ "_id": ObjectId(orderItems.products[0]?.item) },
            {
                $inc: { "quantity": -cartItems?.products[0]?.quantity }
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

        // console.log("product array"+productIdsArray)



        await cart.deleteOne({ user: ObjectId(userId) })


        await orderItems.save();
        await address.save();
        const orderId = orderItems._id;
        let total = parseInt(req.session.totalvalue)
        if (orderItems.paymentMethod == 'COD') {
            console.log('codddddd')
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
                    console.log("New Order", order);

//o/ppp==========>
                    // New Order {
                    //     id: 'order_Jf3a9GEvKd3cxz',
                    //     entity: 'order',
                    //     amount: 6800,
                    //     amount_paid: 0,
                    //     amount_due: 6800,
                    //     currency: 'INR',
                    //     receipt: '62a0c5aa405cc980dbd8f565',
                    //     offer_id: null,
                    //     status: 'created',
                    //     attempts: 0,
                    //     notes: [],
                    //     created_at: 1654703606
                    //   }


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
            paypal.payment.create(create_payment_json, function (error, payment) {
                if (error) {
                    throw error;
                } else {
                    // console.log(payment);
                    for (let i = 0; i < payment.links.length; i++) {
                        console.log("11");
                        if (payment.links[i].rel === "approval_url") {
                            let link = payment.links[i].href;
                            link = link.toString();
                            res.json({ paypal: true, url: link })
                        }
                    }
                }
            });
        }







    }

}







exports.paymentVerification = async (req, res) => {


    const crypto = require('crypto');
    let hmac = crypto.createHmac('sha256', 'npUb30BVu4ACBJS1cPtRcsw7');
    hmac.update(req.body.payment.razorpay_order_id + '|' + req.body.payment.razorpay_payment_id);
    hmac = hmac.digest('hex')

    if (hmac == req.body.payment.razorpay_signature) {
        // userHelpers.chagePaymentStatus (req.body [' receipt']).then(() =>{
        //     console.log("Payment successfull"); 
        //     res.json({status:true})
        // const orderId = req.body.order.receipt;
        // await order.updateOne({_id:ObjectId(orderId)},
        // {
        //     $set:{ status:'pending'}
        // })
        // console.log('payment successfull');
        res.json({ status: true })
    } else {
        res.json({ status: false, errMsg: '' })
    }

}



//admin side displaying orders

exports.handleOrders = async (req, res) => {

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



    ]).sort({_id:-1})


    // console.log('userdata',orderDetails[0].userData)
    // console.log('productdata',orderDetails[0].productData)
    // console.log(orderDetails)
    // const name=orderDetails[0].userData;
    // console.log(name);

    // console.log("NewData"+orderDetails);
    res.render('adminviews/view-orders', { admin: true, Order: orderDetails })


}


//admin side cancelling orders

exports.cancelOrders = async (req, res) => {
    const orderId = req.params.id;

    const orders = await order.findOne({ _id: orderId })


    const deleteorders = await order.updateOne({ _id: orderId }, {
        $set: { status: 'cancelled' }
    })

    res.redirect('/admin/view-orders')
}



//adminside  status change to cancel

exports.deliveryStatus = async (req, res) => {

    const orderId = req.body.orderId;
  

    const statusdata = await order.updateOne({ _id: ObjectId(orderId) },
        {
            $set: {
                status: req.body.status
            }
        })


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

        ]).sort({_id:-1})


        let totalamount = await cart.aggregate([
            { $match: { user: ObjectId(userId) } },
            { $unwind: "$products" },
            { $project: { item: "$products.item", quantity: "$products.quantity" } },
            { $lookup: { from: "products", localField: "item", foreignField: '_id', as: 'product' } },
            { $project: { item: 1, quantity: 1, product: { $arrayElemAt: ["$product", 0] } } },
            { $group: { _id: null, total: { $sum: { $multiply: ['$quantity', { $toInt: '$product.price' }] } } } }


        ])
        let totalvalue = totalamount[0]?.total;


        res.render('userviews/myorders', { userdetails: req.session.user, orders: myOrders, totalvalue: req.session.totalvalue })

    }

}




exports.cancelUserOrders = async (req, res) => {
    const orderId = req.params.id;

    const orders = await order.findOne({ _id: orderId })



    const deleteorders = await order.updateOne({ _id: orderId }, {
        $set: { status: 'cancelled' }
    })

    res.redirect('/show-my-orders')
}



exports.userDeliveryStatus = async (req, res) => {

    const orderId = req.body.orderId;

    const statusdata = await order.updateOne({ _id: ObjectId(orderId) },
        {
            $set: {
                status: req.body.status
            }
        })


}



exports.showMyOrdersAtUserSide = async(req,res)=>{

    if (req.session.isLoggedin) {

        res.render('userviews/myorders', { lk: true, userdetails: req.session.user })
    }
}


exports.displayOrderedProducts = async(req,res)=>{//  /show-products/:id

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

}



exports.showUserSideOrderedProducts = async(req,res)=>{


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

    }



}



exports.invoicehandler = async(req,res)=>{ // /invoice


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


        // console.log("kikikikiki"+productdetails.product[0]);

        console.log("pduct" + productdetails[0]);
        // console.log("mmmmmmmmyyyyyyyyy"+myOrders[0].product);
        res.render('userviews/invoice', { lk: false, userdetails: req.session.user, orders: myOrders, products: productdetails })

    }

}


exports.orderFailed = async(req,res)=>{//  /order-failed 

    if (req.session.isLoggedin) {
        res.render('userviews/order-failed', { lk: false, userdetails: req.session.user })
    }
}

exports.orderSuccessful = async(req,res)=>{

    if (req.session.isLoggedin) {
        res.render('userviews/order-successful', { lk: false, userdetails: req.session.user })
    }




}





exports.orderAddress = async(req,res)=>{


    if (req.session.isLoggedin) {
        const userId = req.session.user._id;

        res.render('userviews/order-address', { userdetails: req.session.user, totalvalue: req.session.totalvalue });
    }

}


exports.selectOrderAddress = async(req,res)=>{


        if (req.session.isLoggedin) {


        let address = await Address.findOne({ _id: req.query.addressId })
        console.log('address from hbs through addressid' + address)
        const userId = req.session.user._id;
        const cartItems = await cart.findOne({
            userId: ObjectId(userId)

        })

        console.log('to find the cartitems' + cartItems)



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
        let status = req.query.payment === 'COD' ? 'Placed' : 'Pending';

        let dateIso = new Date()
        let date1 = moment(dateIso).format('YYYY/MM/DD')
        let time1 = moment(dateIso).format('HH:mm:ss')

        console.log("the total amount is" + req.session.totalvalue);


        let totalAmount = req.session.totalvalue;



        const orderObject = {
            user: ObjectId(userId),
            deliveryDetails: deliveryObj,
            paymentMethod: req.query.payment,
            date: date1,
            time: time1,
            totalAmount: totalAmount,
            status: status,
            products: cartItems?.products
        }


        req.session.order = orderObject;
        req.session.payment = orderObject.paymentMethod;
        req.session.totalvalue = orderObject.totalAmount;

        let orderItems = await new order(orderObject)
        //to decrease the quantity of products in the cart item

        const decIds = await Product.updateOne({ _id: ObjectId(orderItems.products[0]?.item) },
            {
                $inc: { "quantity": -cartItems?.products[0]?.quantity }
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

        console.log('the transfered productitems from the cart to the order page' + productIds)

        const productIdsArray = [];
        for (i of productIds) {
            productIdsArray.push(i.item);
        }



        req.session.products = productIdsArray;
        await cart.deleteOne({ user: ObjectId(userId) })

        await orderItems.save();
        const orderId = orderItems._id;
        let total = parseInt(req.session.totalvalue)






        if (orderItems.paymentMethod == 'COD') {
            console.log('COD')
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
                    res.json(order);
                }
            })
        } else {

            console.log("paypal");
            val = total / 74;
            totalPrice = val.toFixed(2);
            let totals = totalPrice.toString();
            // console.log(req.session.total);
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
                    // console.log(payment);
                    for (let i = 0; i < payment.links.length; i++) {
                        console.log("11");
                        if (payment.links[i].rel === "approval_url") {
                            let link = payment.links[i].href;
                            link = link.toString();
                            res.json({ paypal: true, url: link })
                        }
                    }
                }
            });
        }



    }


}
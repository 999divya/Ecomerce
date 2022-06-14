const path = require('path');
const cart = require('../models/cartSchema')
var ObjectId = require('mongoose').Types.ObjectId;
const Product = require('../models/productSchema');
const Category = require('../models/categorySchema');



exports.addToCart = async (req, res) => {
  

        try {
            if(req.session.isLoggedin){

            const userId = req.session.user?._id;
            const proId = req.params.id;
    
    
    
            let proObj = {
                item: ObjectId(proId),
                quantity: 1
            }
    
    
            const userCart = await cart.findOne({ user: ObjectId(userId) })
    
    
            if (userCart) {
                const existProduct = await userCart?.products?.findIndex(userprodId =>
                    userprodId.item == proId
                )
                if (existProduct == -1) {
    
                    const cartdata = await cart.updateOne({
                        user: ObjectId(userId),
    
                    },
                        { $push: { products: proObj } })
    
                        res.json({ status: true });
    
                } else {
    
                    const cartincrement = await cart.updateOne({
                        user: ObjectId(userId),
                        'products.item': ObjectId(proId)
                    }, { $inc: { "products.$.quantity": 1 } })
    
                    res.json({ status: true });
                }
    
    
            } else {
                const newcart =await new cart({
                    user: ObjectId(userId),
                    products: [proObj]
                })
                newcart.save()
                res.json({ status: true});
    
    
          
    
    
            }

        }
        } catch (error) {
            console.log(error.message)
        }
    
    
    
    
    
    
        // const ProductDetails = await Product.find()
        // const categoryDetails = await Category.find()
    
        // if (req.body.pl = '') {
        //     res.render('userviews/user-home', { lk: true, products: ProductDetails, categorys: categoryDetails, userdetails: req.session.user })
        // } else {
        //     res.render('userviews/category-view', { lk: true, products: ProductDetails, categorys: categoryDetails, userdetails: req.session.user })
        // }
      
        console.log('Added to Cart sucessfully');

    

}



exports.deleteItem = async (req, res) => {


    if(req.session.isLoggedin){
        try {


            const cartId = req.body.cart;
            const proId = req.body.product;
            const userId = req.session.user._id;
    
            const product = await cart.updateOne({
    
                _id: ObjectId(cartId)
            },
                { $pull: { products: { item: ObjectId(proId) } } })
    
           
            res.json({ status: true, product})
            
    
        } catch (error) {
            console.log(error.message)
        }
    
    }
   

}



exports.showCartItems = async (req, res) => {


    try {

   
        //to store the url of the cart item listing.
        req.session.oldUrl = req.url;

        if (req.session.isLoggedin) {

    console.log('ii111');

            const userId = req.session.user?._id;
            console.log('ii11oooo1',userId);

            const cartItems = await cart.aggregate([



                { $match: { user: ObjectId(userId) } },
                { $unwind: "$products" },
                { $project: { item: "$products.item", quantity: "$products.quantity" } },
                { $lookup: { from: "products", localField: "item", foreignField: '_id', as: 'product' } },
                { $project: { item: 1, quantity: 1, product: { $arrayElemAt: ["$product", 0] } } }


            ])
      
      



            let totalamount = await cart.aggregate([
                { $match: { user: ObjectId(userId) } },
                { $unwind: "$products" },
                { $project: { item: "$products.item", quantity: "$products.quantity" } },
                { $lookup: { from: "products", localField: "item", foreignField: '_id', as: 'product' } },
                { $project: { item: 1, quantity: 1, product: { $arrayElemAt: ["$product", 0] } } },
                { $group: { _id: null, total: { $sum: { $multiply: ['$quantity', { $toInt: '$product.realAmount' }] } } } }


            ])


            // let totalDistAmt = await cart.aggregate([
            //     { $match: { user: ObjectId(userId) } },
            //     { $unwind: "$products" },
            //     { $project: { item: "$products.item", quantity: "$products.quantity" } },
            //     { $lookup: { from: "products", localField: "item", foreignField: '_id', as: 'product' } },
            //     { $project: { item: 1, quantity: 1, product: { $arrayElemAt: ["$product", 0] } } },
            //     { $group: { _id: null, total: { $sum: { $multiply: ['$quantity', { $toInt: '$product.discount' }] } } } }


            // ])
     
            const cartcount = await cart.findOne({
                user: ObjectId(userId)
            })
           var count = 0;
            if (cartcount==''||cartcount==null||cartcount==undefined) {

                count=0;  
            }else{
              count = cartcount.products.length;
            }

           

     
            let totalAmount = totalamount[0]?.total;
         
            
            // let totaldiscount = totalDistAmt[0]?.total;
            // console.log('ttotaldiscount', totaldiscount);
         

          
            const ProductDetails = await Product.find()
            const categoryDetails = await Category.find()
            // req.session.totalvalue = totalvalue;
           
       


            console.log('1',cartItems)
       
            console.log('1',count)
            console.log('1',userId)
            console.log('1',req.session.user)
            console.log('pppppppprrrrrrrrrrrooooooooo',ProductDetails)
            console.log( 'ccccaaaaaaaaaaaaaaaaaaaatttttttttt',categoryDetails)
            req.session.totalvalue = totalAmount;
            console.log('1', req.session.totalvalue)
console.log('tttyyyyttyyy');
            res.render('userviews/cart', { lk: true, cartData: cartItems, totalvalue:  req.session.totalvalue , count, userId, userdetails: req.session.user, products: ProductDetails, categorys: categoryDetails })

        } else {

            res.redirect('/login')
        }


    } catch (err) {
        console.log(err.message)
    }




}


exports.changeQuantity = async (req, res) => {

    if(req.session.isLoggedin){

        try {


            const userId = req.session.user?._id;
    
            const cartid = req.body.cart;
            const product = req.body.product;
            let count = req.body.count;
          
            let quantity = req.body.quantity;
    
    
    
            count = parseInt(count);
            quantity = parseInt(quantity);
    
    
            
         
    
    
    
    
            if (quantity == 1 && count == -1) {
                await cart.updateOne({ _id: ObjectId(cartid) },
                    {
                        $pull: { products: { item: ObjectId(product) } }
    
    
                    })
                res.json({ status: true, removeProduct: true })
            } else {
                await cart.updateOne({ _id: ObjectId(cartid), 'products.item': ObjectId(product) },
                    {
                        $inc: {
                            "products.$.quantity": count
                        }
                    })
    
    
                    let count1 = count+quantity;
                
    
                let totalamount = await cart.aggregate([
                    { $match: { user: ObjectId(userId) } },
                    { $unwind: "$products" },
                    { $project: { item: "$products.item", quantity: "$products.quantity" } },
                    { $lookup: { from: "products", localField: "item", foreignField: '_id', as: 'product' } },
                    { $project: { item: 1, quantity: 1, product: { $arrayElemAt: ["$product", 0] } } },
                    { $group: { _id: null, total: { $sum: { $multiply: ['$quantity', { $toInt: '$product.price' }] } } } }
    
    
                ])
                let totalDistAmt = await cart.aggregate([
                    { $match: { user: ObjectId(userId) } },
                    { $unwind: "$products" },
                    { $project: { item: "$products.item", quantity: "$products.quantity" } },
                    { $lookup: { from: "products", localField: "item", foreignField: '_id', as: 'product' } },
                    { $project: { item: 1, quantity: 1, product: { $arrayElemAt: ["$product", 0] } } },
                    { $group: { _id: null, total: { $sum: { $multiply: ['$quantity', { $toInt: '$product.discount' }] } } } }
    
    
                ])
                let totalAmount = totalamount[0]?.total;
                let totaldiscount = totalDistAmt[0]?.total;
    
    
              
                req.session.totalvalue = totaldiscount? totaldiscount:totalAmount;
    
                // const cartcount = await cart.findOne({
                //     user: ObjectId(userId)
                // })
                // if (cartcount) {
                //   const count = cartcount.products.length;
                // }
    
                res.json({ status: true, totalvalue:req.session.totalvalue, count1})
    
            }
    
    
    
        } catch (err) {
            console.log(err.message)
        }
    }
   

}




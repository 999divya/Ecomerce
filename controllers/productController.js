const Product = require('../models/productSchema');
const path = require('path');
const ObjectId = require('mongoose').Types.ObjectId;
const catOffer = require('../models/catOfferSchema');
const proOffer = require('../models/offerSchema')
const offerSchema = require('../models/offerSchema');
const Category = require('../models/categorySchema')
const cart = require('../models/cartSchema')


exports.productHandler = async (req, res) => {
    if (req.session.adminLoggedin) {
        const imgPathPro = [];




        if (req.body.id == '') {

            const duplicatePro = await Product.findOne({
                code: req.body.code
            }).exec();
            if (!req?.body?.name || !req?.body.code || duplicatePro) {
                // req.session.message1={
                //     type:'danger',
                //     display:'Please fill the relevent areas, the Product code must be unique',
                //     message:'Please give a unique code'
                // }
                // res.redirect('/admin/add-products')

                res.render('adminviews/add-products', { admin: true, message: 'Please fill the relevent areas, the Product code must be unique', p: true })
            }
        }


        let images = [req.files?.image, req.files?.image1, req.files?.image2, req.files?.image3]
        if (images) {

            let a = 1;
            images.map((image) => {
                a++;
                const id = Date.now();
                var uploadPath = '/public/adminassets/product_Img/' + a + id + '.jpeg';
                var uploadFile = './public/adminassets/product_Img/' + a + id + '.jpeg';
                imgPathPro.push(uploadPath);
                image?.mv(uploadFile, (err) => {
                    if (err) {
                        console.log(err.message);
                    }
                })

            })


        }
        try {

            const foundProduct = req.body.id != '' ? await Product.findOne({ _id: req.body.id }).exec() : false;

            let discountPercentage = 0;

            const obtainedCategory = req.body.mainCategory ? req.body.mainCategory : req.body.perprocat;
            const categoryOfferData = await catOffer.findOne({ categoryname: obtainedCategory })



            if (categoryOfferData) {
                discountPercentage = categoryOfferData.percentage != null ? categoryOfferData.percentage : 0;
            }

            // const discount1 = parseInt(req.body.price) * (categoryDiscount) / 100;//category

            // const discountPriceCat = parseInt(req.body.price) - discount1;//category




            const productoffer = req.body.id !== '' ? await proOffer.findOne({ proId: ObjectId(req.body.id) }) : null;

            if (productoffer) {
                discountPercentage = productoffer.percentage != null ? productoffer.percentage : 0;
            }

        

            const discountAmount = (parseInt(req.body.price) * discountPercentage) / 100;
            const price = parseInt(req.body.price) - discountAmount;




            if (!foundProduct) {

                const productResult = await Product.create({

                    name: req.body.name,
                    code: req.body.code,
                    price: req.body.price,
                    percentage: discountPercentage ? discountPercentage : 0,
                    discount: price ? price : 0,
                    realAmount: price == 0 ? req.body.price : price,
                    brand: req.body.brand,
                    size: req.body.size,
                    type: req.body.type,
                    description: req.body.description,
                    category: req.body.mainCategory,

                    Image: imgPathPro
                });
                // await productResult.save();
            } else {

                const doc = await Product.findOneAndUpdate({
                    _id: req.body.id
                },
                    {

                        name: req.body.name,
                        code: req.body.code,
                        price: req.body.price,
                        percentage: discountPercentage,
                        discount: price,
                        realAmount: price == 0 ? req.body.price : price,
                        brand: req.body.brand,
                        size: req.body.size,
                        type: req.body.type ? req.body.type : req.body.protype,
                        description: req.body.description,
                        category: req.body.mainCategory,
                        Image: req.files?.image == null ? req.body.imagePath : uploadPath
                    },
                    { upsert: true, useFindAndModify: true })
            }
            const Products = await Product.find().sort({ _id: -1 });

            res.redirect('/admin/view-products');


        } catch (err) {

            console.log(err.message);
        }
    } else {
        res.redirect('/login')
    }
}




exports.showAllProducts = async (req, res) => {
    if (req.session.adminLoggedin) {
        try {
   
            const Products = await Product.find().sort({ _id: -1 });

            res.render('adminviews/view-products', { admin: true, productList: Products });

        } catch (error) {
            console.log(error.message)
        }
    } else {
        res.redirect('/login')
    }

}




exports.editEachProducts = async (req, res) => {

    if (req.session.adminLoggedin) {

        const categoryList = await Category.find({})
        const findProductsToEdit = await Product.findOne({
            _id: req.params.id
        }).exec()



        res.render('adminviews/add-products', { admin: true, editProducts: findProductsToEdit, categoryList, p: true });
    } else {
        res.redirect('/login')
    }
}


exports.deleteEachProduct = async (req, res) => {
    if (req.session.adminLoggedin) {
        const deleteProduct = await Product.deleteOne({ _id: req.params.id }).exec();
        const foundProducts = await Product.find();
        res.redirect('/admin/view-products');
    } else {
        res.redirect('/login')
    }
}


exports.searchProducts = async (req, res) => {
    if (req.session.adminLoggedin) {
        const SearchPro = await Product.find({
            name: new RegExp(req.query.searchdata, "i"),

        })

        const SearchPro1 = await Product.find({
            code: new RegExp(req.query.searchdata, "i")

        })




        res.render('adminviews/view-products', { admin: true, productList: SearchPro });
    } else {
        res.redirect('/login')
    }
}


exports.productDetailsAtUser = async (req, res) => {


    const userId = req.session.user?._id;

    const productDetails = await Product.findOne({
        _id: req.params.id
    })


 

    const categoryDetails = await Category.find()

   
    if (req.session.user) {
        var cartcount = await cart.find({ user: ObjectId(userId) })
        var count = 0;
        if (cartcount == '' || cartcount == null || cartcount == undefined) {

            count = 0;
        } else {
            count = cartcount[0].products?.length;
        }

    }


    const SearchPro = await Product.find({
        name: new RegExp(req.query.searchdata, "i"),

    })

    res.render('userviews/product-details', { lk: true, products: productDetails, count, categorys: categoryDetails, userdetails: req.session.user })



}
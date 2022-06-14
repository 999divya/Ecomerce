const Product = require('../models/productSchema');
const path = require('path');
const ObjectId = require('mongoose').Types.ObjectId;
const catOffer = require('../models/catOfferSchema');
const proOffer = require('../models/offerSchema')
const offerSchema = require('../models/offerSchema');
const Category = require('../models/categorySchema')
const cart = require('../models/cartSchema')


exports.productHandler = async (req, res) => {
    // if(req.session.adminLoggedin){
    const imgPathPro = [];




    if (req.body.id == '') {

        const duplicatePro = await Product.findOne({
            code: req.body.code
        }).exec();
        if (!req?.body?.name || !req?.body.code || duplicatePro) {

            res.render('adminviews/add-products', { admin: true, message: 'Please fill the relevent areas, the Product code must be unique', p: true })
        }
    }


    let images = [req.files?.image, req.files?.image1, req.files?.image2, req.files?.image3]
    if (images) {
        for (const image of images) {
            const id = Date.now();
            var uploadPath = '/public/adminassets/product_Img/' + id + '.jpeg';
            var uploadFile = './public/adminassets/product_Img/' + id + '.jpeg';
            imgPathPro.push(uploadPath);
            image?.mv(uploadFile, (err) => {
                if (err) {
                    console.log(err.message);
                }
            })
        }
    }
    try {

        const foundProduct = req.body.id != '' ? await Product.findOne({ _id: req.body.id }).exec() : false;

        let discountPercentage = 0;
        console.log("ppeerrrppprroooccaatttt" + req.body.perprocat);
        const obtainedCategory = req.body.mainCategory ? req.body.mainCategory : req.body.perprocat;
        const categoryOfferData = await catOffer.findOne({ categoryname: obtainedCategory })



        if (categoryOfferData) {
            discountPercentage = categoryOfferData.percentage != null ? categoryOfferData.percentage : 0;
        }

        console.log('discountPercentage', discountPercentage);
        // const discount1 = parseInt(req.body.price) * (categoryDiscount) / 100;//category

        // const discountPriceCat = parseInt(req.body.price) - discount1;//category




        const productoffer = req.body.id !== '' ? await proOffer.findOne({ proId: ObjectId(req.body.id) }) : null;

        if (productoffer) {
            discountPercentage = productoffer.percentage != null ? productoffer.percentage : 0;
        }

        console.log('discount percentage' + discountPercentage);

        const discountAmount = (parseInt(req.body.price) * discountPercentage) / 100;
        const price = parseInt(req.body.price) - discountAmount;




        if (!foundProduct) {

            const productResult = await Product.create({

                name: req.body.name,
                code: req.body.code,
                price: req.body.price,
                percentage: discountPercentage,
                discount: price,
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
    // }
}




exports.showAllProducts = async (req, res) => {
    // if(req.session.adminLoggedin){
    try {
        // // const findexpiredProducts =[];
        // const expiredCategory = await catOffer.find({ status: "Expired" })
        // // console.log("expiredCategory" + expiredCategory);

        // expiredCategory.map(async (category) => {
        //     const Allcatagory = await Category.updateOne({ _id: ObjectId(category.catId) }, { $set: { percentage: 0 } })
        //     // console.log("expiredCatproducts" + category.categoryname);

        //     const providetheproducts = await Product.find({ category: category.categoryname })


        //     providetheproducts.map(async (product) => {
                
        //         const productoffers = await proOffer.find({proId: product._id})
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



        // const expiredProducts = await proOffer.find({ status: "Expired" })
        // expiredProducts.map(async (products) => {
        //     const Allproducts = await Product.updateOne({ _id: ObjectId(products.proId) }, { $set: { percentage: 0, discount: 0, realAmount: products.productprice } })
        // })
        const Products = await Product.find().sort({ _id: -1 });





        res.render('adminviews/view-products', { admin: true, productList: Products });

    } catch (error) {
        console.log(error.message)
    }
    // }

}




exports.editEachProducts = async (req, res) => {
    // if(req.session.adminLoggedin){

    const categoryList = await Category.find({})
    const findProductsToEdit = await Product.findOne({
        _id: req.params.id
    }).exec()

    console.log('editEachProducts', findProductsToEdit)

    res.render('adminviews/add-products', { admin: true, editProducts: findProductsToEdit, categoryList, p: true });
    // }
}


exports.deleteEachProduct = async (req, res) => {
    // if(req.session.adminLoggedin){
    const deleteProduct = await Product.deleteOne({ _id: req.params.id }).exec();
    const foundProducts = await Product.find();
    res.redirect('/admin/view-products');
    // }
}


exports.searchProducts = async (req, res) => {
    const SearchPro = await Product.find({
        name: new RegExp(req.query.searchdata, "i"),

    })

    const SearchPro1 = await Product.find({
        code: new RegExp(req.query.searchdata, "i")

    })




    res.render('adminviews/view-products', { admin: true, productList: SearchPro });
}


exports.productDetailsAtUser = async(req,res)=>{


    const userId = req.session.user?._id;
    // if(req.session.isLoggedin){

    const productDetails = await Product.findOne({
        _id: req.params.id
    })

    const categoryDetails = await Category.find()

    // let images = {
    //     Image1:productDetails.Image[0]
    // }



    var cartcount = await cart.find({ user: ObjectId(userId) })
    var count = 0;
    if (cartcount == '' || cartcount == null || cartcount == undefined) {

        count = 0;
    } else {
        count = cartcount[0].products?.length;
    }

    const SearchPro = await Product.find({
        name: new RegExp(req.query.searchdata, "i"),

    })

    res.render('userviews/product-details', { lk: true, products: productDetails, count, category: categoryDetails, userdetails: req.session.user })



}
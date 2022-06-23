const Category = require('../models/categorySchema');
const path = require('path');
const objectId = require('mongoose').Types.ObjectId;
const Product = require('../models/productSchema')



// const Categorys = await Category.find();
// if (!Categorys) {
//     res.render('adminviews/dashboard');
// }





exports.createNewCategory = async (req, res) => {
    if (req.session.adminLoggedin) {

    const imgPath = [];
    if (req.body.id == '') {
        const duplicate = await Category.findOne({
            category: req.body.category
        }).exec()
        if (duplicate) {
            res.status(404).send("Incorrect Username and/or Password!");
            res.render('adminviews/add-category', { admin: true, message: 'Category name already existed, try a new name' });
        }
    }

    let images = [req.files?.image]

    if (images) {

        for (const image of images) {
            const id = Date.now();
            var uploadPath = '/public/adminassets/category_Img/' + id + '.jpeg'
            var uploadFile = './public/adminassets/category_Img/' + id + '.jpeg'

            imgPath.push(image);

            image?.mv(uploadFile, (err) => {
                if (err) {
                    console.log(err.message);
                }
            })
        }

    }


    try {
        const foundCategory = req.body.id != '' ? await Category.findOne({ _id: req.body.id }).exec() : false;
        if (!foundCategory) {

            const catResult = await Category.create({

                category: req.body.category,
                Image: uploadPath
            })
        } else {
            const doc = await Category.findOneAndUpdate({
                _id: req.body.id
            }, {

                category: req.body.category,
                Image: req.files?.image == null ? req.body.imgPath : uploadPath

            }, { upsert: true, useFindAndModify: false });
        }
        // const Categorys = await Category.find();
        res.redirect('/admin/view-category');

    } catch (err) {
        console.log(err);
    }
    }else{
        res.redirect('/login')
    }
}





exports.searchCategory = async (req, res) => {
    if (req.session.adminLoggedin) {
    const searchCat = await Category.find({
        category: new RegExp(req.query.searchdata, "i"),
    })
    res.render('adminviews/view-category', { admin: true, categoryList: searchCat });
}else{
    res.redirect('/login')
}
}










exports.deleteEachCategory = async (req, res) => {
    if (req.session.adminLoggedin) {
    const findthatCat = await Category.find({ _id: req.params.id })


    const find = findthatCat[0].category;
   

    const result = await Product.find({ category: find })


    if (result=='') {

        const result22 = await Category.deleteOne({ _id: req.params.id })
        res.redirect('/admin/view-category');
        // // }
    }
    
    // else {
    //     res.redirect('/admin/view-category');
    // }
    }else{
        res.redirect('/login')
    }

}



    // exports.showAllCategories = async (req, res) => {
    //     // if(req.session.adminLoggedin){
    //     try {
    //         const Categorys = await Category.find();
    //         res.render('adminviews/view-category', { admin: true, categoryList: Categorys });
    //     } catch (error) {
    //         console.log(error.message);
    //     }
    //     // }
    // }





    exports.editEachCategory = async (req, res) => {
        if(req.session.adminLoggedin){
        const findCategoryToEdit = await Category.findOne({
            _id: req.params.id
        }).exec()
        res.render('adminviews/add-category', { admin: true, editCategory: findCategoryToEdit, c: true })
        }else{
            res.redirect('/login')
        }
    }
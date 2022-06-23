const catOffer = require('../models/catOfferSchema')
const Product = require('../models/productSchema')
const moment = require('moment');
const Category = require('../models/categorySchema');
const offer = require('../models/offerSchema');
const { findOne } = require('../models/productSchema');
var ObjectId = require('mongoose').Types.ObjectId;



exports.viewAllCategoryOffers = async (req,res)=>{ // /view-all-catoffers
  if (req.session.adminLoggedin) {
    const offerdetails1 = await catOffer.find({toDate:{$lt:new Date()}})
    // let today = new Date()

    offerdetails1?.map(async(catoffer)=>{

 
      const categoryname = await Category.find({_id:catoffer.catId})


 
        const product = await Product.find({category:catoffer.categoryname})
        product.map(async(prod)=>{
          const canceloffer = await Product.updateOne({category:catoffer.categoryname},{$set:{percentage:0, discount:0, realAmount:prod.price}})

        })
       


      const deleteItem = await catOffer.deleteOne({toDate:{$lt:new Date()}},{_id:catOffer._id})

    })
  
  
    const offerdetails = await catOffer.find({})
    res.render('adminviews/view-categoryoffers', { admin: true, offerdetails })
  }else{
    res.redirect('/login')
}
}






exports.addCategoryOffer = async(req,res)=>{// /add-category-offer
  if (req.session.adminLoggedin) {
    const category = await Category.find()
    res.render('adminviews/add-categoryoffer', { admin: true, category })
  }else{
    res.redirect('/login')
}

}



exports.saveCategoryOffer = async(req,res)=>{ 
  if (req.session.adminLoggedin) {
    const catid = req.body.catname;

    const categorydetails = await Category.findOne({ _id: ObjectId(catid) })
  
    const offerdetails = await catOffer({
      catId: ObjectId(catid),
      percentage: req.body.percent,
      offername: req.body.offer,
      fromDate: req.body.from,
      toDate: req.body.to,
  
      status: "Active",
      categoryname: categorydetails.category,
  
    })
    await offerdetails.save();
  
    const constdiscount = await Category.updateOne({ _id: ObjectId(catid) },
      { $set: { percentage: req.body.percent } })
  
  
    const pervalue = parseInt(req.body.percent) / 100
  
    let productUpdation = await Product.find({ category: categorydetails.category })
  

  
    await productUpdation.map(async (product) => {
      let actualPrice = product.price;
      let discountPrice = (product.price) * pervalue;
      let newPrice = actualPrice - discountPrice;
      newPrice = newPrice.toFixed()
  
  
      let prodata = await Product.updateMany({ _id: ObjectId(product._id) },
        {
          $set: {
            percentage: req.body.percent,
            discount: newPrice,
            realAmount: newPrice ? newPrice : product.price
          }
        })
  
  
    })
  
  
  
  
    res.redirect('/admin/view-all-catoffers')
  }else{
    res.redirect('/login')
}
}


exports.editCategoryOffer = async(req,res)=>{
  if (req.session.adminLoggedin) {
    const category = await Category.find({})
    const editdetails = await catOffer.findOne({ _id: req.params.id })
    res.render('adminviews/edit-categoryoffer', { admin: true, offerdetails: editdetails, category })
  }else{
    res.redirect('/login')
}
}



exports.saveEditedCategoryOffer = async(req,res)=>{// /save-edited-catoffer
  if (req.session.adminLoggedin) {
    const catofferdetails = await catOffer.updateOne({
        _id: req.body.catofferid
      }, {
        $set: {
          percentage: req.body.percent,
          offername: req.body.offer,
          fromDate: req.body.from,
          toDate: req.body.to,
          status: req.body.status
    
        }
    
      })
    
    
    
      const catupdation = await Category.updateOne({ category: req.body.catsname }, { $set: { percentage: req.body.percent } })
    
      const pervalue = parseInt(req.body.percent) / 100
    
      let productUpdation = await Product.find({ category: req.body.catsname })
    
    
      await productUpdation.map(async (product) => {
        let actualPrice = await product.price;
        let discountPrice = await (product.price) * pervalue;
        let newPrice = await actualPrice - discountPrice;
        newPrice = await newPrice.toFixed()
    
    
        let prodata = await Product.updateMany({ _id: ObjectId(product._id) },
          {
            $set: {
              percentage: req.body.percent,
              discount: newPrice,
              realAmount: newPrice ? newPrice : product.price
            }
          })
    
    
      })
    
    
      res.redirect('/admin/view-all-catoffers')

    }else{
      res.redirect('/login')
  }
}

exports.deleteCategoryOffer = async(req,res)=>{
  if (req.session.adminLoggedin) {
    const products = await catOffer.findOne({_id:req.params.id})
    const catproducts = await Product.find({category:products.categoryname})

   catproducts.map(async(thepro)=>{

    const findAllproduct = await Product.findOne({_id:thepro._id, category:thepro.category})

    const canceloffer = await Product.updateOne({_id:thepro._id, category:thepro.category},{$set:{percentage:0, discount:0, realAmount:thepro.price}})

  })
  
  const deletecatoffer = await catOffer.deleteOne({ _id: req.params.id })
  
    res.redirect('/admin/view-all-catoffers')
}else{
  res.redirect('/login')
}

}



exports.changeCategoryOfferStatus = async(req,res)=>{

  if (req.session.adminLoggedin) {
  const catofferId = req.body.catofferId;

  const catoffersStatus = await catOffer.updateOne({ _id: ObjectId(catofferId) }, { $set: { status: req.body.status} })

  


  const products = await catOffer.find({ _id: ObjectId(catofferId)})
  const productrt = await Product.find({})
 
products.map(async(thepro)=>{
  const product = await Product.findOne({category:thepro.categoryname})

 
  const canceloffer = await Product.updateOne({category:thepro.categoryname},{$set:{percentage:0, discount:0, realAmount:product.price}})
})

  const deletecatoffer = await catOffer.deleteOne({ status: 'Expired'},{ _id:  req.params.id })
}else{
  res.redirect('/login')
}
} 
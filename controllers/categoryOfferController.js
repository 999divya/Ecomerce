const catOffer = require('../models/catOfferSchema')
const Product = require('../models/productSchema')
const moment = require('moment');
const Category = require('../models/categorySchema');
const offer = require('../models/offerSchema')
var ObjectId = require('mongoose').Types.ObjectId;



exports.viewAllCategoryOffers = async(req,res)=>{ // /view-all-catoffers
    let today = new Date()
    const offerdetails1 = await catOffer.find({})
    let todate = moment(offerdetails1.toDate).format('YYYY-MM-DD')
    let fromdate = moment(offerdetails1.fromDate).format('YYYY-MM-DD')
    var to = new Date(todate);
    var from = new Date(fromdate); // gives 1486492200000
   
    const setOfferExpiry = await catOffer.updateMany({toDate:{$lt:today}},{$set:{status:"Expired", percentage:0}})
  
    const offerdetails = await catOffer.find({})
    res.render('adminviews/view-categoryoffers', { admin: true, offerdetails })
}


exports.addCategoryOffer = async(req,res)=>{// /add-category-offer

    const category = await Category.find()
    res.render('adminviews/add-categoryoffer', { admin: true, category })

}

exports.saveCategoryOffer = async(req,res)=>{

    const category = await Category.find()
    res.render('adminviews/add-categoryoffer', { admin: true, category })

}

exports.saveCategoryOffer = async(req,res)=>{ //  /save-category-offer

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
  
    // db.orders.update({
    //   "_id": ObjectId("56892f6065380a21019dc810")
    // }, {
    //   $set: {
    //       "wartoscEUR": {
    //           $multiply: ["wartoscPLN", 4]
    //       } { wartoscPLN: 4 }
    //   }
    // })  "perc": { "$multiply": [ { "$divide": ["$ctv","$count"] }, 100 ] },
  
    // const percent = parseInt(req.body.percent)/100
    const pervalue = parseInt(req.body.percent) / 100
    console.log('categorydetails.category,', categorydetails.category);
    let productUpdation = await Product.find({ category: categorydetails.category })
  
    console.log('productUpdation', productUpdation)
  
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
}


exports.editCategoryOffer = async(req,res)=>{
    const category = await Category.find({})
    const editdetails = await catOffer.findOne({ _id: req.params.id })
    res.render('adminviews/edit-categoryoffer', { admin: true, offerdetails: editdetails, category })
}


exports.saveEditedCategoryOffer = async(req,res)=>{// /save-edited-catoffer

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


}

exports.deleteCategoryOffer = async(req,res)=>{

    const products = await catOffer.find({_id:req.params.id})
    const product = await Product.find({})
   
  products.map(async(thepro)=>{
    const product = await Product.findOne({category:thepro.categoryname})
    const canceloffer = await Product.updateOne({category:thepro.categoryname},{$set:{percentage:0, discount:0, realAmount:product.price}})
  })
  
  const deletecatoffer = await catOffer.deleteOne({ _id: req.params.id })
  
  
  
  
    res.redirect('/admin/view-all-catoffers')

}



exports.changeCategoryOfferStatus = async(req,res)=>{

    
  const catofferId = req.body.catofferId;

  const catoffersStatus = await catOffer.updateOne({ _id: ObjectId(catofferId) }, { $set: { status: req.body.status} })

  


  const products = await catOffer.find({ _id: ObjectId(catofferId)})
  const productrt = await Product.find({})
 
products.map(async(thepro)=>{
  const product = await Product.findOne({category:thepro.categoryname})
  console.log('product', product);
  console.log('pricee', product.price);
 
  const canceloffer = await Product.updateOne({category:thepro.categoryname},{$set:{percentage:0, discount:0, realAmount:product.price}})
})

  const deletecatoffer = await catOffer.deleteOne({ status: 'Expired'},{ _id:  req.params.id })
} 
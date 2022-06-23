const offer = require('../models/offerSchema')
const order = require('../models/orderSchema')
var ObjectId = require('mongoose').Types.ObjectId;
const moment = require('moment')
const Product = require('../models/productSchema')
const Category = require('../models/categorySchema');
const catOfferSchema = require('../models/catOfferSchema');
const catOffer = require('../models/catOfferSchema')





exports.viewAllproductOffers = async(req,res)=>{ //  /view-all-offers
  if (req.session.adminLoggedin) {
    let today = new Date();
    // const offerdetails11 = await offer.find({});

    // var from = new Date(fromdate); // gives 1486492200000
  
    let offerdetails11 = await offer.find({ toDate: { $lte: new Date() } })
  if(offerdetails11){
    offerdetails11?.map(async(offz)=>{
      // let todate = moment(offz?.toDate).format('YYYY-MM-DD');
      // var to = new Date(todate);
      // const offerdetails1 = await offer.findOne({to:{$lt:today}});
   
    const products  = await Product.findOne({_id: ObjectId(offz.proId)})
    const findCategory = await catOffer.findOne({categoryname:products?.category})
    const percentage = findCategory?.percentage?findCategory.percentage:0    
    const discount = (offz.productprice) * parseInt(percentage) / 100;
    const newprice =  (offz.productprice) - discount;
    const realamount = newprice ? newprice : offz.productprice;
    const cancelproducts = await Product.updateOne({_id: ObjectId(offz.proId)},{$set:{percentage:percentage, discount:discount, realAmount:realamount}})
    const setOfferExpiry = await offer.deleteOne({_id:offz._id})
    
    })
    
  }



  const offerdetails = await offer.find({});
    res.render('adminviews/view-productoffers', { admin: true, offerdetails })
}else{
  res.redirect('/login')
}
}





exports.addNewProductOffer = async(req,res)=>{// /add-new-offer
  if (req.session.adminLoggedin) {
    const products = await Product.find({})
    res.render('adminviews/add-offers', { admin: true, products })
  }else{
    res.redirect('/login')
}
}


exports.saveNewProductOffer = async(req,res)=>{//  /save-new-offer
  if (req.session.adminLoggedin) {
    const proid = req.body.proname;

    let productdetails = await Product.findOne({ _id: ObjectId(proid) })
    let startDateIso = new Date(req.body.from)
  
    let endDateIso = new Date(req.body.to)

    let expiry = moment(req.body.to).format('YYYY-MM-DD')
    let starting = moment(req.body.from).format('YYYY-MM-DD')
  
    const offerdetails = await offer({
      proId: ObjectId(proid),
      percentage: req.body.percent,
      offername: req.body.offer,
      fromDate: starting,
      toDate: expiry,
      status: req.body.status,
      productname: productdetails.name,
      productprice: productdetails.price
  
    })
    await offerdetails.save()
  
    const discount = productdetails.price * parseInt(req.body.percent) / 100;
    const newprice = productdetails.price - discount;
    const realamount = newprice ? newprice : productdetails.price;
  
    const updateProdb = await Product.updateOne({
      _id: ObjectId(proid)
    },
      {
        $set: {
          percentage: req.body.percent,
          discount: newprice,
          realAmount: realamount
        }
      })
  
  
    // const offerss = await offer.aggregate([{
    //   $lookup:{
    //     from:'products',
    //     localField:'proId',
    //     foreignField:'_id',
    //     as:'prodetails'
    //   }
    // }])
  
    // const offers = await offer.find({}).sort({})
  
    // res.render('adminviews/view-productoffers',{admin:true, offerdetails:offers})
    res.redirect('/admin/view-all-offers')
  }else{
    res.redirect('/login')
}
}



exports.editProductOffers = async(req,res)=>{ //  /edit-offers/:id
  if (req.session.adminLoggedin) {
    const products = await Product.find({})
    const editdetails = await offer.findOne({ _id: req.params.id })
    res.render('adminviews/edit-offers', { admin: true, offerdetails: editdetails, products })
  }else{
    res.redirect('/login')
}
}


exports.saveEditedProductOffers = async(req,res)=>{
  if (req.session.adminLoggedin) {
    const offerdetails = await offer.updateOne({
        _id: req.body.offerid
    
      }, {
        $set: {
          percentage: req.body.percent,
          offername: req.body.offer,
          fromDate: req.body.from,
          toDate: req.body.to,
          status: req.body.status,
    
        }
    
      }
    
      );
    
    
    
    
    
    
      const discount = req.body.productprice * parseInt(req.body.percent) / 100;
      const newprice = req.body.productprice - discount;
      const realamount = newprice ? newprice : req.body.productprice;
    
    
      const updateProdb = await Product.updateOne({
        _id: ObjectId(req.body.proId)
      },
        {
          $set: {
            percentage: req.body.percent,
            discount: newprice,
            realAmount: realamount
          }
        })
    
    
      res.json({ status: true, offerdetails })

      }else{
        res.redirect('/login')
    }

}



exports.deleteProductOffers = async(req,res)=>{ //  /delete-offer/:id
  if (req.session.adminLoggedin) {

    const findOffer = await offer.findOne({_id: req.params.id })
    const products  = await Product.findOne({_id: ObjectId(findOffer.proId)})
    const findCategory = await catOffer.findOne({categoryname:products?.category})
    const percentage = findCategory?.percentage?findCategory.percentage:0        

    const discount = (findOffer.productprice) * parseInt(percentage) / 100;
    const newprice =  (findOffer.productprice) - discount;
    const realamount = newprice ? newprice : findOffer.productprice;

   
    const cancelproducts = await Product.updateOne({_id: ObjectId(findOffer.proId)},{$set:{percentage:percentage, discount:discount, realAmount:realamount}})
    
    
    const deleteoffer = await offer.deleteOne({ _id: req.params.id })
    
    
    
      res.redirect('/admin/view-all-offers')

  }else{
    res.redirect('/login')
}
}


exports.changeProductOfferStatus = async(req,res)=>{ // /change-prodoffer-status/:id
  if (req.session.adminLoggedin) {
    
  const prodofferId = req.body.prodofferId;

  const proId = req.body.proId;
 
  const offerdetails = await offer.findOne({_id: ObjectId(req.body.prodofferId)});
  const products  = await Product.findOne({_id: ObjectId(offerdetails.proId)})
  const productofferStatusUpdate = await offer.updateOne({_id:ObjectId(req.body.prodofferId)},{$set:{status:req.body.status}});

  
  const findCategory = await catOffer.findOne({categoryname:products?.category})
  
  const percentage = findCategory.percentage?findCategory.percentage:0

  const discount = (offerdetails.productprice) * parseInt(percentage) / 100;
  const newprice =  (offerdetails.productprice) - discount;
  const realamount = newprice ? newprice : products.price;


  
  
  const productstatusupdate = await Product.updateOne({_id:ObjectId(offerdetails.proId)},{$set:{percentage:percentage, discount:discount,realAmount:realamount}});

  const deleteoffer = await offer.deleteOne({status:'Expired'},{_id:ObjectId(req.body.prodofferId)})
  }else{
    res.redirect('/login')
}
}
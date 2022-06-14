const offer = require('../models/offerSchema')
const order = require('../models/orderSchema')
var ObjectId = require('mongoose').Types.ObjectId;
const moment = require('moment')
const Product = require('../models/productSchema')
const Category = require('../models/categorySchema');


exports.viewAllproductOffers = async(req,res)=>{ //  /view-all-offers

    let today = new Date();
    const offerdetails11 = await offer.find({});
    let todate = moment(offerdetails11?.toDate).format('YYYY-MM-DD');
    let fromdate = moment(offerdetails11?.fromDate).format('YYYY-MM-DD');
    var to = new Date(todate);
    var from = new Date(fromdate); // gives 1486492200000
    console.log("this is from",from);
    console.log("this is today",today);
    console.log("this is to",to);
  
  
    const offerdetails1 = await offer.find({$and:[{to:{$lt:today}}, {from:{$gt:today}}]});
   
    offerdetails1?.map(async(offer)=>{
      const setOfferExpiry = await offer.updateOne({_id:offer._id},{$set:{status:"Expired"}})
      // const offerdetails2 = await offer.findOne({status:"Expired"})
      // const deleteOne = await offer.deleteOne({_id:offer._id});
    })
   
    const offerdetails = await offer.find({});
    res.render('adminviews/view-productoffers', { admin: true, offerdetails })


}


exports.addNewProductOffer = async(req,res)=>{// /add-new-offer
    const products = await Product.find({})
    res.render('adminviews/add-offers', { admin: true, products })
}


exports.saveNewProductOffer = async(req,res)=>{//  /save-new-offer
    const proid = req.body.proname;

    let productdetails = await Product.findOne({ _id: ObjectId(proid) })
    let startDateIso = new Date(req.body.from)
  
    let endDateIso = new Date(req.body.to)
    console.log(startDateIso);
    console.log(endDateIso);
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
}



exports.editProductOffers = async(req,res)=>{ //  /edit-offers/:id
    const products = await Product.find({})
    const editdetails = await offer.findOne({ _id: req.params.id })
    res.render('adminviews/edit-offers', { admin: true, offerdetails: editdetails, products })
}


exports.saveEditedProductOffers = async(req,res)=>{

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



}



exports.deleteProductOffers = async(req,res)=>{ //  /delete-offer/:id


    const findOffer = await offer.findOne({_id: req.params.id })

    // const products  = await Product.findOne({})
    
    const cancelproducts = await Product.updateOne({_id: ObjectId(findOffer.proId)},{$set:{percentage:0, discount:0, realAmount:findOffer.productprice}})
    
    
    const deleteoffer = await offer.deleteOne({ _id: req.params.id })
    
    
    
    
     
      // let discount=0;
      
      // const deleteoffer = await offer.deleteOne({ _id: req.params.id })
      // const prodet =await Product.findOne({_id: ObjectId(findOffer.proId)})
    
      // const catoffer = await catOffer.findOne({categoryname :prodet.category})
    
      
      // if(catoffer){
      //   console.log('1')
      // const discount1 = prodet.price * parseInt(catoffer?.percentage) / 100;
      // discount = prodet.price - discount1;
     
    
      // }
      // console.log('2')
      // const productUpdation = await Product.updateOne({_id: ObjectId(findOffer.proId)},
      // {$set:{ percentage: catoffer.percentage?catoffer.percentage: 0,
      //   discount:discount,
      //   realAmount:discount ==0 ?findOffer.productprice:0 }})    
        
        
    
    
    
    
      res.redirect('/admin/view-all-offers')


}


exports.changeProductOfferStatus = async(req,res)=>{ // /change-prodoffer-status/:id

    
  const prodofferId = req.body.prodofferId;

  const proId = req.body.proId;

  const offerdetails = await offer.findOne({_id: ObjectId(req.body.prodofferId)});
 
  const productofferStatusUpdate = await offer.updateOne({_id:ObjectId(req.body.prodofferId)},{$set:{status:req.body.status}});

  const productstatusupdate = await Product.updateOne({_id:ObjectId(offerdetails.proId)},{$set:{percentage:0, discount:0,realAmount:offerdetails.productprice}});

  const deleteoffer = await offer.deleteOne({status:'Expired'},{_id:ObjectId(req.body.prodofferId)})
}
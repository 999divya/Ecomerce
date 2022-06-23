const express = require('express');
const route = express.Router();
const categoryController = require('../../controllers/categoryController');
const productController = require('../../controllers/productController');
const userController = require('../../controllers/userController');
const Category = require('../../models/categorySchema');
const user = require('../../models/userSchema');
const path = require('path');
// const categorySchema = require('../../models/categorySchema');
const orderController = require('../../controllers/orderController');

const { Route } = require('express');
const Product = require('../../models/productSchema')
// const offer = require('../../models/offerSchema')
const order = require('../../models/orderSchema')
// const catOffer = require('../../models/catOfferSchema')
// const Coupon = require('../../models/couponSchema')

// const moment = require('moment');
var ObjectId = require('mongoose').Types.ObjectId;



// const adminLoggedin = (req, res, next) => {

//   // const user = await user.findOne({})
//   // req.session.admin =user;
//   req.session.adminLoggedin = true;
//   if (req.session.adminLoggedin) {
//     if (!req.user) {
//       res.header(
//           "cache-control",
//           "private,no-cache,no-store, must-revalidate"
//       )
//       res.header("Expires","-1")
//       res.header("Pragma","no-cache")
//   }
//     next()
//   } else {
//     res.redirect('/login');
//   }
// }


// route.get('/',(req,res)=>{
//   if (req.session.adminLoggedin) {
//   res.render('adminviews/dashboard',{admin:true})
//   }
// })


route.get('/', async (req, res) => {

  if (req.session.adminLoggedin) {
  let totalorders = await order.find().count()
  let totalusers = await user.find().count()
  let totalproducts = await Product.find().count()
  let totalincomes = await order.aggregate([
    {
      $match: {
        status: "Deliverd"
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$totalAmount" }
      }
    }
  ])


  const totalincome = totalincomes[0]?.total;

  res.render('adminviews/dashboard', { admin: true, totalorders, totalincome, totalusers, totalproducts })

  }else{
    res.redirect('/login')
}

})



route.get('/view-users', userController.showAllUsers);
route.get('/user-search', userController.userSearch);
route.get('/blockEachUser/:id', userController.userBlockHandler);




route.get('/search-category',  categoryController.searchCategory);
route.post('/view-Category', categoryController.createNewCategory);
route.get('/editEachCategory/:id',  categoryController.editEachCategory);
route.get('/deleteEachCategory/:id', categoryController.deleteEachCategory);


route.get('/add-category',  async (req, res) => {
  if (req.session.adminLoggedin) {
  res.render('adminviews/add-category', { admin: true });
  }else{
    res.redirect('/login')
}
});



route.get('/view-category',  async (req, res) => {
  try {
    if (req.session.adminLoggedin) {
    const Categorys = await Category.find().sort({ _id: -1 });

    res.render('adminviews/view-category', { admin: true, categoryList: Categorys });
    }else{
      res.redirect('/login')
  }
  } catch (error) {
    console.log(error.message);
  }

});


route.get('/add-products', async (req, res) => {
  if (req.session.adminLoggedin) {

  const Categorys = await Category.find().exec();

  res.render('adminviews/add-products', { admin: true, categoryList: Categorys })
  }else{
    res.redirect('/login')
}
});


route.get('/search-products', productController.searchProducts);
route.get('/edit-products/:id', productController.editEachProducts);
route.get('/view-products', productController.showAllProducts);
route.post('/view-products', productController.productHandler);
route.get('/deleteEachProduct/:id', productController.deleteEachProduct);

route.get('/view-products', (req, res) => {
  if (req.session.adminLoggedin) {
  res.render('adminviews/view-products', { admin: true })
  }
});


// route.get('/view-orders',(req,res)=>{
//     res.render('adminviews/view-orders',{admin:true})
// })

route.get('/view-orders',orderController.handleOrders)
route.get('/cancelEachOrder/:id', orderController.cancelOrders)

route.get('/show-products/:id', orderController.displayOrderedProducts)

route.post('/change-delivery-status', orderController.deliveryStatus)


//*********************************************************************** 


const categoryOfferController = require('../../controllers/categoryOfferController')

route.get('/view-all-catoffers', categoryOfferController.viewAllCategoryOffers)



route.get('/add-category-offer', categoryOfferController.addCategoryOffer)


route.post('/save-category-offer',  categoryOfferController.saveCategoryOffer)

route.get('/edit-category-offer/:id', categoryOfferController.editCategoryOffer)


route.post('/save-edited-catoffer', categoryOfferController.saveEditedCategoryOffer)


route.get('/delete-catOffer/:id', categoryOfferController.deleteCategoryOffer)



route.post('/change-catoffer-status', categoryOfferController.changeCategoryOfferStatus)




//******************************************************************* 

const productOfferController = require('../../controllers/productOfferController')



route.get('/view-all-offers', productOfferController.viewAllproductOffers)

route.get('/add-new-offer', productOfferController.addNewProductOffer)

route.post('/save-new-offer',productOfferController.saveNewProductOffer)

route.get('/edit-offers/:id', productOfferController.editProductOffers)

route.post('/save-editedoffers', productOfferController.saveEditedProductOffers)

route.get('/delete-offer/:id', productOfferController.deleteProductOffers)

route.post('/change-prodoffer-status', productOfferController.changeProductOfferStatus)

//******************************************************* 

const salesController = require('../../controllers/salesController')

route.get('/sales-report',salesController.salesReport )

route.post('/save-report',salesController.saveReport)

route.get('/get-sales-details', salesController.getChartDetails)


//**********************************************************
const couponController = require('../../controllers/couponController')


route.post('/change-coupon-status',couponController.changeCouponStatus);
// route.get('/all-coupon-users',(req,res)=>{
//   res.render('adminviews/view-all-couponusers',{admin:true})
// })

route.get('/all-coupon-users/:id', couponController.allCouponUsers)

route.get('/view-all-coupons',couponController.viewAllCoupons)


route.get('/add-new-coupon', couponController.addNewCoupon)

route.post('/save-coupon',  couponController.saveCoupon)



route.get('/delete-coupon/:id', couponController.deleteCoupon)
//********************************************************* 





module.exports = route;
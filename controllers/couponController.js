const Coupon = require('../models/couponSchema')
var ObjectId = require('mongoose').Types.ObjectId;
const Product = require('../models/productSchema')
const moment = require('moment');


exports.changeCouponStatus = async(req,res)=>{ // /change-coupon-status

    const couponId = req.body.couponId;

    const couponstatus = await Coupon.updateOne({ _id: ObjectId(couponId) }, { $set: { status: req.body.status } })
  
}


exports.viewAllCoupons = async(req,res)=>{ //  /view-all-coupons

    let coupondata = await Coupon.find({})
  res.render('adminviews/view-coupon', { admin: true, coupondata })
}

exports.addNewCoupon = async(req,res)=>{//   /add-new-coupon

    res.render('adminviews/add-coupon', { admin: true, })

}

exports.saveCoupon = async(req,res)=>{

    let starting = await moment(req.body.from).format('YYYY-MM-DD');
    let expiry = await moment(req.body.to).format('YYYY-MM-DD');
  
    let coupondata = await Coupon({
  
      couponcode: req.body.coupon,
      fromDate: starting,
      toDate: expiry,
      percentage: req.body.percent,
      status: "Active",
      users: []
    })
  
    await coupondata.save();
    res.redirect('/admin/view-all-coupons')
  
    // res.render('adminviews/view-coupen',{admin:true, coupendata })
  

}

exports.deleteCoupon = async(req,res)=>{//  /delete-coupon/:id
    const deletecoupon = await Coupon.deleteOne({ _id: req.params.id })
    res.redirect('/admin/view-all-coupons')
}

exports.applyCoupon = async(req,res)=>{



    if(req.session.isLoggedin){

        let userid = req.session.user._id;
      
        let totalamount = req.session.totalvalue;
        var data = req.body;
    
        let obj = {}
        let date = new Date()
        // date = moment(date).format('YYYY-MM-DD')
        let coupon = await Coupon.findOne({ couponcode: data.coupon })
    
        // console.log('date'+date)
        // console.log('fromdate'+coupon.fromDate)
        // console.log('todate'+coupon.toDate)
    
        if (coupon) {
            let todate = moment(coupon.toDate).format('YYYY-MM-DD')
            let fromdate = moment(coupon.fromDate).format('YYYY-MM-DD')
            var today = new Date(); // 1501653935994
            var from = new Date(fromdate); // gives 1486492200000
            var to = new Date(todate);
            
                console.log('date', today)
                console.log('fromdate', from)
                console.log('todate', to)
            
            let users = coupon.users
            console.log("findall the users" + users)
    
            let userChecker = users.includes(ObjectId(userid))
    
            if (userChecker) {
                console.log('userChecker', userChecker)
                //obj.couponUsed = true;
                res.json({ status: false, total: req.session.totalvalue, err: 'coupon already used' });
    
                // res.json({ status: true, total: req.session.totalvalue });
    
                // res(obj)
            } else if (today >= from && today <= to) {
    
    
    
    
                // if (date <= todate && date >= fromdate) {
    
                let total = parseInt(totalamount)
                let percentage = parseInt(coupon.percentage)
                let discountVal = ((total * percentage) / 100).toFixed()
                obj.total = total - discountVal
                obj.success = true
                obj.percentage = percentage
    
                await Coupon.updateOne({
                    _id: ObjectId(coupon._id),
                }, { $push: { users: ObjectId(userid) } })
    
                // res(obj)
                // } else {
                //     obj.couponExpired = true
    
                //     // res(obj)
                // }
    
                req.session.totalvalue = obj.total;
                
                res.json({ status: true, total: req.session.totalvalue, err: 'coupon successfully applied' });
            }
            else {
                res.json({ status: false, total: req.session.totalvalue, err: 'Coupen expired' });
            }
        } else {
            obj.invalidCoupon = true
            //res(obj)
    
            // console.log('obj cooupen', obj);
    
            res.json({ status: false, total: req.session.totalvalue, err: 'Invalid coupon' });
    
        }
    
    
        // console.log('llololololol')
        // if (req.session.isLoggedin) {
    
        //     // const money = req.session.totalvalue;
        //     var obj = {};
    
    
        //     let getcoupon = await Coupon.findOne({ couponcode: req.body.coupon })
        //     console.log("jjjjjjjjjjjjjjjiiiiiiiiiii"+getcoupon);
        //     if (getcoupon.users.includes(ObjectId(req.session.user._id))) {
    
        //         obj.couponUsed = true;
        //         res.json({status:true});
        //     }else{
        //         let date = new Date()
        //         date = moment(date).format('YYYY-MM-DD')
        //         let to = getcoupon.toDate;
        //         let from = getcoupon.fromDate;
        //         from = moment(from).format('YYYY-MM-DD')
        //         to = moment(to).format('YYYY-MM-DD')
    
        //         if(from<date && to>date){
    
        //             const totalprice = req.session.totalvalue;
        //             const differce = totalprice * getcoupon.percentage/100;
        //             const totalvalue = totalprice-differce;
        //             req.session.totalvalue = totalvalue;
        //             console.log("iiiiiiiiioooooooooo",totalvalue);
    
    
        //             res.json({status:true, totalvalue:109});
        //         }
    
        //     }
    
        //     }
    }



}
const Coupon = require('../models/couponSchema')
var ObjectId = require('mongoose').Types.ObjectId;
const Product = require('../models/productSchema')
const moment = require('moment');
const user = require('../models/userSchema');
const couponData = require('../models/couponHistorySchema')


exports.changeCouponStatus = async (req, res) => { // /change-coupon-status
    if (req.session.adminLoggedin) {
        const couponId = req.body.couponId;

        const couponstatus = await Coupon.updateOne({ _id: ObjectId(couponId) }, { $set: { status: req.body.status } })
    } else {
        res.redirect('/login')
    }

}


exports.viewAllCoupons = async (req, res) => { //  /view-all-coupons
    if (req.session.adminLoggedin) {
        let coupondata = await Coupon.find({})
        res.render('adminviews/view-coupon', { admin: true, coupondata })
    } else {
        res.redirect('/login')
    }
}

exports.addNewCoupon = async (req, res) => {//   /add-new-coupon
    if (req.session.adminLoggedin) {
        res.render('adminviews/add-coupon', { admin: true, })
    } else {
        res.redirect('/login')
    }

}

exports.saveCoupon = async (req, res) => {
    if (req.session.adminLoggedin) {
        let starting = await moment(req.body.from).format('YYYY-MM-DD');
        let expiry = await moment(req.body.to).format('YYYY-MM-DD');



        const duplicateCode = await Coupon.findOne({
            couponcode: req.body.coupon
        }).exec();
      

        if (duplicateCode) {
            // res.json({ status:false, message: 'Coupon code already exits, try new'})
            res.render('adminviews/add-coupon',{admin:true, message: 'Coupon code already exits, try new'})
        } else{
            
            var coupondata = await Coupon({
                couponcode: req.body.coupon,
                fromDate: starting,
                toDate: expiry,
                percentage: req.body.percent,
                status: "Active",
                users: []
            })

            await coupondata.save();
            // res.json({status:true})
            res.redirect('/admin/view-all-coupons')
        }

     

    

    
        // res.render('adminviews/view-coupen',{admin:true, coupendata })
    } else {
        res.redirect('/login')
    }

}




exports.deleteCoupon = async (req, res) => {//  /delete-coupon/:id
    if (req.session.adminLoggedin) {
        const deletecoupon = await Coupon.deleteOne({ _id: req.params.id })
        res.redirect('/admin/view-all-coupons')
    } else {
        res.redirect('/login')
    }
}

exports.applyCoupon = async (req, res) => {



    if (req.session.isLoggedin) {

        let userid = req.session.user._id;

        let totalamount = req.session.totalvalue;
        let incomingtotal = req.session.totalvalue;
        req.session.incomingtotal = incomingtotal;
        var data = req.body;

        let obj = {}
        let date = new Date()
        // date = moment(date).format('YYYY-MM-DD')
        let coupon = await Coupon.findOne({ couponcode: data.coupon })

        let usercheck = await Coupon.findOne({ couponcode: data.coupon, users: { $elemMatch: { users: ObjectId(userid) } } })

      

        if (coupon) {
            let todate = moment(coupon.toDate).format('YYYY-MM-DD')
            let fromdate = moment(coupon.fromDate).format('YYYY-MM-DD')
            var today = new Date(); // 1501653935994
            var from = new Date(fromdate); // gives 1486492200000
            var to = new Date(todate);

            var todays = Date.now();
            var appliedDate = moment(todays).format('YYYY-MM-DD')
            var objUser = { users: ObjectId(userid), appliedDate: appliedDate }



            if (usercheck) {

                //obj.couponUsed = true;
                res.json({ status: false, total: req.session.totalvalue, err: 'coupon already used' });

                // res.json({ status: true, total: req.session.totalvalue });

                // res(obj)
            } else if (today >= from && today <= to) {


                // if (date <= todate && date >= fromdate) {

                let total = parseInt(totalamount)
                let percentage = parseInt(coupon.percentage)
                let couponcode = coupon.couponcode;

                let discountVal = ((total * percentage) / 100).toFixed()



                obj.total = total - discountVal
                obj.success = true
                obj.percentage = percentage


                // var objUser = {users:ObjectId(userid), appliedDate:appliedDate, discount:discountVal }
                objUser.discount = discountVal;

                req.session.couponid = coupon._id;
                req.session.couponuser = objUser;






                // res(obj)
                // } else {
                //     obj.couponExpired = true

                //     // res(obj)
                // } 
                req.session.couponpercent = percentage;
                req.session.coupondiscount = discountVal;
                req.session.coupontotalvalue = obj.total;
                req.session.couponcode = couponcode;




                res.json({ status: true, coupondiscount: req.session.coupondiscount, couponpercent: req.session.couponpercent, total: obj.total, err: 'coupon successfully applied' });
            }
            else {
                res.json({ status: false, total: req.session.totalvalue, err: 'Coupen expired' });
            }
        } else {
            obj.invalidCoupon = true
 

            res.json({ status: false, total: req.session.totalvalue, err: 'Invalid coupon' });

        }



    } else {
        res.redirect('/login')
    }



}



exports.allCouponUsers = async (req, res) => {
    if (req.session.adminLoggedin) {

        const couponusers = await Coupon.aggregate([
            {
                $match: { _id: ObjectId(req.params.id) }
            },

            { $unwind: "$users" },


            {
                $lookup: {
                    from: 'users',
                    localField: 'users.users',
                    foreignField: '_id',
                    as: 'userinfo'
                }
            }


        ])


        res.render('adminviews/view-all-couponusers', { admin: true, couponusers })
    } else {
        res.redirect('/login')
    }




}


// const couponhistory = require('../')


exports.couponHistory = async (req, res) => {

    if (req.session.isLoggedin) {
        const userId = req.session.user._id;
        const findcouponhistory = await couponData.find({ user: ObjectId(userId) }).sort({_id:-1})
        res.render('userviews/couponhistory', { findcouponhistory, userdetails: req.session.user })
    }
}
const order = require('../models/orderSchema')
const moment = require('moment')





exports.salesReport = async(req,res)=>{ //  /sales-report

    let today = new Date();

    let end = moment(today).format("YYYY/MM/DD");
  
    let start = moment(end).subtract(30, "days").format("YYYY/MM/DD");
  
    let orderSuccess = await order
      .find({ date: { $gte: start, $lte: end }, status: { $ne: "Cancelled" } })
    //   .toArray();
  
    let orderTotal = await order
      .find({ date: { $gte: start, $lte: end } })
    //   .toArray();
    let orderSuccessLength = orderSuccess.length;
    let orderTotalLength = orderTotal.length;
    let orderFailLength = orderTotalLength - orderSuccessLength;
  
    let total = 0;
    let paypal = 0;
    let razorpay = 0;
    let cod = 0;
    for (let i = 0; i < orderSuccessLength; i++) {
      total = total + orderSuccess[i].totalAmount;
      if (orderSuccess[i].paymentMethod == "COD") {
        cod++;
      }
    }
  
    var data = {
      start: start,
      end: end,
      totalOrders: orderTotalLength,
      successOrders: orderSuccessLength,
      failedOrders: orderFailLength,
      totalSales: total,
      cod: cod,
      paypal: paypal,
      razorpay: razorpay,
      currentOrders: orderSuccess
    }
  
    res.render('adminviews/report', { admin: true, data })


}


exports.saveReport = async(req,res)=>{ //   /save-report

    let end = moment(req.body.EndDate).format('YYYY/MM/DD')
    let start = moment(req.body.StartDate).format('YYYY/MM/DD')
  
    let orderSuccess = await order
      .find({ date: { $gte: start, $lte: end }, status: { $ne: "Cancelled" } })
    //   .toArray();
  
    let orderTotal = await order
      .find({ date: { $gte: start, $lte: end } })
    //   .toArray();
    let orderSuccessLength = orderSuccess.length;
    let orderTotalLength = orderTotal.length;
    let orderFailLength = orderTotalLength - orderSuccessLength;
  
    let total = 0;
    let paypal = 0;
    let razorpay = 0;
    let cod = 0;
    for (let i = 0; i < orderSuccessLength; i++) {
      total = total + orderSuccess[i].totalAmount;
      if (orderSuccess[i].paymentMethod == "COD") {
        cod++;
      }
    }
  
    var data = {
      start: start,
      end: end,
      totalOrders: orderTotalLength,
      successOrders: orderSuccessLength,
      failedOrders: orderFailLength,
      totalSales: total,
      cod: cod,
      paypal: paypal,
      razorpay: razorpay,
      currentOrders: orderSuccess
    }
  
  
    res.render('adminviews/report', { admin: true, data })

}
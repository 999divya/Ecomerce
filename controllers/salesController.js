const order = require('../models/orderSchema')
const moment = require('moment')





exports.salesReport = async(req,res)=>{ //  /sales-report
  if (req.session.adminLoggedin) {

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

  }else{
    res.redirect('/login')
}
}


exports.saveReport = async(req,res)=>{ //   /save-report
  if (req.session.adminLoggedin) {
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
  }else{
    res.redirect('/login')
}
}







exports.getChartDetails=async(req,res)=>{

  if (req.session.adminLoggedin) {
  let dailySale = await order.aggregate([

    {
      $match: {
          status: "Deliverd"
      }
  },

  {
      $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$dateIso" } },
          totalAmount: { $sum: "$totalAmount" },
          count: { $sum: 1 }
      }
  },
  {
      $sort: { _id: -1 }
  },
  {
      $limit: 7
  }


  ])

  // res.json(dailySale)

   



//current day sale
let currentDate = new Date()
currentDate = currentDate.toISOString().split('T')[0]


let todaySale  = await order.aggregate([


  {
    $match: {
        status: "Deliverd"
    }
},
{
    $project: {
        date: { $dateToString: { format: "%Y-%m-%d", date: "$dateIso" } }, totalAmount: 1
    }
},
{
    $match: { dateIso: currentDate }
},
{
    $group: {
        _id: "$dateIso",
        total: { $sum: "$totalAmount" },

    }
}



])

let data = 0
todaySale.map(val => data = val.total)
// res.json(data)





//CURRENT YEAR SALE
let curDate = new Date()
let currentYear = curDate.getFullYear();
currentYear = currentYear + ""


let yearlySale = await order.aggregate([

  {
    $match: {
        status: "Deliverd"
    }
},
{
    $project: {
        dateIso: { $dateToString: { format: "%Y", date: "$dateIso" } }, totalAmount: 1
    }
},

{
    $group: {
        _id: "$dateIso",
        total: { $sum: "$totalAmount" },

    }
}

])


// res.json(yearlySale)




//CURRENT MONTH SALE

let currentmonthSale = await order.aggregate([
  {
      $match: {
          "status": "Deliverd"
      }
  },

  {
      $group: {
          _id: { $dateToString: { format: "%Y-%m", date: '$dateIso' } },
          totalAmount: { $sum: "$totalAmount" },
          count: { $sum: 1 }
      }
  },
  {
      $sort: { _id: -1 }
  },

])

// res.json(currentmonthSale)


res.json({currentmonthSale, dailySale, data, yearlySale})

  }else{
    res.redirect('/login')
}
}



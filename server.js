require('dotenv').config()
const express = require('express');
const path = require('path');
const hbs = require('express-handlebars');
const bodyParser = require('body-parser');
// const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const fileUpload = require('express-fileupload');
const swal = require('sweetalert2');
const { v4: uuidv4 } = require('uuid');
const createReferal = require("referral-code-generator");
// const morgan = require('morgan');
const connectDB = require('./config/dbConn');
const methodOverride = require('method-override')
const adminRouter = require('./routes/adminRoutes/adminroute');
const userRouter = require('./routes/userRoutes/userroute');
const loginRouter = require('./routes/loginroute');
// const otpRouter = require('./routes/otproute');
const registerRouter = require('./routes/registerroute');
const logoutController = require('./routes/logoutroute')
const handlebars = require('handlebars');
const moment  = require('moment')
const niceInvoice = require("nice-invoice");

handlebars.registerHelper("multiply", function(a, b) {
    return parseInt(a) * parseInt(b);
  });
  handlebars.registerHelper("discountsubstract", function(a, b) {
    let discountprice=parseInt(a) * parseInt(b)/100;
    return parseInt(a) - discountprice;
  });

  handlebars.registerHelper("percentage", function(a, b) {
    return parseInt(a) * parseInt(b)/100;
  });

  handlebars.registerHelper('index_of', function(context,ndx) {
    return context[ndx];
  });

  handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
    return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});

handlebars.registerHelper('ifNoteCancelled', function(arg1, options) {

  return (arg1!= 'cancelled') ? options.fn(this) : options.inverse(this)

});



  handlebars.registerHelper("time", function(date) {
    let datestr = moment(date).format('YYYY-MM-DD')
    return datestr;
  });

  handlebars.registerHelper("check", function(value) {
   if(value==null||value==undefined||value==''){
     return '';
   }else{
    return value+"%";
   }
  });

  handlebars.registerHelper('hasDiscountPrice', function( arg1, options) {
   let arg = 0
    if(arg1!=null){
     arg= parseInt(arg1);
   }

    return (arg!= 0) ? options.fn(this) : options.inverse(this);
});




const app = express();

const PORT = process.env.PORT||4500;

// for parsing application/json
//returns a middleware that only parses json
app.use(bodyParser.json());

// for parsing application/xwww-
app.use(bodyParser.urlencoded({ extended: true }))
// app.use(cookieParser());

// app.use(morgan('tiny'));
// override with the X-HTTP-Method-Override header in the request
app.use(methodOverride('_method'));

app.use((req, res, next) => {
    if (!req.user) {
        res.header(
            "cache-control",
            "private,no-cache,no-store, must-revalidate"
        )

        res.header("Expires","-1")
        res.header("Pragma","no-cache")

    }
    next()
})


//connect to the mongodb
connectDB();




// app.use((req,res,next)=>{
//   req.locals.message1=req.session.message1
//   delete req.session.message1
//   next()
// })





app.set('views', path.join(__dirname,'views'))
app.set('view engine', 'hbs')
app.engine('hbs',hbs.engine({helpers: {

    inc: function (value, options) {
  
        return parseInt(value) + 1;
  
    }
  },
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true
      },
   
    extname:'hbs', 
    defaultLayout:'layout',
    layoutsDir:__dirname+'/views/layout/',
    partialsDir:__dirname+'/views/partials/'
})
);
//serving static files
app.use('/css', express.static(path.join(__dirname,'public/adminassets/css')));


app.use('/fonts', express.static(path.join(__dirname,'public/adminassets/fonts')));
app.use('/images', express.static(path.join(__dirname,'public/adminassets/images')));
app.use('/js', express.static(path.join(__dirname,'public/adminassets/js')));
app.use('/libs', express.static(path.join(__dirname,'public/adminassets/libs')));




app.use('/public/adminassets/category_Img', express.static(path.join(__dirname,'public/adminassets/category_Img')));
app.use('/public/adminassets/product_Img', express.static(path.join(__dirname,'public/adminassets/product_Img')));



app.use('/userasset', express.static(path.join(__dirname,'public/userassets/')));
// app.use('/hfonts', express.static(path.join(__dirname,'public/userassets/fonts/')));
// app.use('/hfonts', express.static(path.join(__dirname,'public/userassets/fonts')));
// app.use('/himages', express.static(path.join(__dirname,'public/userassets/images')));
// app.use('/hjs', express.static(path.join(__dirname,'public/userassets/js')));


app.use(fileUpload());

//session middleware
app.use(
    session({
        secret: uuidv4(),
        resave: false,
        saveUninitialized: true,
        // cookie:{maxAge:600000}
    })
)


app.use('/', userRouter);
app.use('/admin', adminRouter);
app.use('/login', loginRouter);

app.use('/register', registerRouter);
app.use('/logout', logoutController);


mongoose.connection.once('open', () => {
    console.log('connected to mongodb');
    app.listen(PORT, () => console.log(`Listening to ${PORT}`));//http server
})
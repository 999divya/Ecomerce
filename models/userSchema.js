const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');
const { hash } = require('bcrypt');


const userSchema = new Schema({
    firstname:{
        type:String,
        required:true
    },
    lastname:{
        type:String,
        required:true
    },
    email:{
        type:String,
        allowNull:false,
        isEmail:true,
        isUnique:true,
        required:true
    },
    mobile:{
        type:Number,
        unique:true,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    referedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required:false
    },
    refer:{
        type:String,
    },
    wallet:{
        type:Number,
    },
    isActive:{
        type:Boolean
      },
    isAdmin:{
        type:Boolean,
    },
    uploadpic:String
  
});



userSchema.pre("save", async function(next){
    if(this.isModified("password")){
        const passwordHash = await bcrypt.hash(this.password, 10);
        this.password = passwordHash;
       
    }
    next();
})
module.exports= mongoose.model('User',userSchema);




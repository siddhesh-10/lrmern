require('dotenv').config();
const express =require("express");
const bodyParse=require("body-parser");
const ejs=require("ejs");
const mongoose=require("mongoose");

const bcrypt = require('bcrypt');
const saltRounds=10;

const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

const app=express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParse.urlencoded({
    extended : true
}));

//express session
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false,
 // cookie: { secure: true }
}))
app.use(passport.initialize());
app.use(passport.session());


mongoose.connect('mongodb://localhost:27017/lrtry',
  {
    useNewUrlParser: true
  }
);
//mongoose.set("useCreateIndex",true);

const userSchema =new mongoose.Schema( {
    email : String,
    password : String,
    secret :String
});

userSchema.plugin(passportLocalMongoose);
 
const User=new mongoose.model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/",function(req,res){
    res.render("home")
})

app.get("/login",function(req,res){
    res.render("login")
})

app.get("/register",function(req,res){
    res.render("register")
})
app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
  });
app.get("/secrets",function(req,res){
    if(req.isAuthenticated())
    {
        User.find({"secret" :{$ne:null} },function(err,users){
            if(err)
            {
                console.log(err);
            }
            else
            {
                console.log(users);
                if(users)
                {
                    res.render("secrets",{users : users});
                }
            }
        });
       
    }
    else
    {
        res.redirect("/login");
    }
})
app.get("/submit",function(req,res){
    if(req.isAuthenticated())
    {
        res.render("submit");
    }
    else
    {
        res.redirect("/login");
    }
})

app.post("/submit",function(req,res){
    const text=req.body.secret;
    User.findById(req.user.id,function(err,foundUser){
        if(err)
        {
            console.log(err);
        }
        else
        {
            if(foundUser)
            {
                foundUser.secret=text;
                foundUser.save(function(){
                    res.redirect("/secrets")
                })
            }

        }
    })
})





app.post("/register",function(req,res){
    // bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    //     // Store hash in your password DB.
    //     const newUser =new User({
    //         email : req.body.username,
    //         password :hash
    //     })
    //     newUser.save(function(err)
    //     {
    //         if(err)
    //         {
    //             console.log(err);
    //         }
    //         else{
    //             res.render("secrets");
    //         }
    //     })
    // });
    User.register({username : req.body.username},req.body.password, function(err,user){

        if(err)
        {
            console.log(err);
            res.redirect("/register");
        }
        else
        {
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            })
        }
    })
})
app.post("/login",function(req,res){
 
    //    const  userName=req.body.username;
    
    //   User.findOne({email:userName},function(err,foundUser)
    //   {
    //       if(err)
    //       {
    //           console.log(err);
    //       }
    //       else
    //       {
    //           if(foundUser)
    //           {
                 
    //               bcrypt.compare(req.body.password, foundUser.password).then(function(result) {
    //                 // result == true
    //                 if(result===true)
    //                 {
    //                     res.render("secrets");  
    //                 }
    //             });
    //           }
    //       }
    //   })
    const user=new User({
        password : req.body.password,
        username :req.body.username
    });
    req.login(user,function(err){
        if(err)
        {
            console.log(err);
            res.redirect("/login");
        }
        else
        {
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            })
        }
    })
       
})




app.listen(3000,function(){

    console.log("app started listening on port 3000");
})

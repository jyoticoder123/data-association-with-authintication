// const express = require('express');
// const app = express();
// const userModel = require('./models/user');
// const cookieParser = require('cookie-parser');
// const postModel = require("./models/post");
// const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');

// app.set("view engine", "ejs");
// app.use(express.json());
// app.use(express.urlencoded({extended: true}));
// app.use(cookieParser());

// app.get('/', (req, res) => {
//     res.render("index")

// })

// app.get('/login', (req, res) => {
//     res.render("login")

// })

// app.post('/login', async(req, res) => {

//     let{email, password} = req.body;

//     let user = await userModel.findOne({email});
//     if(!user) return res.status(500).send("something went wrong");
//     bcrypt.compare(password, user.password, function(err, result) {
//         if(result){ 
           
//             let token = jwt.sign({email:email, userid: user._id}, "shhhh");
//             res.cookie("token",token);
//             res.status(200).redirect("/profile");
        
//         } else res.redirect("/login")
       
//     })

    


// })

// app.post('/register', async(req, res) => {

//     let{email, password, username, name, age} = req.body;
//     let user = await userModel.findOne({email});
//     if(user) return res.status(500).send("user already registered");

//     bcrypt.genSalt(10, (err, salt) => {
//         bcrypt.hash(password, salt, async(err, hash) =>{
//             let user = await userModel.create({
//                 username,
//                 email,
//                 name,
//                 age,
//                 password:hash
//             });

//             let token = jwt.sign({email:email, userid: user._id}, "shhhh");
//             res.cookie("token",token);
//             res.send("registered")
//         })
//     })

// })

// app.get("/profile", isLoggedIn, async(req, res) => {
//     let user = await userModel.findOne({email:req.user.email}).populate("posts")
   
//     res.render("profile", {user});
// })

// app.get("/post", isLoggedIn, async(req, res) => {
//     let user = await userModel.findOne({email:req.user.email})
//     let{content} = req.body;

//     let post = await postModel.create({
//         user: user._id,
//         content:content
//     })

//     user.posts.push(post._id);
//     await user.save();
//     res.redirect("/profile")
// })

// app.get("/logout", (req, res) => {
//     res.cookie("token", "")
//     res.redirect("/login")
// })

// function isLoggedIn(req, res, next) {
//     if(req.cookies.token === "") res.redirect("/login");
//     else{
//         let data = jwt.verify(req.cookies.token, "shhhh");
//         req.user = data;
//         next();

//     }
        
// }

// app.listen(3000);




const express = require('express');
const app = express();
const userModel = require('./models/user');
const cookieParser = require('cookie-parser');
const postModel = require("./models/post");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const path = require('path');

const upload = require('./config/multerconfig');


app.set("view engine", "ejs");
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());




// Middleware function to check if the user is logged in
function isLoggedIn(req, res, next) {
    const token = req.cookies.token;

    if (!token) {
        return res.redirect("/login");
    }

    jwt.verify(token, "shhhh", (err, data) => {
        if (err) {
            console.error("JWT verification failed:", err);
            return res.redirect("/login");
        }

        req.user = data;
        next();
    });
}

// Routes
app.get('/', (req, res) => {
    res.render("index");
});

app.get('/profile/upload', (req, res) => {
    res.render("profileupload");
});

app.post('/upload', isLoggedIn, upload.single("image"), async(req, res) => {
    let user = await userModel.findOne({ email:req.user.email});
    user.profilepic = req.file.filename;
    await user.save()
    res.redirect("/profile")


    
});




app.get('/login', (req, res) => {
    res.render("login");
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await userModel.findOne({ email });
        if (!user) return res.status(500).send("User not found");

        bcrypt.compare(password, user.password, (err, result) => {
            if (result) {
                const token = jwt.sign({ email: email, userid: user._id }, "shhhh");
                res.cookie("token", token);
                res.status(200).redirect("/profile");
            } else {
                res.redirect("/login");
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Something went wrong");
    }
});

app.post('/register', async (req, res) => {
    const { email, password, username, name, age } = req.body;

    try {
        const userExists = await userModel.findOne({ email });
        if (userExists) return res.status(500).send("User already registered");

        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(password, salt, async (err, hash) => {
                const user = await userModel.create({
                    username,
                    email,
                    name,
                    age,
                    password: hash
                });

                const token = jwt.sign({ email: email, userid: user._id }, "shhhh");
                res.cookie("token", token);
                res.send("Registered successfully");
            });
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Something went wrong");
    }
});

app.get("/profile", isLoggedIn, async (req, res) => {
    try {
        const user = await userModel.findOne({ email: req.user.email }).populate("posts");
        res.render("profile", { user });
    } catch (err) {
        console.error(err);
        res.status(500).send("Something went wrong");
    }
});

app.post("/post", isLoggedIn, async (req, res) => {
    const { content } = req.body;

    try {
        const user = await userModel.findOne({ email: req.user.email });
        const post = await postModel.create({
            user: user._id,
            content: content
        });

        user.posts.push(post._id);
        await user.save();
        res.redirect("/profile");
    } catch (err) {
        console.error(err);
        res.status(500).send("Something went wrong");
    }
});

app.get("/logout", (req, res) => {
    res.cookie("token", "");
    res.redirect("/login");
});

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});

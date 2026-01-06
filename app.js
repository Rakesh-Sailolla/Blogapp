require("dotenv").config({ override: true });






const multer = require("multer");
const { storage, cloudinary } = require("./cloudconfig.js");

// const { storage } = require("./cloudconfig.js");
const upload = multer({ storage });

const express = require('express')
const path = require('path');


const app = express()
const PORT = process.env.PORT || 3000;

const mongoose = require('mongoose');
const Post=require('./models/posts.js');
const methodOverride = require("method-override");
const session = require("express-session");
const flash = require("connect-flash");

const passport=require('passport')
const localstrategy=require('passport-local')
const User=require('./models/user.js');
const user = require('./models/user.js');


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({extended:true}))
app.use(methodOverride("_method"));



// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));


mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Atlas connected");
  })
  .catch(err => {
    console.error("❌ MongoDB connection error:", err);
  });


// mongoose.connect("mongodb://127.0.0.1:27017/Blogapp", {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// })
// .then(() => {
//   console.log("✅ MongoDB connected");})
// ///  
// app.use(session(sessionOptions))
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());  
passport.use(new localstrategy(User.authenticate()))
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
// app.get("/demouser", async (req, res) => {
//   try {
//     let fakeuser = new User({
//       email: "demo@gmail.com",
//       username: "demo-sigma"
//     });
//     let registeredUser = await User.register(fakeuser, "helloworld");
//     res.send(registeredUser);
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Error creating demo user");
//   }
// });
function saveRedirectUrl(req, res, next) {
  if (!req.isAuthenticated() && req.originalUrl !== "/login" && req.method === "GET") {
    // Save the URL they were trying to access
    req.session.redirectUrl = req.originalUrl;
  }
  next();

}
app.use(saveRedirectUrl);

app.use((req, res, next) => {
    res.locals.currentUser = req.user;  // ✅ makes the logged-in user available as currentUser

  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    req.session.redirectUrl=req.orginalUrl
    return next();
  }
  req.flash("error", "You must be logged in to perform this action!");
  res.redirect("/login");
}
//
function isLoggedOut(req, res, next) {
  if (req.isAuthenticated()) {
    req.flash("error", "You are already logged in!");
    return res.redirect("/posts"); // Redirect logged-in users away
  }
  next();
}
//
async function isAuthor(req, res, next) {
  const { id } = req.params;
  const post = await Post.findById(id);
  
  if (!post) {
    req.flash("error", "Post not found!");
    return res.redirect("/posts");
  }

  // Check if current user is the post author
  if (!post.author.equals(req.user._id)) {
    req.flash("error", "You do not have permission to do that!");
    return res.redirect(`/posts/${id}`);
  }

  next(); // ✅ User is the author — allow access
}

const Post = require("./models/post"); // make sure this exists

app.get("/", async (req, res) => {
  try {
    const posts = await Post.find();
    res.render("index", { posts });
  } catch (err) {
    console.error(err);
    res.render("index", { posts: [] });
  }
});

app.get("/about", (req, res) => {
  res.render("about.ejs");
});







///
app.get("/signup",isLoggedOut,(req,res)=>{
  res.render("signup.ejs")
})
app.post("/signup",isLoggedOut, async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      req.flash("error", "Username already exists. Please choose another one.");
      return res.redirect("/signup");
    }

    const user = new User({ username, email });
    const registeredUser = await User.register(user, password);

    req.login(registeredUser,(err) => {
      if (err) return next(err);
      req.flash("success", "Welcome to the Blog App!");
      res.redirect("/posts");
    });
  } catch (err) {
    console.error(err);
    req.flash("error", "Something went wrong during signup.");
    res.redirect("/signup");
  }
});
//
// Login routes
app.get("/login",isLoggedOut,(req, res) => {
  res.render("login");
});

app.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: "Invalid username or password.",
  }),
  (req, res) => {
    req.flash("success", `Welcome back, ${req.user.username}!`);
    
    // Use saved URL or default to /posts
    const redirectUrl = req.session.redirectUrl || "/posts";
    
    // Clear it so it doesn't persist
    delete req.session.redirectUrl;
    
    res.redirect(redirectUrl);
  }
);


// app.post(
//   "/login",
//   passport.authenticate("local", {
//     failureRedirect: "/login",
//     failureFlash: "Invalid username or password.",
//   }),
//   (req, res) => {
//     req.flash("success", `Welcome back, ${req.user.username}!`);
//     res.redirect(req.session.redirectUrl);
//   }
// );

app.post("/logout", (req, res, next) => {
  req.logout(function(err) {   // passport 0.6 requires a callback
    if (err) { 
      return next(err); 
    }
    req.flash("success", "You have logged out successfully.");
    res.redirect("/posts"); // Redirect to homepage or posts page after logout
  });
});


//
app.get("/posts", async (req, res) => {
  try {
    const allPosts = await Post.find({}).sort({ createdAt: -1 }).populate("author", "username")
; ; // latest first
    res.render("index.ejs", { posts: allPosts }); // pass posts to EJS template
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching posts");
  }
});
///
app.get("/posts/new", isLoggedIn,(req, res,) => {
  res.render("newpost.ejs");
});
///
app.get("/posts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(req.params.id).populate("author");

    if (!post) {
      return res.status(404).send("Post not found");
    }

    res.render("post", { post }); // Renders a single post view
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching post");
  }
});



// app.post(
//   "/posts",
//   isLoggedIn,
//   upload.single("image"),
//   async (req, res) => {
//     const { title, content, type } = req.body;

//     const newPost = new Post({
//       title,
//       content,
//       type,
//       author: req.user._id,
//       image: {
//         url: req.file ? req.file.path : "",
//         filename: req.file ? req.file.filename : ""
//       }
//     });

//     await newPost.save();
//     res.redirect("/posts");
//   }
// );
// app.post(
//   "/posts",
//   isLoggedIn,
//   upload.single("image"),
//   async (req, res) => {
//     console.log("BODY:", req.body);
//     console.log("FILE:", req.file);

//     const { title, content, type } = req.body;

//     const newPost = new Post({
//       title,
//       content,
//       type,
//       author: req.user._id,
//       image: {
//         url: req.file ? req.file.path : "",
//         filename: req.file ? req.file.filename : ""
//       }
//     });

//     await newPost.save();
//     res.redirect("/posts");
//   }
// );
app.post(
  "/posts",
  isLoggedIn,
  upload.single("image"),
  async (req, res) => {
    const { title, content, type } = req.body;

    const newPost = new Post({
      title,
      content,
      type,
      author: req.user._id,
      image: req.file
        ? {
            url: req.file.path,
            filename: req.file.filename,
          }
        : undefined, // ✅ IMPORTANT
    });

    await newPost.save();
    res.redirect("/posts");
  }
);


// ✅ Route to render edit form
app.get("/posts/:id/edit",isLoggedIn,isAuthor, async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);
    if (!post) return res.status(404).send("Post not found");
    res.render("editpost", { post });
  } catch (err) {
    console.error(err);
    res.status(400).send("Invalid Post ID");
  }
});

// ✅ Route to handle post edit submission
// app.post("/posts/:id/edit",isLoggedIn,isAuthor,  async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { title, content, author, type, image } = req.body;
//     await Post.findByIdAndUpdate(id, { title, content, author, type, image });
//     res.redirect(`/posts/${id}`); // after editing, go to the post page
//   } catch (err) {
//     console.error(err);
//     res.status(400).send("Error updating post");
//   }
// });
// app.post(
//   "/posts/:id/edit",
//   isLoggedIn,
//   isAuthor,
//   upload.single("image"),
//   async (req, res) => {
//     const { id } = req.params;
//     const { title, content, type } = req.body;

//     const post = await Post.findById(id);

//     post.title = title;
//     post.content = content;
//     post.type = type;

//     // ✅ only replace image if a new one is uploaded
//     if (req.file) {
//       post.image = {
//         url: req.file.path,
//         filename: req.file.filename,
//       };
//     }

//     await post.save();
//     res.redirect(`/posts/${id}`);
//   }
// );
app.post(
  "/posts/:id/edit",
  isLoggedIn,
  isAuthor,
  upload.single("image"),
  async (req, res) => {
    const { id } = req.params;
    const { title, content, type } = req.body;

    const post = await Post.findById(id);

    post.title = title;
    post.content = content;
    post.type = type;

    // 🔥 If a NEW image is uploaded
    if (req.file) {
      // 1️⃣ Delete old image from Cloudinary
      if (post.image && post.image.filename) {
        await cloudinary.uploader.destroy(post.image.filename);
      }

      // 2️⃣ Upload new image to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "BlogApp",
      });

      // 3️⃣ Save Cloudinary data (NOT req.file.path)
      post.image = {
        url: result.secure_url,
        filename: result.public_id,
      };
    }

    await post.save();
    res.redirect(`/posts/${id}`);
  }
);



app.delete("/posts/:id",isLoggedIn,isAuthor, async (req, res) => {
  try {
    const { id } = req.params;
    await Post.findByIdAndDelete(id);
    console.log("🗑️ Post deleted:", id);
    res.redirect("/posts"); // go back to all posts
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting post");
  }
});



// Handle unmatched routes
// app.use((req, res, next) => {
//   next(new ExpressError("Page Not Found!", 404));
// });

// Global Error Handler
// app.use((err, req, res, next) => {
//   const { statusCode = 500 } = err;
//   if (!err.message) err.message = "Oh no! Something went wrong.";
//   res.status(statusCode).render("error", { err });
// });
// //

// TEMP DEBUG ERROR HANDLER (REMOVE LATER)
app.use((err, req, res, next) => {
  console.error("🔥 REAL ERROR:", err);
  res.status(500).send(err.stack || err.message);
});




app.listen(
  PORT, () => {
  console.log(`Example app listening on port ${PORT}`)
})

const mongoose = require('mongoose');
const Post=require('./models/posts.js');
const samplePosts=require('./sampleposts.js');
main()
.then(res => console.log(res))
.catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/Blogapp');


  // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
}

const initDB=async()=>{
  await Post.deleteMany({})
  await Post.insertMany(samplePosts)
  console.log("sample data added")
}
initDB()
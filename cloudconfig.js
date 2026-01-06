// const cloudinary = require("cloudinary").v2;
// const { CloudinaryStorage } = require("multer-storage-cloudinary");

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// const storage = new CloudinaryStorage({
//   cloudinary,
//   params: {
//     folder: "BlogApp",
//     allowed_formats: ["jpg", "png", "jpeg", "webp"], // ✅ lowercase
//   },
// });

// module.exports = { cloudinary, storage };
// const cloudinary = require("cloudinary").v2;
// const { CloudinaryStorage } = require("multer-storage-cloudinary");

// // 🔴 HARD-CODE (TEMP TEST)
// cloudinary.config({
//   cloud_name: "dwfseuryd",
//   api_key: "172119135294165",
//   api_secret: "oPfOgQHZdnfn_lPjkfWMD8QwzuU",
// });

// const storage = new CloudinaryStorage({
//   cloudinary,
//   params: {
//     folder: "BlogApp",
//     allowed_formats: ["jpg", "png", "jpeg", "webp"],
//   },
// });

// module.exports = { cloudinary, storage };
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "BlogApp",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

module.exports = {
  cloudinary,
  storage,
};


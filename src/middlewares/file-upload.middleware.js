// ==> external import <==
const multer = require("multer");
const fs = require("fs");
const path = require("path");

// ==>file upload path<==
const uploadDir = path.join(__dirname, "..", "uploads");

// ==>file upload directories<==
const imageUploadDirectory = `${uploadDir}/image`;
const fileUploadDirectory = `${uploadDir}/file`;
const audioUploadDirectory = `${uploadDir}/audio`;
const videoUploadDirectory = `${uploadDir}/video`;
const directory = [
  imageUploadDirectory,
  fileUploadDirectory,
  audioUploadDirectory,
  videoUploadDirectory,
];

// ==>create upload directory function<==
directory.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ==>file upload storage and file name<==
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.originalname.match(/\.(pdf|doc|docx|csv|xls|xlsx|ppt|pptx)$/)) {
      cb(null, fileUploadDirectory);
    }
    if (file.originalname.match(/\.(jpg|jpeg|png|webp|svg)$/)) {
      cb(null, imageUploadDirectory);
    }
    if (file.originalname.match(/\.(mp3|wav|ogg|aac)$/)) {
      cb(null, audioUploadDirectory);
    }
    if (file.originalname.match(/\.(mp4|webm)$/)) {
      cb(null, videoUploadDirectory);
    }
  },
  filename: (req, file, cb) => {
    const fileExtension = path.extname(file.originalname);
    const fileName = crypto.randomUUID() + fileExtension;
    cb(null, fileName);
  },
});

// ==>upload a profile file<==
const avatarUpload = multer({
  storage: storage,
  limits: {
    fileSize: 1000000, //Max 1MB
  },
  fileFilter(req, file, cb) {
    if (file.fieldname === "avatar") {
      if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
        return cb(new Error("Unsupported image format!"));
      }
    }
    cb(null, true);
  },
});

// ==>upload a image file<==
const imageUpload = multer({
  storage: storage,
  limits: {
    fileSize: 2000000, //Max 2MB
  },
  fileFilter(req, file, cb) {
    if (file.fieldname === "image") {
      if (!file.originalname.match(/\.(jpg|jpeg|png|svg)$/)) {
        return cb(new Error("Unsupported image format!"));
      }
    }
    cb(null, true);
  },
});

// ==>upload many image files<==
const imagesUpload = multer({
  storage: storage,
  limits: {
    fileSize: 2000000, //Max 2MB
  },
  fileFilter(req, file, cb) {
    if (file.fieldname === "images") {
      if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
        return cb(new Error("Unsupported image format!"));
      }
    }
    cb(null, true);
  },
});

const fileUploadMiddleware = {
  avatarUpload,
  imageUpload,
  imagesUpload,
};

module.exports = fileUploadMiddleware;

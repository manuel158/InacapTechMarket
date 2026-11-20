const multer = require('multer');

const cloudinary =
    require('../config/cloudinary');
const createCloudinaryStorage = require('../storage/cloudinaryStorage');

const storage =
    createCloudinaryStorage(cloudinary);

const upload =
    multer({
        storage,
        limits: {
            files: 3,
            fileSize: 10 * 1024 * 1024,
            fields: 20,
            fieldSize: 256 * 1024,
            parts: 24
        }
    });

module.exports = upload;
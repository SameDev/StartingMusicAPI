import multer from "multer";
import { Request } from "express";
import path from "path";
import slug from "slugify";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: function(req, file, cb) {
        cb(null, new Date().toISOString() + slug(file.originalname, { lower: true}));
    }
});
  
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype === 'audio/mp3' || file.mimetype === 'audio/mpeg') {
        cb(null, true);
    } else {
        cb(null, false);
    }
}
  
const upload = multer({
    storage: storage,
    fileFilter: fileFilter
});

export default upload
import multer from "multer";
import path from "path";
import fs from "fs";
import ApiError from "../utils/apiError";
import httpStatus from "http-status";

const storage = multer.diskStorage({
  destination: (req: any, _file, cb) => {
    const area = req.uploadMeta?.area || "misc";
    const entityId = req.uploadMeta?.entityId || "common";

    const dir = path.join(process.cwd(), "uploads", area, entityId);
    fs.mkdirSync(dir, { recursive: true });

    cb(null, dir);
  },

  filename: (req: any, file, cb) => {
    // optional fixed names (so it replaces old)
    const ext = path.extname(file.originalname) || ".jpg";
    const forced = req.uploadMeta?.filename; // e.g. "avatar" or "logo"
    cb(null, forced ? `${forced}${ext}` : `${Date.now()}${ext}`);
  },
});



const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExt = [".jpg", ".jpeg", ".png", ".webp"];

  const isImageMime = file.mimetype.startsWith("image/");
  const isAllowedExt = allowedExt.includes(ext);

 
  if (!isImageMime && !isAllowedExt) {
    return cb(new ApiError(httpStatus.BAD_REQUEST, "Only image files are allowed") as any);
  }

  cb(null, true);
};


export const upload = multer({ storage, fileFilter });

export const uploadAvatarMulter = multer({ storage, fileFilter }).single("avatar");
export const uploadSellerLogoMulter = multer({ storage, fileFilter }).single("logo");


import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../configs/cloudinaryConfig.js";

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let folder = "user_uploads";
    let isImage = file.mimetype.startsWith("image/");
    let isVideo = file.mimetype.startsWith("video/");

    if (!isImage && !isVideo) {
      throw new Error("Chỉ hỗ trợ upload ảnh hoặc video!");
    }

    return {
      folder: folder,
      resource_type: isVideo ? "video" : "image",
      format: isImage ? "jpg" : undefined,
      public_id: file.originalname.split(".")[0],
    };
  },
});

const upload = multer({ storage });

export default upload;

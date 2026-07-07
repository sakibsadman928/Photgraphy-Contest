import multer from "multer";

/**
 * Parses multipart uploads into memory (req.file.buffer), rather than
 * writing to disk or streaming directly to a storage adapter. The buffer is
 * then passed to `uploadImageBuffer` (see config/cloudinary.ts) inside the
 * controller. Fine for the file sizes involved here (photos, <=10MB).
 */
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image files are allowed"));
      return;
    }
    cb(null, true);
  },
});

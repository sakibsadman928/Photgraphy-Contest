import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
import { env } from "./env";

cloudinary.config({
  cloud_name: env.cloudinaryCloudName,
  api_key: env.cloudinaryApiKey,
  api_secret: env.cloudinaryApiSecret,
});

/**
 * Uploads an in-memory file buffer (from multer's memoryStorage) directly to
 * Cloudinary via its upload stream API. Avoids relying on multer-storage-cloudinary,
 * which currently only supports the Cloudinary v1 SDK.
 */
export function uploadImageBuffer(buffer: Buffer, folder: string): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        transformation: [{ width: 2000, height: 2000, crop: "limit" }],
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    Readable.from(buffer).pipe(uploadStream);
  });
}

export default cloudinary;

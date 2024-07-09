import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDNINARY_CLOUD_NAME,
    api_key: process.env.CLOUDNINARY_API_KEY,
    api_secret: process.env.CLOUDNINARY_API_SECRET_KEY,
});

// Upload an image
const uploadOnCloudinary = async (filePath) => {
    try {
        if (!filePath) return null;
        const response = await cloudinary.uploader.upload(filePath, {
            resource_type: "auto",
        });
        console.log(response.url);
        return response;
    } catch (error) {
        fs.unlinkSync(filePath); //remove temp file if upload failed
        console.log(error);
    }
};

export { uploadOnCloudinary };

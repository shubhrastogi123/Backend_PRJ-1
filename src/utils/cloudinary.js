import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

// Cloudinary utils is used to upload the file taken from the user using the multer(see in middlewares) can be any
// .pdf, .png, .jpg on the cloudinary where the file is taken from the user using multer and stored temporarily on
// the locl server then from this local server it is uploaded to the cloudinary

//Got this config from the my cloudinary account
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try{
        if(!localFilePath) return null
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // file has been uploaded successfull
        //console.log("file is uploaded on cloudinary ", response.url);
        fs.unlinkSync(localFilePath)
        return response;    
    } catch(error){
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
} 

export {uploadOnCloudinary}
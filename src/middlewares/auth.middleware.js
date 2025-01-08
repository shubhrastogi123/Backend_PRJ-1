import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"

// _ can be used if res is not in use
export const verifyJWT = asyncHandler(async(req, _ , next) => {
    try {
        // Fetching the token from the cookies or from header incase of mobile applications
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer","")

    if(!token){
        throw new ApiError(401,"Unauthorized Token")
    }

    // verifing the token if its valid using jwt from the secret key
    const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)

    // Previously we have added the info like id, username, email etc in the token while generating
    const user = await User.findById(decodedToken?._id).select
    ("-password -refreshToken")

    if(!user){
        throw new ApiError(401,"Invalid Access Token")
    }

    req.user = user;
    next()

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token")
    }

})
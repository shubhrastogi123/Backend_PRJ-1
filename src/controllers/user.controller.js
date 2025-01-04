import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User }  from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"



const registerUser = asyncHandler( async (req, res) => {
    // ACTUAL STEPS THAT WE WILL FOLLOW TO REGISTER USER
    // get user detail from the frontend but here i am doing using the postman
    // validation - not empty
    // check if user already exists: using username nd emails
    // check for images, check for avatar
    // upload them to cloudinary
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    // get user detail from the frontend but here i am doing using the postman
    const {fullName, email, username, password} = req.body
    // console.log("email: ", email);
    // the user details have been taken from the req.body but the file handling will be done through the multer check user.routes.js

    // validation - not empty
    if(
        [fullName, email, username, password].some((field) => 
        field?.trim() == "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    // check if user already exists: using username nd emails
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    }) 
    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    // check for images, check for avatar, req.files is provided by the multer which add fields to the req like req.body is provided by express for data
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath) {
        throw new ApiError(409, "avatar is required")
    }

    // upload them to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar) {
        throw new ApiError(409, "avatar is required")
    }

    // create user object - create entry in db
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage.url || "",
        email,
        password,
        username: username.toLowerCase()
    })
    // To check if user is created or mot, along with the fileds that we have provided above for db entry MONGOdb automatically enters the _id for each entry do if _id is there means the user is created
    // remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    // check for user creation
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while regestering the user")
    }

    // return res. Inorder to return the res we have already created a class to pre set its structure of the return json else we can return the json from here also
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully !!")
    )


    // res.status(200).json({
    //     message: "ok"
    // })
})

export { registerUser }
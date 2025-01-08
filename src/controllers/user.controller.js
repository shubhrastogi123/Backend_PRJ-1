import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User }  from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"

// method to generate the access and refresh token for the login user functionality
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        // saving the refreshToken in th db
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}

    } catch(error) {
        throw new ApiError(500, "Somethng went wrong while generating the refresh token and access token")
    }
}

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

const loginUser = asyncHandler(async (req, res) => {
    // ToDo points
    // Bring data from the req body
    // to check if username, email is there or not for login purpoe
    // find the user
    // password check
    // generate access and refresh token
    // send cookies that store these tokens

    // Bring data from the req body
    const {username, email, password} = req.body

    if (!(username || email)) {
        throw new ApiError(400, "username or email is required")
    }

    // to check if username, email is there or not for login purpose
    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    // find the user
    if (!user) {
        throw new ApiError(404, "user not found")
    }

    // password check
    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(404, "password is invalid")
    }

    // generate access and refresh token
    // being done from the method defined above
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    // optional step as when calling the above generae fn then as of no the refresh token will be empty
    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken")
    
    // send cookies that store these tokens
    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User loggedin successfully "
        )
    )
})

const logoutUser = asyncHandler( async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshtoken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(
        200,
        {},
        "user logged out"
        ))

})

const refreshAccessToken = asyncHandler( async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized  request")
    }

    try {
        // Now verify this token to  decode its information inorder to fetch the id
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
            
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})


export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
 }
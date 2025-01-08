import { loginUser, logoutUser, registerUser, refreshAccessToken } from "../controllers/user.controller.js"
import { Router } from "express"
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

// now using the upload middleware for file handling before fetching the actual data in the controller
// which means pahle mere se hoke jao
router.route("/register").post(
    upload.fields([
        {
            name: "avatar", // this name will the same as that of the frontend field name
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
    )
 router.route("/login").post(loginUser)

 // Secured routes
 router.route("/logout").post(verifyJWT, logoutUser)

 router.route("/refresh-Token").post(refreshAccessToken)


export default router
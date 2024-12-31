import { registerUser } from "../controllers/user.controller.js"
import { Router } from "express"
import { upload } from "../middlewares/multer.middleware.js"

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

export default router
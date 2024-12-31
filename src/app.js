import express  from "express";
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

//Now to set the express configurations
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

//To accept data from the form
app.use(express.json({limit: "16kb"}))

//To accept the data from the url
app.use(express.urlencoded({extended: true, limit: "16kb"}))

//To accept some data which will be kept public - Here public is the nae of the folder and can be any name
app.use(express.static("public"))

//To securely access and store the cookies on user browser
app.use(cookieParser())

//routes import
import userRouter from "./routes/user.routes.js"

//routes declaration
app.use("/api/v1/users", userRouter) //Now when the user hits the http://localhost:8080/api/v1/users it will automatically redirect to the route defined in the user.routes.js file here - http://localhost:8080/api/v1/users/register


export { app }
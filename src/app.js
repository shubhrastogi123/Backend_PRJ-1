import Express  from "express";
import cors from "cors"
import cookieParser from "cookies-parser"

const app = Express()

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

export { app }
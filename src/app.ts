import "module-alias/register"
import express, { Application } from "express"
import dotenv from "dotenv"
import morgan from "morgan"
import bodyParser from "body-parser"
import Bootstrap from "./bootstrap"
import errorHandler from "./middlewares/errorHandler"
import { initializedRoutes } from "./routes"

import "@/crons/newUsers"
import "@/crons/wildfireDiscover"

dotenv.config()

const app: Application = express()

// using morgan for logs then store it on the logs/access.log directory
app.use(morgan("dev"))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.get("/", (req, res) => {
  res.send("Hello World")
})

initializedRoutes(app)
app.use(errorHandler)
Bootstrap(app)

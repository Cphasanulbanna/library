import express from "express"
import pgClient from "pg"

const {Client}  = pgClient
import dotev from "dotenv"

const app = express()
const port = 3000

dotev.config()
app.use(express.json())


//psql client setup
const client = new Client({
    user: process.env.USER,
    host: "localhost",
    database: process.env.DB,
    password: process.env.PASSWORD,
    port: port
})

client.connect()
  .then(() => console.log("Connected to the database"))
  .catch((err) => console.error("Error connecting to the database", err.stack));

app.listen(() => {
    console.log(`Server is running on port ${port}`)
})
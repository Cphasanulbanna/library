import express from "express"
import pgClient from "pg"
import dotev from "dotenv"
import cors from "cors"

const {Client}  = pgClient

const app = express()
const port = 3001

dotev.config()
app.use(cors({origin: "*"}))
app.use(express.json())


//psql client setup
const client = new Client({
    user: process.env.USER,
    host: "localhost",
    database: process.env.DB,
    password: process.env.PASSWORD,
    port: 5432
})

client.connect()
  .then(() => console.log("Connected to the database"))
  .catch((err) => console.error("Error connecting to the database", err.stack));

app.post("/", async (req, res) => {
  const { title, description, best_selling } = req.body
  
  try {
    const result = await client.query(
      'INSERT INTO books (title, description , best_selling) VALUES ($1, $2, $3) RETURNING *', [title, description, best_selling]
    )

    res.status(201).json({message: "Book Created", book: result.rows?.[0]})
    
  } catch (error) {
      res.status(500).json({message: error.message})
  }
  })

app.listen(port,() => {
    console.log(`Server is running on port ${port}`)
})

import express from "express";
import pgClient from "pg";
import dotev from "dotenv";
import cors from "cors";
import bcrypt from "bcrypt";
import { hashPassword } from "./encryption.js";
import jwt from "jsonwebtoken";
import { checkRole } from "./middleware.js";

const { Client } = pgClient;

const app = express();
const port = 3001;

dotev.config();
app.use(cors({ origin: "*" }));
app.use(express.json());

//psql client setup
export const client = new Client({
  user: process.env.USER,
  host: "localhost",
  database: process.env.DB,
  password: process.env.PASSWORD,
  port: 5432,
});

client
  .connect()
  .then(() => console.log("Connected to the database"))
  .catch((err) => console.error("Error connecting to the database", err.stack));

app.post("/", async (req, res) => {
  const { title, description, best_selling } = req.body;

  try {
    const result = await client.query(
      "INSERT INTO books (title, description , best_selling) VALUES ($1, $2, $3) RETURNING *",
      [title, description, best_selling]
    );

    res.status(201).json({ message: "Book Created", book: result.rows?.[0] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { title, description, best_selling } = req.body;
  try {
    const result = await client.query(
      "UPDATE books SET title = $1, description =$2, best_selling=$3 WHERE id = $4 RETURNING *",
      [title, description, best_selling, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: `Book not found with id: ${id}` });
    }

    res.status(200).json({ message: "book updated", books: result.rows?.[0] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/", async (req, res) => {
  try {
    const result = await client.query("SELECT * FROM books");

    res.status(200).json({ message: "success", books: result.rows });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await client.query(
      "DELETE FROM books WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).send("book not found");
    }

    res.status(200).json({ message: "book deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/signup", async (req, res) => {
  const { email, password , role="User"} = req.body;
  try {
    if (!email || !password)
      return res
        .status(400)
        .json({ message: "Email and Password is required" });

    const { rows: emailRecord } = await client.query(
      "SELECT email FROM users WHERE email = $1",
      [email]
    );
    if (emailRecord.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await hashPassword(password);

    const result = await client.query(
      "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id",
      [email, hashedPassword]
    );

    const userId = result.rows?.[0]?.id;
    await client.query(
      "INSERT INTO user_roles(user_id, role_id) VALUES ($1, (SELECT id FROM roles WHERE role_name = $2))",
      [userId, role]
    );

    res.status(201).json({ message: "User created" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password)
      return res
        .status(400)
        .json({ message: "Email and Password is required" });

    const { rows: userRow } = await client.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    const user = userRow?.[0];
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const decodedPassword = await bcrypt.compare(password, user.password);
    if (!decodedPassword) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    await client.query(
      "INSERT INTO sessions (user_id, token) VALUES ($1, $2)",
      [user.id, token]
    );

    const { rows: roleObject } = await client.query(
      "SELECT role_name FROM roles INNER JOIN user_roles on roles.id = user_roles.role_id WHERE user_roles.user_id  =$1",
      [user.id]
    );

    res
      .status(200)
      .json({ token, email: user.email, role: roleObject?.[0]?.role_name });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/role", async (req, res) => {
  const { role } = req.body;
  try {
    if (!role) return res.status(400).json({ message: "Role is required" });

    const result = await client.query(
      "INSERT INTO roles (role_name) VALUES ($1) RETURNING role_name",
      [role]
    );

    return res
      .status(201)
      .json({ message: "Role created", role: result.rows?.[0] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/admin-protected", checkRole("Admin"), async (req, res) => {
  res.status(200).json({ message: "This is admin route" });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

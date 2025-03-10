import jwt from "jsonwebtoken";
import { client } from "./server.js";

export const checkRole = (roleName) => {
  return async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer")) {
        return res.status(403).send({ message: "Unauthorized, no token provided" });
        
    }
      const token = authHeader.split(" ")?.[1];
      

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const userId = decoded.userId;
        

      const result = await client.query(
        "SELECT role_name FROM roles INNER JOIN user_roles ON roles.id = user_roles.role_id WHERE user_roles.user_id = $1",
        [userId]
      );
        
        if (!result.rows.length) {
            return res.status(401).json({message: "not authorized"})
        }

      const roles = result.rows?.map((row) => row.role_name);
      if (roles?.includes(roleName)) {
        return next();
      } else {
        return res.status(403).send("Access denied");
      }
    } catch (error) {
        return res.status(401).send({ error: error.message, message: "error" });
    }
  };
};

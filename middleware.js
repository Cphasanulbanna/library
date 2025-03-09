import jwt from "jsonwebtoken";
import { client } from "./server";

export const checkRole = (roleName) => {
  return async (req, res, next) => {
    const token = req.headers.authorization.split(" ")?.[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId;

      const result = await client.query(
        "SELECT role_name FROM roles INNER JOIN user_roles ON roles.id = user_roles.role_id WHERE user_roles.id = $1",
        [userId]
      );

      const roles = result.rows?.map((row) => row.role_name);
      if (roles?.includes(roleName)) {
        return next();
      } else {
        return res.status(403).send("Access denied");
      }
    } catch (error) {
      return res.status(401).send("Invalid token");
    }
  };
};

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
    user?: { id: string; role: string; email: string };
  }
  
export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token" });
  
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
        id: string; role: string; email: string;
      };
      req.user = payload;
      next();
    } catch {
      return res.status(401).json({ error: "Invalid token" });
    }
  }

  export function requireRole(role: string) {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
      if (req.user?.role !== role) {
        return res.status(403).json({ error: "Forbidden" });
      }
      next();
    };
  }
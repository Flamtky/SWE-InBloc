import APIException from "../APIException";
import { Request, Response, NextFunction, Router } from "express";

// All user routes

export default class UserRoutes {
    public static init(router: Router): Router {
        // Get all users
        router.get('/', (req: Request, res: Response, next: NextFunction) => {
            res.status(200).json({ data: { users: [{ id: 1, name: 'John Doe' }] } });
        });
        //  Login (POST) - /user/login
        router.post('/login', (req: Request, res: Response, next: NextFunction) => {
            // Checks if body has username and password
            if (!req.body.username || !req.body.password) {
                return res.status(400).json({ error: 'Missing username or password' });
            }
            if (req.body.username === 'admin' && req.body.password === 'admin') {
                return res.status(200).json({ data: {'valid': true} });
            } else {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
        }).all('/login', (_req: Request, _res: Response, next: NextFunction) => {
            next(new APIException(405, 'Method not allowed'));
        });
        return router;
    }
}
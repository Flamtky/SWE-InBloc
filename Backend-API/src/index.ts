import express from 'express';
import { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import PathRouter from './PathRouter';
import morgan from 'morgan';
import APIException from './APIException';

const app = express();
const router = express.Router();
const PORT = 1337;

/*
   Middlewares
   - Morgan for logging
   - Cors for cross-origin resource sharing
   - Express.json for parsing JSON
   - Authhandler for authentication
   - Validator checks content-type and method
   - Router for handling routes
   - NotFoundHandler for handling 404
   - Errorhandler for error handling
*/
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
    // Checks Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'No authorization header' });
    }
    // Checks if the token is valid
    const token = authHeader.split(' ');
    if (token[0] !== 'Bearer' || token.length !== 2) {
        return res.status(401).json({ error: 'Invalid authorization header' });
    } else {
        // Checks if the token is valid
        const authToken = token[1];
        if (authToken !== 'valid') { // TODO: Change to real token
            return res.status(401).json({ error: 'Invalid token' });
        }
    }
    // If the token is valid, the request is authorized
    next();
});

app.use((req, res, next) => {
    // if content-type is not application/json, reject
    if (req.headers['content-type'] !== 'application/json') {
        return res.status(415).json({ error: 'Content-Type must be application/json' });
    }
    // if method is not GET, POST, DELETE, reject
    if (['GET', 'POST', 'DELETE'].indexOf(req.method) === -1) {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    next();
});

app.use('/', PathRouter.init(app,router));

app.use((_req, _res, next) => {
    next(new APIException(404, 'Not found'));
});

app.use((err:unknown, _req:Request, res:Response, _next:NextFunction) => {
    // APIException (custom error)
    if (err instanceof APIException) {
        return res.status(err.code).json({ error: err.message });
    }
    if (err instanceof Error && err.message) {
        console.error(err.stack);
        return res.status(500).json({ error: err.message });
    }
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server started on port http://localhost:${PORT}`);
});

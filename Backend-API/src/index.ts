import express from 'express';
import { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import PathRouter from './PathRouter';
import morgan from 'morgan';
import APIException from './APIException';
import * as admin from 'firebase-admin';

const app = express();
const PORT = 1337;

// Initialize Firebase
admin.initializeApp({
    credential: admin.credential.cert(require('../adminsdk-config.json')),
    databaseURL: 'https://inbloc69-default-rtdb.europe-west1.firebasedatabase.app/',
    storageBucket: 'gs://inbloc69.appspot.com/'
});

/*
   Middlewares
   - Morgan for logging
   - Cors for cross-origin resource sharing
   - Express.json for parsing JSON
   - Validator checks content-type and method
   - Authhandler for authentication
   - Router for handling routes
   - NotFoundHandler for handling 404
   - Errorhandler for error handling
*/

app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    // if content-type is not application/json or text/event-stream, reject
    if (req.headers['content-type'] !== 'application/json' && req.headers['content-type'] !== 'text/event-stream') {
        return res.status(415).json({ error: 'Unsupported Media Type' });
    }
    // if method is not GET, POST, DELETE, PATCH reject
    if (['GET', 'POST', 'DELETE', 'PATCH'].indexOf(req.method) === -1) {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    next();
});

app.use((req, res, next) => {
    // if request from localhost and header Debug is set, skip authentication
    if (req.headers.host === 'localhost:1337' && req.headers.debug) {
        req.headers.admin = "true";
        return next();
    }

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
        admin.auth().verifyIdToken(authToken)
            .then((decodedToken) => {
                // Checks if its an admin and checks if the users email is verified
                admin.auth().getUser(decodedToken.uid).then((userRecord) => {
                    req.headers.admin = userRecord.customClaims?.admin || false;
                    if (!userRecord.emailVerified) {
                        return res.status(403).json({ error: 'Email not verified' });
                    } else {
                        req.headers.uid = decodedToken.uid;
                    }
                    next();
                });
            }
            ).catch((e) => {
                return res.status(401).json({ error: e.code === 'auth/id-token-expired' ? 'Token expired' : 'Invalid token' });
            });
    }
});

PathRouter(app);

app.use((_req, _res, next) => {
    next(new APIException(404, 'Not found'));
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    // APIException (custom error)
    if (err instanceof APIException) {
        return res.status(err.code).json({ error: err.message });
    }
    // Catch all json pharser errors
    if (err instanceof SyntaxError && 'body' in err) {
        return res.status(400).json({ error: 'Invalid Payload' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`Server started on port http://localhost:${PORT}`);
});

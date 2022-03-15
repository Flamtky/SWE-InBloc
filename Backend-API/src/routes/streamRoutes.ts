import { NextFunction, Request, Response, Router } from "express";
import * as admin from 'firebase-admin';
import APIException from "../APIException";
import User from "../interfaces/User";
import express from "express";
import { handleFirebaseError } from "../HelperFunctions";


const router = express.Router();

router.use((req, res, next) => {
    if (req.headers['content-type'] !== 'text/event-stream') {
        return res.status(415).json({ error: 'Unsupported Media Type' });
    }
    next();
});

// All stream routes

// stream realtime updates with server side events
router.get('/users/:uid/', (req: Request, res: Response, next: NextFunction) => {
    if (req.headers['content-type'] !== 'text/event-stream') {
        return next(new APIException(415, 'Content-Type must be text/event-stream'));
    }

    const id = req.params.uid;
    const currentUser = req.headers.uid;

    if (!req.headers.admin) {
        if (id !== currentUser) {
            return next(new APIException(403, 'You are not allowed to subscribe to this event'));
        }
    }

    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    });
    res.write('\n');

    const stream = admin.database().ref('/users/' + id).on('value', (snapshot) => {
        res.write('data: ' + JSON.stringify(snapshot.val()) + '\n\n');
    }, (err) => {
        handleFirebaseError(err, res, next, 'Error streaming user');
    });

    res.on('close', () => {
        admin.database().ref('/users/' + id).off('value', stream);
        res.end();
    });
}).all('/:uid/stream', (_req: Request, _res: Response, next: NextFunction) => {
    next(new APIException(405, 'Method not allowed'));
});

export default router;
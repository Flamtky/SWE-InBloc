import { NextFunction, Request, Response, Router } from "express";
import * as admin from 'firebase-admin';
import APIException from "../APIException";
import User from "../interfaces/User";

// All stream routes

export default class StreamRoutes {

    public static init(router: Router): Router {

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

        return router;
    }
}

const handleFirebaseError = (err: any, _res: Response, next: NextFunction, defaultErrorMessage: string = 'Internal server error') => {
    switch (err.code) {
        case 'auth/invalid-argument':
            next(new APIException(400, 'Invalid argument'));
            break;
        case 'auth/user-not-found':
            next(new APIException(404, 'User not found'));
            break;
        case 'auth/invalid-uid':
            next(new APIException(400, 'Invalid user id'));
            break;
        case 'auth/argument-error':
            next(new APIException(400, 'Invalid argument'));
            break;
        default:
            console.error(err);
            next(new APIException(500, defaultErrorMessage));
    }
}
import { NextFunction, Request, Response, Router } from "express";
import * as admin from 'firebase-admin';
import APIException from "../APIException";
import Gym from "../interfaces/Gym";
import express from "express";
import { handleFirebaseError, steriliseGym, validateGym } from "../HelperFunctions";

const router = express.Router();

// All Gym routes

// Get all gyms
router.get('/', (req: Request, res: Response, next: NextFunction) => {
    if (req.headers['content-type'] !== 'application/json') {
        return next(new APIException(415, 'Content-Type must be application/json'));
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    admin.database().ref('/gyms').limitToFirst(limit).once('value', (snapshot: any) => {
        res.status(200).json({ data: { gyms: snapshot.val() } });
    }, (error: any) => {
        handleFirebaseError(error, res, next, 'Error getting gyms');
    });
}).all('/', (_req: Request, _res: Response, next: NextFunction) => {
    next(new APIException(405, 'Method not allowed'));
});

// Get gym by gymId
router.get('/:gymId', (req: Request, res: Response, next: NextFunction) => {
    if (req.headers['content-type'] !== 'application/json') {
        return next(new APIException(415, 'Content-Type must be application/json'));
    }

    const gymId = req.params.gymId;
    admin.database().ref('/gyms/' + gymId).once('value').then((snapshot) => {
        if (snapshot.val() === null) {
            next(new APIException(404, 'Gym not found'));
        } else {
            res.status(200).json({ data: { gym: snapshot.val() } });
        }
    }).catch((err) => {
        handleFirebaseError(err, res, next, 'Error getting gym');
    });
});

// Update gym by gymId
router.patch('/:gymId', (req: Request, res: Response, next: NextFunction) => {
    if (req.headers['content-type'] !== 'application/json') {
        return next(new APIException(415, 'Content-Type must be application/json'));
    }

    const id = req.params.gymId;
    const gym: Gym = steriliseGym(req.body as Gym, false);
    const currentUser = req.headers.uid;
    if (!req.headers.admin) {
        // TODO: add owner check
    }
    if (!validateGym(gym, true)) {
        return next(new APIException(400, 'Invalid gym'));
    }
    admin.database().ref('/gyms/' + id).update(gym).then(() => {
        res.status(200).json({ data: { gym } });
    }).catch((err) => {
        handleFirebaseError(err, res, next, 'Error updating gym');
    });
});

// Create gym by gymId
router.post('/:gymid', (req: Request, res: Response, next: NextFunction) => {
    if (req.headers['content-type'] !== 'application/json') {
        return next(new APIException(415, 'Content-Type must be application/json'));
    }

    const gymId = req.params.gymid;
    const gym: Gym = steriliseGym(req.body as Gym, true);
    const currentUser = req.headers.uid;
    if (!req.headers.admin) {
        // TODO: add owner check
    }
    if (!validateGym(gym)) {
        return next(new APIException(400, 'Invalid gym'));
    }
    admin.database().ref('/gyms/' + gymId).get().then((snapshot) => {
        if (snapshot.val() !== null) {
            next(new APIException(400, 'Gym already exists'));
        } else {
            admin.database().ref('/gyms/' + gymId).set(gym).then(() => {
                res.status(200).json({ data: { gym } });
            }).catch((err) => {
                handleFirebaseError(err, res, next, 'Error creating gym');
            });
        }
    }).catch((err) => {
        handleFirebaseError(err, res, next, 'Error creating gym');
    });
});

// Delete gym by gymId
router.delete('/:gymId', (req: Request, res: Response, next: NextFunction) => {
    if (req.headers['content-type'] !== 'application/json') {
        return next(new APIException(415, 'Content-Type must be application/json'));
    }

    const gymId = req.params.gymId;
    const currentUser = req.headers.uid;
    if (!req.headers.admin) {
        // TODO: add owner check
    }
    admin.database().ref('/gyms/' + gymId).remove().then(() => {
        res.status(200).json({ data: { gym: null } });
    }).catch((err) => {
        handleFirebaseError(err, res, next, 'Error deleting gym');
    });
});

export default router;
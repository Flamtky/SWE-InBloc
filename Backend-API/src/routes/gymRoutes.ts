import { NextFunction, Request, Response, Router } from "express";
import * as admin from 'firebase-admin';
import APIException from "../APIException";
import Gym, { Day, Openings } from "../interfaces/Gym";
import express from "express";
import { handleFirebaseError, steriliseDayFromInterface, steriliseGym, steriliseOpenings, validateDay, validateDayFromInterface, validateGym, validateOpenings } from "../HelperFunctions";

const router = express.Router();

router.use((req, res, next) => {
    if (req.headers['content-type'] !== 'application/json') {
        return res.status(415).json({ error: 'Unsupported Media Type' });
    }
    next();
});

// All Gym routes

// Get all gyms
router.get('/', (req: Request, res: Response, next: NextFunction) => {
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
}).all('/:gymId', (_req: Request, _res: Response, next: NextFunction) => {
    next(new APIException(405, 'Method not allowed'));
});

// Openings routes

// Get all openings for gym by gymId
router.get('/:gymId/openings', (req: Request, res: Response, next: NextFunction) => {
    const gymId = req.params.gymId;
    admin.database().ref('/openings/' + gymId).once('value', (snapshot: any) => {
        if (snapshot.val() === null) {
            next(new APIException(404, 'No openings found for given gym'));
        } else {
            res.status(200).json({ data: { openings: snapshot.val() } });
        }
    }, (error: any) => {
        handleFirebaseError(error, res, next, 'Error getting openings');
    });
});

// Set opening for gym by gymId
router.post('/:gymId/openings', (req: Request, res: Response, next: NextFunction) => {
    const gymId = req.params.gymId;
    const opening: Openings = steriliseOpenings(req.body as Openings, false);
    const currentUser = req.headers.uid;
    if (!req.headers.admin) {
        // TODO: add owner check
    }
    if (!validateOpenings(opening)) {
        return next(new APIException(400, 'Invalid opening'));
    }
    admin.database().ref('/openings/' + gymId).set(opening).then(() => {
        res.status(200).json({ data: { opening } });
    }).catch((err) => {
        handleFirebaseError(err, res, next, 'Error updating opening');
    });
}).all('/:gymId/openings', (_req: Request, _res: Response, next: NextFunction) => {
    next(new APIException(405, 'Method not allowed'));
});

// Get opening for gym by gymId and day
router.get('/:gymId/openings/:day', (req: Request, res: Response, next: NextFunction) => {
    const gymId = req.params.gymId;
    const day = req.params.day;
    if (!validateDay(day.trim().toLowerCase())) {
        return next(new APIException(400, 'Invalid day'));
    }
    admin.database().ref('/openings/' + gymId + '/' + day).once('value', (snapshot: any) => {
        if (snapshot.val() === null) {
            next(new APIException(404, 'No openings found for given gym and day'));
        } else {
            res.status(200).json({ data: { [day]: snapshot.val() } });
        }
    }, (error: any) => {
        handleFirebaseError(error, res, next, 'Error getting opening');
    });
});

// Update opening for gym by gymId and day
router.patch('/:gymId/openings/:day', (req: Request, res: Response, next: NextFunction) => {
    const gymId = req.params.gymId;
    const day = req.params.day;
    const openingDay: Day = steriliseDayFromInterface(req.body as Day, false);
    const currentUser = req.headers.uid;
    if (!req.headers.admin) {
        // TODO: add owner check
    }
    if (!validateDay(day.trim().toLowerCase())) {
        return next(new APIException(400, 'Invalid day'));
    }
    if (!validateDayFromInterface(openingDay)) {
        return next(new APIException(400, 'Invalid opening'));
    }
    admin.database().ref('/openings/' + gymId + '/' + day).update(openingDay).then(() => {
        res.status(200).json({ data: { [day]: openingDay } });
    }).catch((err) => {
        handleFirebaseError(err, res, next, 'Error updating opening');
    });
}).all('/:gymId/openings/:day', (_req: Request, _res: Response, next: NextFunction) => {
    next(new APIException(405, 'Method not allowed'));
});

export default router;
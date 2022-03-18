import { NextFunction, Request, Response, Router } from "express";
import * as admin from 'firebase-admin';
import APIException from "../APIException";
import User from "../interfaces/User";
import express from "express";
import { handleFirebaseError, steriliseUser, validateUser } from "../HelperFunctions";

const router = express.Router();


router.use((req, res, next) => {
    if (req.headers['content-type'] !== 'application/json') {
        return res.status(415).json({ error: 'Unsupported Media Type' });
    }
    next();
});


// All user routes

// Get all users
router.get('/', (req: Request, res: Response, next: NextFunction) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    if (isNaN(limit)) {
        return res.status(400).json({ error: 'Invalid limit' });
    }

    admin.database().ref('/users').limitToFirst(limit).once('value', (snapshot: any) => {
        res.status(200).json({ data: { users: snapshot.val() } });
    }, (error: any) => {
        handleFirebaseError(error, res, next, 'Error getting users');
    });
}).all('/', (_req: Request, _res: Response, next: NextFunction) => {
    next(new APIException(405, 'Method not allowed'));
});

// Get user by uid
router.get('/:uid', (req: Request, res: Response, next: NextFunction) => {
    const uid = req.params.uid;
    admin.database().ref('/users/' + uid).once('value').then((snapshot) => {
        if (snapshot.val() === null) {
            next(new APIException(404, 'User not found'));
        } else {
            res.status(200).json({ data: { user: snapshot.val() } });
        }
    }).catch((err) => {
        handleFirebaseError(err, res, next, 'Error getting user');
    });
});

// Update user by uid
router.patch('/:uid', (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.uid;
    const user: User = steriliseUser(req.body as User, false);
    const currentUser = req.headers.uid;
    if (!req.headers.admin) {
        if (id !== currentUser) {
            return next(new APIException(403, 'You are not allowed to update this user'));
        }
    }
    if (user === undefined || !validateUser(user, true)) {
        return next(new APIException(400, user === undefined ? 'No user data provided' : 'Invalid user'));
    }
    admin.database().ref('/users/' + id).update(user).then(() => {
        res.status(200).json({ data: { user } });
    }).catch((err) => {
        handleFirebaseError(err, res, next, 'Error updating user');
    });
});

// Create user with uid
router.post('/:uid', (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.uid;
    const user: User = steriliseUser(req.body as User, true);
    const currentUser = req.headers.uid;
    if (!req.headers.admin) {
        if (id !== currentUser) {
            return next(new APIException(403, 'You are not allowed to create this user'));
        }
    }
    if (user === undefined || !validateUser(user)) {
        return next(new APIException(400, user === undefined ? 'No user data provided' : 'Invalid user'));
    }

    admin.database().ref('/users/' + id).get().then((snapshot) => {
        if (snapshot.val() !== null) {
            return next(new APIException(400, 'User already exists'));
        }

        admin.database().ref('/users/' + id).set(user).then(() => {
            res.status(200).json({ data: { user } });
        }).catch((err) => {
            handleFirebaseError(err, res, next, 'Error creating user');
        });
    }).catch((err) => {
        handleFirebaseError(err, res, next, 'Error creating user');
    });
});

// Delete user by uid
router.delete('/:uid', (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.uid;
    const currentUser = req.headers.uid;
    const keepAuth = req.query.keepAuth === 'true';
    if (!req.headers.admin) {
        if (id !== currentUser) {
            return next(new APIException(403, 'You are not allowed to delete this user'));
        }
    }
    admin.database().ref('/users/' + id).remove().then(() => {
        if (!keepAuth) {
            admin.auth().deleteUser(id).then(() => {
                res.status(200).json({ data: { user: null } });
            }).catch((err) => {
                handleFirebaseError(err, res, next, 'Error deleting user auth');
            });
        } else {
            res.status(200).json({ data: { user: null } });
        }
    }).catch((err) => {
        handleFirebaseError(err, res, next, 'Error deleting user');
    });
}).all('/:uid', (_req: Request, _res: Response, next: NextFunction) => {
    next(new APIException(405, 'Method not allowed'));
});

// Admin routes

// Get user is admin
router.get('/:uid/admin', (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.uid;
    if (!req.headers.admin) {
        return next(new APIException(403, 'You are not allowed to view the admin status of this user'));
    }

    admin.auth().getUser(id).then((userRecord) => {
        res.status(200).json({ data: { admin: userRecord.customClaims.admin || false } });
    }).catch((err) => {
        handleFirebaseError(err, res, next, 'Error getting user admin status');
    });
});

// Change user admin status
router.patch('/:uid/admin', (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.uid;
    const newAdminStatus = req.body.admin;
    if (!req.headers.admin) {
        return next(new APIException(403, 'You are not allowed to make this user admin'));
    }
    if (newAdminStatus === undefined) {
        return next(new APIException(400, 'No admin status provided'));
    }
    if (typeof newAdminStatus !== 'boolean') {
        return next(new APIException(400, 'Invalid admin status'));
    }
    admin.auth().setCustomUserClaims(id, { admin: newAdminStatus }).then(() => {
        res.status(200).json({ data: { admin: newAdminStatus } });
    }).catch((err) => {
        console.error(err);
        handleFirebaseError(err, res, next, 'Error setting user admin status');
    });
}).all('/:uid/admin', (_req: Request, _res: Response, next: NextFunction) => {
    next(new APIException(405, 'Method not allowed'));
});

export default router;
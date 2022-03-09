import APIException from "../APIException";
import { Request, Response, NextFunction, Router } from "express";
import * as admin from 'firebase-admin';
import User from "../interfaces/User";

// All user routes

export default class UserRoutes {
    public static init(router: Router): Router {

        // Get all users
        router.get('/', (req: Request, res: Response, next: NextFunction) => {
            const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
            const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
            admin.database().ref('/users').limitToFirst(limit).startAt(offset).once('value', (snapshot: any) => {
                res.status(200).json({data: { users: snapshot.val() }});
            }, (error: any) => {
                console.error(error);
                next(new APIException(500, 'Error getting users'));
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
                console.error(err);
                next(new APIException(500, 'Error getting user'));
            });
        });

        // Update user by uid
        router.patch('/:uid', (req: Request, res: Response, next: NextFunction) => {
            const id = req.params.uid;
            const user:User = steriliseUser(req.body as User, false);
            const currentUser = req.headers.uid;
            if (id !== currentUser || !req.headers.admin) {
                return next(new APIException(403, 'You are not allowed to update this user'));
            }
            if (user === undefined || !validateUser(user)) {
                return next(new APIException(400, user === undefined ? 'No user data provided' : 'Invalid user'));
            }
            admin.database().ref('/users/' + id).update(user).then(() => {
                res.status(200).json({ data: { user } });
            }).catch((err) => {
                console.error(err);
                next(new APIException(500, 'Error updating user'));
            });
        });

        // Create user with uid
        router.post('/:uid', (req: Request, res: Response, next: NextFunction) => {
            const id = req.params.uid;
            const user:User = steriliseUser(req.body as User, true);
            const currentUser = req.headers.uid;
            if (id !== currentUser || !req.headers.admin) {
                return next(new APIException(403, 'You are not allowed to create this user'));
            }
            if (user === undefined || !validateUser(user)) {
                return next(new APIException(400, user === undefined ? 'No user data provided' : 'Invalid user'));
            }
            admin.database().ref('/users/' + id).set(user).then(() => {
                res.status(200).json({ data: { user } });
            }).catch((err) => {
                console.error(err);
                next(new APIException(500, 'Error creating user'));
            });
        });

        // Delete user by uid
        router.delete('/:uid', (req: Request, res: Response, next: NextFunction) => {
            const id = req.params.uid;
            const currentUser = req.headers.uid;
            if (id !== currentUser || !req.headers.admin) {
                return next(new APIException(403, 'You are not allowed to delete this user'));
            }
            admin.database().ref('/users/' + id).remove().then(() => {
                admin.auth().deleteUser(id).then(() => {
                    res.status(200).json({ data: { user: null } });
                }).catch((err) => {
                    console.error(err);
                    next(new APIException(500, 'Error deleting user'));
                });
            }).catch((err) => {
                console.error(err);
                next(new APIException(500, 'Error deleting user'));
            });
        }).all('/:uid', (_req: Request, _res: Response, next: NextFunction) => {
            next(new APIException(405, 'Method not allowed'));
        });

        return router;
    }
}

const isEmail = (email:string) => {
    return email.length >= 3 && email
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
};

const validateUser = (user: User): boolean => {
    if (user.username.length < 3 || user.username.length > 16) {
        return false;
    }
    if (!isEmail(user.email)) {
        return false;
    }
    if (user.country != undefined && (user.country.length < 4 || user.country.length > 56)) {
        return false;
    }
    if (user.city != undefined && user.city.length < 1) {
        return false;
    }
    if (user.zip != undefined && user.zip.length < 1) {
        return false;
    }
    if (user.birthdate != undefined && isNaN(Date.parse(user.birthdate))) {
        return false;
    }

    return true;
};

const steriliseUser = (user: User, fillup: boolean = false): User => {
    const newUser: User = {
        username: user.username ? user.username.trim() : null,
        email: user.email ? user.email.trim() : null,
        country: user.country ? user.country.trim() : null,
        city: user.city ? user.city.trim() : null,
        zip: user.zip ? user.zip.trim() : null,
        birthdate: user.birthdate ? user.birthdate.trim() : null,
    };
    if (!fillup) {
        // remove empty fields
        Object.keys(newUser).forEach((key) => {
            if ((newUser as any)[key] === null) {
                delete (newUser as any)[key];
            }
        });
    }
    return newUser;
};
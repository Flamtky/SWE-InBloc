import { NextFunction, Request, Response } from "express";
import * as admin from 'firebase-admin';
import APIException from "../APIException";
import Route from "../interfaces/Route";
import express from "express";
import { handleFirebaseError, validateRoute, validateRouteFeatures, validateWall, validateWallFeatures } from "../HelperFunctions";
import { isStaff } from "./gymRoutes";

const router = express.Router();

router.use((req, res, next) => {
    if (req.headers['content-type'] !== 'application/json') {
        return res.status(415).json({ error: 'Unsupported Media Type' });
    }
    next();
});

// All Route routes

// Get all Routes or for given wall and/or gym
router.get('/', (req: Request, res: Response, next: NextFunction) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const gymId = req.query.gymId ? String(req.query.gymId) : null;
    const wallId = req.query.wallId ? String(req.query.wallId) : null;

    if (isNaN(limit) || limit < 1 || limit > 1000) {
        return res.status(400).json({ error: 'Invalid limit' });
    }

    // If gymId is not given, get all routes from every wall and every gym
    if (gymId === null) {
        admin.database().ref('/routes').limitToFirst(limit).once('value', (snapshot: any) => {
            if (snapshot.val() === null) {
                return res.status(404).json({ error: 'No routes found' });
            } else {
                res.status(200).json({ data: { walls: snapshot.val() } });
            }
        }, (error: any) => {
            handleFirebaseError(error, res, next, 'Error getting walls');
        });
    } else if (gymId !== null && wallId === null) { // If wallId is not given, get all routes from given gym
        admin.database().ref('/gyms/' + gymId).once('value', (snapshot: any) => {
            if (snapshot.val() === null) {
                return res.status(404).json({ error: 'Gym not found' });
            } else {
                admin.database().ref('/routes/' + gymId).limitToFirst(limit).once('value', (routesSnapshot: any) => {
                    if (routesSnapshot.val() === null) {
                        return res.status(404).json({ error: 'No routes found' });
                    } else {
                        res.status(200).json({ data: { routes: routesSnapshot.val() } });
                    }
                }, (error: any) => {
                    handleFirebaseError(error, res, next, 'Error getting routes');
                });
            }
        }, (error: any) => {
            handleFirebaseError(error, res, next, 'Error getting gym');
        });
    } else { // If both gymId and wallId are given, get all routes from given wall and gym
        admin.database().ref('/gyms/' + gymId).once('value').then((snapshot) => {
            if (snapshot.val() === null) {
                return res.status(404).json({ error: 'Gym not found' });
            } else {
                admin.database().ref('/walls/' + wallId).once('value').then((wallSnapshot) => {
                    if (wallSnapshot.val() === null) {
                        return res.status(404).json({ error: 'Wall not found' });
                    } else {
                        admin.database().ref('/routes/' + gymId + '/' + wallId).limitToFirst(limit).once('value', (routesSnapshot: any) => {
                            if (routesSnapshot.val() === null) {
                                return res.status(404).json({ error: 'No routes found' });
                            } else {
                                res.status(200).json({ data: { routes: routesSnapshot.val() } });
                            }
                        }, (error: any) => {
                            handleFirebaseError(error, res, next, 'Error getting routes');
                        });
                    }
                }, (error: any) => {
                    handleFirebaseError(error, res, next, 'Error getting wall');
                });
            }
        }, (error: any) => {
            handleFirebaseError(error, res, next, 'Error getting gym');
        });
    }
}).all('/', (_req: Request, _res: Response, next: NextFunction) => {
    next(new APIException(405, 'Method not allowed'));
});

// Get route by routeId
router.get('/:routeId', (req: Request, res: Response, next: NextFunction) => {
    const routeId = req.params.routeId;
    const gymId = req.query.gymId ? String(req.query.gymId) : null;
    const wallId = req.query.wallId ? String(req.query.wallId) : null;

    if (gymId === null) {
        return res.status(400).json({ error: 'Invalid gymId' });
    }
    if (wallId === null) {
        return res.status(400).json({ error: 'Invalid wallId' });
    }

    admin.database().ref('/gyms/' + gymId).once('value', (snapshotGym: any) => {
        if (snapshotGym.val() === null) {
            return res.status(404).json({ error: 'Gym not found' });
        } else {
            admin.database().ref('/walls/' + wallId).once('value', (snapshotWall: any) => {
                if (snapshotWall.val() === null) {
                    return res.status(404).json({ error: 'Wall not found' });
                } else {
                    admin.database().ref('/routes/' + gymId + '/' + wallId + '/' + routeId).once('value', (snapshot: any) => {
                        if (snapshot.val() === null) {
                            return res.status(404).json({ error: 'Route not found' });
                        } else {
                            res.status(200).json({ data: { route: snapshot.val() } });
                        }
                    }, (error: any) => {
                        handleFirebaseError(error, res, next, 'Error getting route');
                    });
                }
            }, (error: any) => {
                handleFirebaseError(error, res, next, 'Error getting wall');
            });
        }
    }, (error: any) => {
        handleFirebaseError(error, res, next, 'Error getting gym');
    });
});

// Create route
router.post('/:routeId', (req: Request, res: Response, next: NextFunction) => {
    const route: Route = req.body;
    const gymId = req.query.gymId ? String(req.query.gymId) : null;
    const wallId = req.query.wallId ? String(req.query.wallId) : null;
    const routeId = req.params.routeId;
    const currentUser = req.headers.uid as string;
    if (!validateRoute(route)) {
        return res.status(400).json({ error: 'Invalid route' });
    }
    if (gymId === null) {
        return res.status(400).json({ error: 'Invalid gymId' });
    }
    if (wallId === null) {
        return res.status(400).json({ error: 'Invalid wallId' });
    }

    isStaff(gymId, currentUser).then((isStaffBool: boolean) => {
        if (isStaffBool || req.headers.admin) {
            admin.database().ref('/gyms/' + gymId).once('value', (snapshotGym: any) => {
                if (snapshotGym.val() === null) {
                    return res.status(404).json({ error: 'Gym not found' });
                } else {
                    admin.database().ref('/walls/' + wallId).once('value', (snapshotWall: any) => {
                        if (snapshotWall.val() === null) {
                            return res.status(404).json({ error: 'Wall not found' });
                        } else {
                            admin.database().ref('/routes/' + gymId + '/' + wallId + '/' + routeId).set(route).then(() => {
                                res.status(201).json({ data: { route } });
                            }, (error: any) => {
                                handleFirebaseError(error, res, next, 'Error creating route');
                            });
                        }
                    }, (error: any) => {
                        handleFirebaseError(error, res, next, 'Error getting wall');
                    });
                }
            }, (error: any) => {
                handleFirebaseError(error, res, next, 'Error getting gym');
            });
        } else {
            return res.status(403).json({ error: 'Not authorized' });
        }
    }, (error: any) => {
        handleFirebaseError(error, res, next, 'Error checking if user is staff');
    });
});

// Update features for given route
router.patch('/:routeId/feature', (req: Request, res: Response, next: NextFunction) => {
    const newFeatures: string[] = (req.body.features as string).split(',');
    const gymId = req.query.gymId ? String(req.query.gymId) : null;
    const wallId = req.query.wallId ? String(req.query.wallId) : null;
    const routeId = req.params.routeId;
    const currentUser = req.headers.uid as string;
    isStaff(gymId, currentUser).then((isStaffBool: boolean) => {
        if (isStaffBool || req.headers.admin) {
            if (gymId === null) {
                return res.status(400).json({ error: 'Invalid gymId' });
            }
            if (newFeatures === null || newFeatures.length === 0 || !validateRouteFeatures(newFeatures)) {
                return res.status(400).json({ error: 'Invalid features' });
            }
            admin.database().ref('/gyms/' + gymId).once('value', (snapshotGym: any) => {
                if (snapshotGym.val() === null) {
                    return res.status(404).json({ error: 'Gym not found' });
                } else {
                    admin.database().ref('/walls/' + wallId).once('value', (snapshotWall: any) => {
                        if (snapshotWall.val() === null) {
                            return res.status(404).json({ error: 'Wall not found' });
                        } else {
                            admin.database().ref('/routes/' + gymId + '/' + wallId + '/' + routeId).once('value', (snapshot: any) => {
                                if (snapshot.val() === null) {
                                    return res.status(404).json({ error: 'Route not found' });
                                } else {
                                    admin.database().ref('/routes/' + gymId + '/' + wallId + '/' + routeId + '/features').update({ features: newFeatures }).then(() => {
                                        res.status(200).json({ data: { route: snapshot.val() } });
                                    }, (error: any) => {
                                        handleFirebaseError(error, res, next, 'Error updating features');
                                    });
                                }
                            }, (error: any) => {
                                handleFirebaseError(error, res, next, 'Error getting route');
                            });
                        }
                    }, (error: any) => {
                        handleFirebaseError(error, res, next, 'Error getting wall');
                    });
                }
            }, (error: any) => {
                handleFirebaseError(error, res, next, 'Error getting gym');
            });
        } else {
            return res.status(403).json({ error: 'Not authorized' });
        }
    }, (error: any) => {
        handleFirebaseError(error, res, next, 'Error checking if user is staff');
    });
}).all('/:routeId/feature', (_req: Request, _res: Response, next: NextFunction) => {
    next(new APIException(405, 'Method not allowed'));
});

// Delete route
router.delete('/:routeId', (req: Request, res: Response, next: NextFunction) => {
    const gymId = req.query.gymId ? String(req.query.gymId) : null;
    const wallId = req.query.wallId ? String(req.query.wallId) : null;
    const routeId = req.params.routeId;
    const currentUser = req.headers.uid as string;
    isStaff(gymId, currentUser).then((isStaffBool: boolean) => {
        if (isStaffBool || req.headers.admin) {
            if (gymId === null) {
                return res.status(400).json({ error: 'Invalid gymId' });
            }
            if (wallId === null) {
                return res.status(400).json({ error: 'Invalid wallId' });
            }
            admin.database().ref('/gyms/' + gymId).once('value', (snapshotGym: any) => {
                if (snapshotGym.val() === null) {
                    return res.status(404).json({ error: 'Gym not found' });
                } else {
                    admin.database().ref('/walls/' + wallId).once('value', (snapshotWall: any) => {
                        if (snapshotWall.val() === null) {
                            return res.status(404).json({ error: 'Wall not found' });
                        } else {
                            admin.database().ref('/routes/' + gymId + '/' + wallId + '/' + routeId).once('value', (snapshot: any) => {
                                if (snapshot.val() === null) {
                                    return res.status(404).json({ error: 'Route not found' });
                                } else {
                                    admin.database().ref('/routes/' + gymId + '/' + wallId + '/' + routeId).remove().then(() => {
                                        res.status(200).json({ data: { route: snapshot.val() } });
                                    }, (error: any) => {
                                        handleFirebaseError(error, res, next, 'Error deleting route');
                                    });
                                }
                            }, (error: any) => {
                                handleFirebaseError(error, res, next, 'Error getting route');
                            });
                        }
                    }, (error: any) => {
                        handleFirebaseError(error, res, next, 'Error getting wall');
                    });
                }
            }, (error: any) => {
                handleFirebaseError(error, res, next, 'Error getting gym');
            });
        } else {
            return res.status(403).json({ error: 'Not authorized' });
        }
    }, (error: any) => {
        handleFirebaseError(error, res, next, 'Error checking if user is staff');
    });
}).all('/:routeId', (_req: Request, _res: Response, next: NextFunction) => {
    next(new APIException(405, 'Method not allowed'));
});

export default router;

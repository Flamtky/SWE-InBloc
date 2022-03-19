import { NextFunction, Request, Response } from "express";
import * as admin from 'firebase-admin';
import APIException from "../APIException";
import Wall from "../interfaces/Wall";
import express from "express";
import { handleFirebaseError, validateWall, validateWallFeatures } from "../HelperFunctions";
import { isStaff } from "./gymRoutes";

const router = express.Router();

router.use((req, res, next) => {
    if (req.headers['content-type'] !== 'application/json') {
        return res.status(415).json({ error: 'Unsupported Media Type' });
    }
    next();
});

// All wall routes

// Get all walls or for given gym
router.get('/', (req: Request, res: Response, next: NextFunction) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const gymId = req.query.gymId ? String(req.query.gymId) : null;

    if (isNaN(limit) || limit < 1 || limit > 1000) {
        return res.status(400).json({ error: 'Invalid limit' });
    }

    if (gymId === null) {
        admin.database().ref('/walls').limitToFirst(limit).once('value', (snapshot: any) => {
            if (snapshot.val() === null) {
                return res.status(404).json({ error: 'No walls found' });
            } else {
                res.status(200).json({ data: { walls: snapshot.val() } });
            }
        }, (error: any) => {
            handleFirebaseError(error, res, next, 'Error getting walls');
        });
    } else {
        admin.database().ref('/gyms/' + gymId).once('value').then((snapshot) => {
            if (snapshot.val() === null) {
                return res.status(404).json({ error: 'Gym not found' });
            } else {
                admin.database().ref('/walls/' + gymId).limitToFirst(limit).once('value', (innerSnapshot: any) => {
                    if (innerSnapshot.val() === null) {
                        return res.status(404).json({ error: 'No walls found' });
                    } else {
                        res.status(200).json({ data: { walls: innerSnapshot.val() } });
                    }
                }).catch((error: any) => {
                    handleFirebaseError(error, res, next, 'Error getting walls from gym');
                });
            }
        }).catch((err) => {
            handleFirebaseError(err, res, next, 'Error getting gym');
        });
    }
}).all('/', (_req: Request, _res: Response, next: NextFunction) => {
    next(new APIException(405, 'Method not allowed'));
});

// Get wall by wallId
router.get('/:wallId', (req: Request, res: Response, next: NextFunction) => {
    const wallId = req.params.wallId;
    const gymId = req.query.gymId ? String(req.query.gymId) : null;

    if (gymId === null) {
        return res.status(400).json({ error: 'Invalid gymId' });
    }

    admin.database().ref('/gyms/' + gymId).once('value', (snapshotGym: any) => {
        if (snapshotGym.val() === null) {
            return res.status(404).json({ error: 'Gym not found' });
        } else {
            admin.database().ref('/walls/' + gymId + '/' + wallId).once('value', (snapshotWall: any) => {
                if (snapshotWall.val() === null) {
                    return res.status(404).json({ error: 'Wall not found' });
                } else {
                    res.status(200).json({ data: { wall: snapshotWall.val() } });
                }
            }).catch((error: any) => {
                handleFirebaseError(error, res, next, 'Error getting wall');
            });
        }
    }).catch((err) => {
        handleFirebaseError(err, res, next, 'Error getting gym');
    });
});

// Create wall
router.post('/:wallId', (req: Request, res: Response, next: NextFunction) => {
    const wall: Wall = req.body;
    const gymId = req.query.gymId ? String(req.query.gymId) : null;
    const wallId = req.params.wallId;
    const wallSetDate: Date = new Date(wall.setDate);
    const currentUser = req.headers.uid as string;
    if (!validateWall(wall)) {
        return res.status(400).json({ error: 'Invalid wall' });
    }
    if (gymId === null) {
        return res.status(400).json({ error: 'Invalid gymId' });
    }
    if (wall.setDate === null || wallSetDate.toString() === 'Invalid Date' || wallSetDate.getFullYear() < new Date().getFullYear()) {
        return res.status(400).json({ error: 'Invalid setDate' });
    }
    if (!validateWallFeatures(wall.features.split(','))) {
        return res.status(400).json({ error: 'Invalid features' });
    }
    isStaff(gymId, currentUser).then((isStaffBool: boolean) => {
        if (isStaffBool || req.headers.admin) {
            admin.database().ref('/gyms/' + gymId).once('value', (snapshotGym: any) => {
                if (snapshotGym.val() === null) {
                    return res.status(404).json({ error: 'Gym not found' });
                } else {
                    admin.database().ref('/walls/' + gymId + "/" + wallId).set(wall).then(() => {
                        res.status(200).json({ data: { wall } });
                    }).catch((error: any) => {
                        handleFirebaseError(error, res, next, 'Error creating wall');
                    });
                }
            }).catch((err) => {
                handleFirebaseError(err, res, next, 'Error getting gym');
            });
        } else {
            return res.status(403).json({ error: 'Not authorised to create a wall for this gym' });
        }
    }).catch((err) => {
        handleFirebaseError(err, res, next, 'Error checking if user is staff');
    });
});

// Update setDate for given wall
router.patch('/:wallId/setDate', (req: Request, res: Response, next: NextFunction) => {
    const newSetDate: Date = new Date(req.body.setDate || new Date());
    const gymId = req.query.gymId ? String(req.query.gymId) : null;
    const wallId = req.params.wallId;
    const currentUser = req.headers.uid as string;
    isStaff(gymId, currentUser).then((isStaffBool: boolean) => {
        if (isStaffBool || req.headers.admin) {
            if (gymId === null) {
                return res.status(400).json({ error: 'Invalid gymId' });
            }
            if (newSetDate === null || newSetDate.toString() === 'Invalid Date' || newSetDate.getFullYear() < new Date().getFullYear()) {
                return res.status(400).json({ error: 'Invalid setDate' });
            }

            admin.database().ref('/gyms/' + gymId).once('value', (snapshotGym: any) => {
                if (snapshotGym.val() === null) {
                    return res.status(404).json({ error: 'Gym not found' });
                } else {
                    admin.database().ref('/walls/' + gymId + "/" + wallId).once('value', (snapshotWall: any) => {
                        if (snapshotWall.val() === null) {
                            return res.status(404).json({ error: 'Wall not found' });
                        } else {
                            admin.database().ref('/walls/' + gymId + "/" + wallId).update({ setDate: newSetDate }).then(() => {
                                res.status(200).json({ data: { wall: snapshotWall.val() } });
                            }).catch((error: any) => {
                                handleFirebaseError(error, res, next, 'Error updating wall');
                            });
                        }
                    }).catch((error: any) => {
                        handleFirebaseError(error, res, next, 'Error getting wall');
                    });
                }
            }).catch((err) => {
                handleFirebaseError(err, res, next, 'Error getting gym');
            });
        } else {
            return res.status(403).json({ error: 'Not authorised to update wall' });
        }
    }).catch((err) => {
        handleFirebaseError(err, res, next, 'Error checking if user is staff');
    });
}).all('/:wallId/setDate', (_req: Request, _res: Response, next: NextFunction) => {
    next(new APIException(405, 'Method not allowed'));
});

// Update features for given wall
router.patch('/:wallId/feature', (req: Request, res: Response, next: NextFunction) => {
    const newFeatures: string[] = (req.body.features as string).split(',');
    const gymId = req.query.gymId ? String(req.query.gymId) : null;
    const wallId = req.params.wallId;
    const currentUser = req.headers.uid as string;
    isStaff(gymId, currentUser).then((isStaffBool: boolean) => {
        if (isStaffBool || req.headers.admin) {
            if (gymId === null) {
                return res.status(400).json({ error: 'Invalid gymId' });
            }
            if (newFeatures === null || newFeatures.length === 0 || !validateWallFeatures(newFeatures)) {
                return res.status(400).json({ error: 'Invalid features' });
            }
            admin.database().ref('/gyms/' + gymId).once('value', (snapshotGym: any) => {
                if (snapshotGym.val() === null) {
                    return res.status(404).json({ error: 'Gym not found' });
                } else {
                    admin.database().ref('/walls/' + gymId + "/" + wallId).once('value', (snapshotWall: any) => {
                        if (snapshotWall.val() === null) {
                            return res.status(404).json({ error: 'Wall not found' });
                        } else {
                            admin.database().ref('/walls/' + gymId + "/" + wallId).update({ feature: newFeatures }).then(() => {
                                res.status(200).json({ data: { wall: snapshotWall.val() } });
                            }).catch((error: any) => {
                                handleFirebaseError(error, res, next, 'Error updating wall');
                            });
                        }
                    }).catch((error: any) => {
                        handleFirebaseError(error, res, next, 'Error getting wall');
                    });
                }
            }).catch((err) => {
                handleFirebaseError(err, res, next, 'Error getting gym');
            });
        } else {
            return res.status(403).json({ error: 'Not authorised to update wall' });
        }
    }).catch((err) => {
        handleFirebaseError(err, res, next, 'Error checking if user is staff');
    });
}).all('/:wallId/feature', (_req: Request, _res: Response, next: NextFunction) => {
    next(new APIException(405, 'Method not allowed'));
});

// Delete wall
router.delete('/:wallId', (req: Request, res: Response, next: NextFunction) => {
    const gymId = req.query.gymId ? String(req.query.gymId) : null;
    const wallId = req.params.wallId;
    const currentUser = req.headers.uid as string;
    isStaff(gymId, currentUser).then((isStaffBool: boolean) => {
        if (isStaffBool || req.headers.admin) {
            if (gymId === null) {
                return res.status(400).json({ error: 'Invalid gymId' });
            }
            admin.database().ref('/gyms/' + gymId).once('value', (snapshotGym: any) => {
                if (snapshotGym.val() === null) {
                    return res.status(404).json({ error: 'Gym not found' });
                } else {
                    admin.database().ref('/walls/' + gymId + "/" + wallId).once('value', (snapshotWall: any) => {
                        if (snapshotWall.val() === null) {
                            return res.status(404).json({ error: 'Wall not found' });
                        } else {
                            admin.database().ref('/walls/' + gymId + "/" + wallId).remove().then(() => {
                                res.status(200).json({ data: { wall: null } });
                            }).catch((error: any) => {
                                handleFirebaseError(error, res, next, 'Error deleting wall');
                            });
                        }
                    }).catch((error: any) => {
                        handleFirebaseError(error, res, next, 'Error getting wall');
                    });
                }
            }).catch((err) => {
                handleFirebaseError(err, res, next, 'Error getting gym');
            });
        } else {
            return res.status(403).json({ error: 'Not authorised to delete wall' });
        }
    }).catch((err) => {
        handleFirebaseError(err, res, next, 'Error checking if user is staff');
    });
}).all('/:wallId', (_req: Request, _res: Response, next: NextFunction) => {
    next(new APIException(405, 'Method not allowed'));
});

// Get image for given wall
router.get('/:wallId/image', (req: Request, res: Response, next: NextFunction) => {
    const gymId = req.query.gymId ? String(req.query.gymId) : null;
    const wallId = req.params.wallId;
    if (gymId === null) {
        return res.status(400).json({ error: 'Invalid gymId' });
    }

    admin.database().ref('/gyms/' + gymId).once('value', (snapshotGym: any) => {
        if (snapshotGym.val() === null) {
            return res.status(404).json({ error: 'Gym not found' });
        } else {
            admin.database().ref('/walls/' + gymId + "/" + wallId).once('value', (snapshotWall: any) => {
                if (snapshotWall.val() === null) {
                    return res.status(404).json({ error: 'Wall not found' });
                } else {
                    admin.storage().bucket().file('Gyms/' + gymId + "/Walls/" + wallId + ".jpg").get((err: any, file: any) => {
                        if (err) {
                            if (err?.errors[0]?.reason) {
                                next(new APIException(404, 'Wall image not found'));
                            } else {
                                handleFirebaseError(err, res, next, 'Error getting wall image');
                            }
                        } else {
                            file.getSignedUrl({
                                action: 'read',
                                expires: '03-09-2491'
                            }).then((url: string) => {
                                res.status(200).json({ data: { image: url[0] } });
                            });
                        }
                    });
                }
            }).catch((error: any) => {
                handleFirebaseError(error, res, next, 'Error getting wall');
            });
        }
    }).catch((err) => {
        handleFirebaseError(err, res, next, 'Error getting gym');
    });
});

// Set image for given wall
router.post('/:wallId/image', (req: Request, res: Response, next: NextFunction) => {
    const gymId = req.query.gymId ? String(req.query.gymId) : null;
    const wallId = req.params.wallId;
    const currentUser = req.headers.uid as string;
    isStaff(gymId, currentUser).then((isStaffBool: boolean) => {
        if (isStaffBool || req.headers.admin) {
            if (gymId === null) {
                return res.status(400).json({ error: 'Invalid gymId' });
            }
            // base64 image
            const image = req.body.image;
            if (!image || !image.startsWith('data:image/jpeg;base64,')) {
                return res.status(400).json({ error: 'Invalid image' });
            }
            const imageData = image.replace(/^data:image\/jpeg;base64,/, '');
            const fileName = 'Gyms/' + gymId + "/Walls/" + wallId + ".jpg";
            const imageBuffer = Buffer.from(imageData, 'base64');
            // max image size is 2MB
            if (imageBuffer.length > 2000000) {
                return next(new APIException(413, 'Image is too big'));
            }
            admin.database().ref('/gyms/' + gymId).once('value', (snapshotGym: any) => {
                if (snapshotGym.val() === null) {
                    return res.status(404).json({ error: 'Gym not found' });
                } else {
                    admin.storage().bucket().file(fileName).save(imageBuffer, {
                        metadata: {
                            contentType: 'image/jpeg',
                            public: true,
                            cacheControl: 'public, max-age=31536000'
                        }
                    }).then(() => {
                        admin.storage().bucket().file(fileName).get((err: any, file: any) => {
                            if (err) {
                                handleFirebaseError(err, res, next, 'Error getting wall image');
                            } else {
                                file.getSignedUrl({
                                    action: 'read',
                                    expires: '03-09-2491'
                                }).then((url: string) => {
                                    res.setHeader('Location', url[0]);
                                    res.status(201).json({ data: { image: url[0] } });
                                });
                            }
                        });
                    }).catch((error: any) => {
                        handleFirebaseError(error, res, next, 'Error setting wall image');
                    });
                }
            }).catch((err) => {
                handleFirebaseError(err, res, next, 'Error getting gym');
            });
        } else {
            return res.status(403).json({ error: 'Not authorised to set wall image' });
        }
    }).catch((err) => {
        handleFirebaseError(err, res, next, 'Error checking if user is staff');
    });
});

// Delete image for given wall
router.delete('/:wallId/image', (req: Request, res: Response, next: NextFunction) => {
    const gymId = req.query.gymId ? String(req.query.gymId) : null;
    const wallId = req.params.wallId;
    const currentUser = req.headers.uid as string;
    isStaff(gymId, currentUser).then((isStaffBool: boolean) => {
        if (isStaffBool || req.headers.admin) {
            if (gymId === null) {
                return res.status(400).json({ error: 'Invalid gymId' });
            }
            admin.database().ref('/gyms/' + gymId).once('value', (snapshotGym: any) => {
                if (snapshotGym.val() === null) {
                    return res.status(404).json({ error: 'Gym not found' });
                } else {
                    admin.database().ref('/walls/' + gymId + "/" + wallId).once('value', (snapshotWall: any) => {
                        if (snapshotWall.val() === null) {
                            return res.status(404).json({ error: 'Wall not found' });
                        } else {
                            admin.storage().bucket().file('Gyms/' + gymId + "/Walls/" + wallId + ".jpg").delete((errImg: any, _file: any) => {
                                if (errImg) {
                                    if (errImg?.errors[0]?.reason === 'notFound') {
                                        next(new APIException(404, 'Wall image not found'));
                                    } else {
                                        handleFirebaseError(errImg, res, next, 'Error deleting wall image');
                                    }
                                } else {
                                    res.status(200).json({ data: { image: null } });
                                }
                            });
                        }
                    }).catch((error: any) => {
                        handleFirebaseError(error, res, next, 'Error getting wall');
                    });
                }
            }).catch((err) => {
                handleFirebaseError(err, res, next, 'Error getting gym');
            });
        } else {
            return res.status(403).json({ error: 'Not authorised to delete wall image' });
        }
    }).catch((err) => {
        handleFirebaseError(err, res, next, 'Error checking if user is staff');
    });
}).all('/:wallId/image', (_req: Request, _res: Response, next: NextFunction) => {
    next(new APIException(405, 'Method not allowed'));
});

//TODO: add difficulty routes and colors
export default router;

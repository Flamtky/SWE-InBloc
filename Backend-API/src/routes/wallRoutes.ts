import { NextFunction, Request, Response } from "express";
import * as admin from 'firebase-admin';
import APIException from "../APIException";
import Wall, { WallFeatures } from "../interfaces/Wall";
import express from "express";
import { handleFirebaseError, validateWall, validateWallFeatures } from "../HelperFunctions";

const router = express.Router();

router.use((req, res, next) => {
    if (req.headers['content-type'] !== 'application/json') {
        return res.status(415).json({ error: 'Unsupported Media Type' });
    }
    next();
});

// All wall routes // TODO: add authentication (staff only)
// TODO: added routes to docs

// Get all walls or for given gym
router.get('/', (req: Request, res: Response, next: NextFunction) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const gymId = req.query.gymId ? String(req.query.gymId) : null;

    if (isNaN(limit)) {
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
    if (!validateWall(wall)) {
        return res.status(400).json({ error: 'Invalid wall' });
    }
    if (gymId === null) {
        return res.status(400).json({ error: 'Invalid gymId' });
    }
    if (wall.setDate === null || wallSetDate.toString() === 'Invalid Date' || wallSetDate.getFullYear() < new Date().getFullYear()) {
        return res.status(400).json({ error: 'Invalid setDate' });
    }

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

});

// Update setDate for given wall
router.patch('/:wallId/setDate', (req: Request, res: Response, next: NextFunction) => {
    const newSetDate: Date = new Date(req.body.setDate || new Date());
    const gymId = req.query.gymId ? String(req.query.gymId) : null;
    const wallId = req.params.wallId;
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
}).all('/:wallId/setDate', (_req: Request, _res: Response, next: NextFunction) => {
    next(new APIException(405, 'Method not allowed'));
});

// Update features for given wall
router.patch('/:wallId/feature', (req: Request, res: Response, next: NextFunction) => {
    const newFeatures: string[] = (req.body.features as string).split(',');
    const gymId = req.query.gymId ? String(req.query.gymId) : null;
    const wallId = req.params.wallId;
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
}).all('/:wallId/feature', (_req: Request, _res: Response, next: NextFunction) => {
    next(new APIException(405, 'Method not allowed'));
});

// Delete wall
router.delete('/:wallId', (req: Request, res: Response, next: NextFunction) => {
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
                    admin.database().ref('/walls/' + gymId + "/" + wallId).remove().then(() => {
                        res.status(200).json({ data: { wall: snapshotWall.val() } });
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
                    admin.storage().bucket().file('Gyms/' + gymId + "/Walls/"+wallId+".jpg").get((err: any, file: any) => {
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
    if (gymId === null) {
        return res.status(400).json({ error: 'Invalid gymId' });
    }
    // base64 image
    const image = req.body.image;
    if (!image || !image.startsWith('data:image/jpeg;base64,')) {
        return res.status(400).json({ error: 'Invalid image' });
    }
    const imageData = image.replace(/^data:image\/jpeg;base64,/, '');
    const fileName = 'Gyms/' + gymId + "/Walls/"+wallId+".jpg";
    const imageBuffer = Buffer.from(imageData, 'base64');
    if (imageBuffer.length > 2000000) {
        return next(new APIException(413, 'Image is too big'));
    }
    admin.storage().bucket().file(fileName).save(imageBuffer, {
        metadata: {
            contentType: 'image/jpeg',
            public: true,
            cacheControl: 'public, max-age=31536000'
        }
    }).then(() => {
        admin.storage().bucket().file(fileName).get((err: any, file: any) => {
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
    }).catch((error: any) => {
        handleFirebaseError(error, res, next, 'Error setting wall image');
    });
}).all('/:wallId/image', (_req: Request, _res: Response, next: NextFunction) => {
    next(new APIException(405, 'Method not allowed'));
});

// TODO: add delete image route

export default router;

/*

router.post('/:gymId/logo', (req: Request, res: Response, next: NextFunction) => {
    const gymId = req.params.gymId;
    const currentUser = req.headers.uid as string;
    if (!req.headers.admin) {
        isGymOwner(gymId, currentUser).then((isOwner) => {
            if (isOwner) {
                // base 64 image
                const logo = req.body.logo;
                if (!logo || !logo.startsWith('data:image/jpeg;base64,')) {
                    return next(new APIException(400, 'Invalid logo'));
                }
                const base64Data = logo.replace(/^data:image\/jpeg;base64,/, '');
                const fileName = gymId + '.jpg';
                const image = Buffer.from(base64Data, 'base64');
                // if image is bigger than 2MB, return error
                if (image.length > 2000000) {
                    return next(new APIException(400, 'Image is too big'));
                }
                // upload image to storage
                admin.storage().bucket().file('Gyms/' + fileName).save(image, {
                    metadata: {
                        contentType: 'image/jpeg',
                        public: true,
                        cacheControl: 'public, max-age=31536000'
                    }
                }).then(() => {
                    admin.storage().bucket().file('Gyms/' + fileName).get((err: any, file: any) => {
                        if (err) {
                            if (err?.errors[0]?.reason) {
                                next(new APIException(404, 'Gym logo not found'));
                            } else {
                                handleFirebaseError(err, res, next, 'Error getting gym logo');
                            }
                        } else {
                            file.getSignedUrl({
                                action: 'read',
                                expires: '03-09-2491'
                            }).then((url: string) => {
                                res.status(200).json({ data: { logo: url[0] } });
                            });
                        }
                    });
                }).catch((err) => {
                    handleFirebaseError(err, res, next, 'Error setting gym logo');
                });
            } else {
                next(new APIException(403, 'Not authorised to set this gym logo'));
            }
        }).catch((err) => {
            handleFirebaseError(err, res, next, 'Error checking if user is owner');
        });
    } else {
        // base 64 image
        const logo = req.body.logo;
        if (!logo || !logo.startsWith('data:image/jpeg;base64,')) {
            return next(new APIException(400, 'Invalid logo'));
        }
        const base64Data = logo.replace(/^data:image\/jpeg;base64,/, '');
        const fileName = gymId + '.jpg';
        const image = Buffer.from(base64Data, 'base64');
        // if image is bigger than 2MB, return error
        if (image.length > 2000000) {
            return next(new APIException(400, 'Image is too big'));
        }
        // upload image to storage
        admin.storage().bucket().file('Gyms/' + fileName).save(image, {
            metadata: {
                contentType: 'image/jpeg',
                public: true,
                cacheControl: 'public, max-age=31536000'
            }
        }).then(() => {
            admin.storage().bucket().file('Gyms/' + fileName).get((err: any, file: any) => {
                if (err) {
                    if (err?.errors[0]?.reason) {
                        next(new APIException(404, 'Gym logo not found'));
                    } else {
                        handleFirebaseError(err, res, next, 'Error getting gym logo');
                    }
                } else {
                    file.getSignedUrl({
                        action: 'read',
                        expires: '03-09-2491'
                    }).then((url: string) => {
                        res.status(200).json({ data: { logo: url[0] } });
                    });
                }
            });
        }).catch((err) => {
            handleFirebaseError(err, res, next, 'Error setting gym logo');
        });
    }
}).all('/:gymId/logo', (_req: Request, _res: Response, next: NextFunction) => {
    next(new APIException(405, 'Method not allowed'));
});*/
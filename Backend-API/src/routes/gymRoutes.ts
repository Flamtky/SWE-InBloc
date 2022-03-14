import { NextFunction, Request, Response } from "express";
import * as admin from 'firebase-admin';
import APIException from "../APIException";
import Gym, { Day, Openings } from "../interfaces/Gym";
import express from "express";
import { handleFirebaseError, steriliseDayFromInterface, steriliseGym, steriliseOpenings, validateDate, validateDay, validateDayFromInterface, validateGym, validateOpenings } from "../HelperFunctions";

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
    if (isNaN(limit)) {
        return res.status(400).json({ error: 'Invalid limit' });
    }

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
    const currentUser = req.headers.uid as string;
    if (!req.headers.admin) {
        isGymOwner(id, currentUser).then((isOwner) => {
            if (isOwner) {
                if (Object.keys(gym).length === 0) {
                    return res.status(400).json({ error: 'No gym data provided' });
                }
                if (!validateGym(gym, true)) {
                    return next(new APIException(400, 'Invalid gym'));
                }
                admin.database().ref('/gyms/' + id).update(gym).then(() => {
                    res.status(200).json({ data: { gym } });
                }).catch((err) => {
                    handleFirebaseError(err, res, next, 'Error updating gym');
                });
            } else {
                next(new APIException(403, 'Not authorised to update this gym'));
            }
        }).catch((err) => {
            handleFirebaseError(err, res, next, 'Error checking if user is owner');
        });
    } else {
        if (Object.keys(gym).length === 0) {
            return res.status(400).json({ error: 'No gym data provided' });
        }
        if (!validateGym(gym, true)) {
            return next(new APIException(400, 'Invalid gym'));
        }
        admin.database().ref('/gyms/' + id).update(gym).then(() => {
            res.status(200).json({ data: { gym } });
        }).catch((err) => {
            handleFirebaseError(err, res, next, 'Error updating gym');
        });
    }
});

// Create gym by gymId
router.post('/:gymid', (req: Request, res: Response, next: NextFunction) => {
    const gymId = req.params.gymid;
    const gym: Gym = steriliseGym(req.body as Gym, true);

    if (!req.headers.admin) {
        return next(new APIException(403, 'Not authorised to create this gym'));
    }
    if (Object.keys(gym).length === 0) {
        return res.status(400).json({ error: 'No gym data provided' });
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
        return next(new APIException(403, 'Not authorised to delete this gym'));
    }
    admin.database().ref('/gyms/' + gymId).remove().then(() => {
        res.status(200).json({ data: { gym: null } });
    }).catch((err) => {
        handleFirebaseError(err, res, next, 'Error deleting gym');
    });
}).all('/:gymId', (_req: Request, _res: Response, next: NextFunction) => {
    next(new APIException(405, 'Method not allowed'));
});

// Logo routes

// Get gym logo
router.get('/:gymId/logo', (req: Request, res: Response, next: NextFunction) => {
    const gymId = req.params.gymId;
    // Get logo from storage logo -> /gyms/gymid.jpg
    admin.storage().bucket().file('Gyms/' + gymId + '.jpg').get((err: any, file: any) => {
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
});

// Set gym logo
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
    const currentUser = req.headers.uid as string;
    if (!req.headers.admin) {
        isGymOwner(gymId, currentUser).then((isOwner) => {
            if (isOwner) {
                if (!validateOpenings(opening)) {
                    return next(new APIException(400, 'Invalid opening'));
                }
                admin.database().ref('/gyms/' + gymId).once('value').then((snapshot) => {
                    if (snapshot.val() === null) {
                        next(new APIException(404, 'Gym not found'));
                    } else {
                        admin.database().ref('/openings/' + gymId).set(opening).then(() => {
                            res.status(200).json({ data: { opening } });
                        }).catch((err) => {
                            handleFirebaseError(err, res, next, 'Error updating opening');
                        });
                    }
                }).catch((err) => {
                    handleFirebaseError(err, res, next, 'Error getting gym');
                });
            } else {
                next(new APIException(403, 'Not authorised to set opening for this gym'));
            }
        });
    } else {
        if (!validateOpenings(opening)) {
            return next(new APIException(400, 'Invalid opening'));
        }
        admin.database().ref('/gyms/' + gymId).once('value').then((snapshot) => {
            if (snapshot.val() === null) {
                next(new APIException(404, 'Gym not found'));
            } else {
                admin.database().ref('/openings/' + gymId).set(opening).then(() => {
                    res.status(200).json({ data: { opening } });
                }).catch((err) => {
                    handleFirebaseError(err, res, next, 'Error updating opening');
                });
            }
        }).catch((err) => {
            handleFirebaseError(err, res, next, 'Error getting gym');
        });
    }
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
    const currentUser = req.headers.uid as string;
    if (!req.headers.admin) {
        isGymOwner(gymId, currentUser).then((isOwner) => {
            if (isOwner) {
                if (!validateDay(day.trim().toLowerCase())) {
                    return next(new APIException(400, 'Invalid day'));
                }
                if (!validateDayFromInterface(openingDay)) {
                    return next(new APIException(400, 'Invalid opening'));
                }
                admin.database().ref('/gyms/' + gymId).once('value').then((snapshot) => {
                    if (snapshot.val() === null) {
                        next(new APIException(404, 'Gym not found'));
                    } else {
                        admin.database().ref('/openings/' + gymId + '/' + day).update(openingDay).then(() => {
                            res.status(200).json({ data: { [day]: openingDay } });
                        }).catch((err) => {
                            handleFirebaseError(err, res, next, 'Error updating opening');
                        });
                    }
                }).catch((err) => {
                    handleFirebaseError(err, res, next, 'Error getting gym');
                });
            } else {
                next(new APIException(403, 'Not authorised to update opening for this gym'));
            }
        });
    } else {
        if (!validateDay(day.trim().toLowerCase())) {
            return next(new APIException(400, 'Invalid day'));
        }
        if (!validateDayFromInterface(openingDay)) {
            return next(new APIException(400, 'Invalid opening'));
        }
        admin.database().ref('/gyms/' + gymId).once('value').then((snapshot) => {
            if (snapshot.val() === null) {
                next(new APIException(404, 'Gym not found'));
            } else {
                admin.database().ref('/openings/' + gymId + '/' + day).update(openingDay).then(() => {
                    res.status(200).json({ data: { [day]: openingDay } });
                }).catch((err) => {
                    handleFirebaseError(err, res, next, 'Error updating opening');
                });
            }
        }).catch((err) => {
            handleFirebaseError(err, res, next, 'Error getting gym');
        });
    }
}).all('/:gymId/openings/:day', (_req: Request, _res: Response, next: NextFunction) => {
    next(new APIException(405, 'Method not allowed'));
});

//TODO: Add to docs
// Get overridden opening for gym by gymId and day (if day not given, returns all overridden openings)
router.get('/:gymId/holidays', (req: Request, res: Response, next: NextFunction) => {
    const gymId = req.params.gymId;
    const date = req.query.date ? String(req.query.date) : "null";
    if (date === 'null') {
        admin.database().ref('/overridden-openings/' + gymId).once('value', (snapshot: any) => {
            if (snapshot.val() === null) {
                next(new APIException(404, 'No overridden openings found for given gym'));
            } else {
                res.status(200).json({ data: { overriddenOpenings: snapshot.val() } });
            }
        }, (error: any) => {
            handleFirebaseError(error, res, next, 'Error getting overridden openings');
        });
    } else {
        if (!validateDate(date)) {
            return next(new APIException(400, 'Invalid date'));
        }
        admin.database().ref('/overridden-openings/' + gymId + '/' + date).once('value', (snapshot: any) => {
            if (snapshot.val() === null) {
                next(new APIException(404, 'No overridden opening found for given gym and date'));
            } else {
                res.status(200).json({ data: { [date]: snapshot.val() } });
            }
        }, (error: any) => {
            handleFirebaseError(error, res, next, 'Error getting overridden opening');
        });
    }
})

// Set overridden opening for gym by gymId and day
router.post('/:gymId/holidays', (req: Request, res: Response, next: NextFunction) => {
    const gymId = req.params.gymId;
    const date = req.query.date ? String(req.query.date) : "null";
    const day: Day = steriliseDayFromInterface(req.body as Day, false);
    if (date === 'null' || !validateDate(date)) {
        return next(new APIException(400, 'Invalid date'));
    }
    if (!validateDayFromInterface(day)) {
        return next(new APIException(400, 'Invalid opening'));
    }
    const currentUser = req.headers.uid as string;
    if (!req.headers.admin) {
        isGymOwner(gymId, currentUser).then((isOwner) => {
            if (isOwner) {
                admin.database().ref('/overridden-openings/' + gymId + '/' + date).set(day).then(() => {
                    res.status(200).json({ data: { [date]: day } });
                }).catch((err) => {
                    handleFirebaseError(err, res, next, 'Error updating overridden opening');
                });
            } else {
                next(new APIException(403, 'Not authorised to set overridden opening for this gym'));
            }
        });
    } else {
        admin.database().ref('/overridden-openings/' + gymId + '/' + date).set(day).then(() => {
            res.status(200).json({ data: { [date]: day } });
        }).catch((err) => {
            handleFirebaseError(err, res, next, 'Error updating overridden opening');
        });
    }
});

// Delete overridden opening for gym by gymId and day
router.delete('/:gymId/holidays', (req: Request, res: Response, next: NextFunction) => {
    const gymId = req.params.gymId;
    const date = req.query.date ? String(req.query.date) : "null";
    if (date === 'null' || !validateDate(date)) {
        return next(new APIException(400, 'Invalid date'));
    }
    const currentUser = req.headers.uid as string;
    if (!req.headers.admin) {
        isGymOwner(gymId, currentUser).then((isOwner) => {
            if (isOwner) {
                admin.database().ref('/overridden-openings/' + gymId + '/' + date).remove().then(() => {
                    res.status(200).json({ data: { [date]: null } });
                }).catch((err) => {
                    handleFirebaseError(err, res, next, 'Error deleting overridden opening');
                });
            } else {
                next(new APIException(403, 'Not authorised to delete overridden opening for this gym'));
            }
        });
    } else {
        admin.database().ref('/overridden-openings/' + gymId + '/' + date).remove().then(() => {
            res.status(200).json({ data: { [date]: null } });
        }).catch((err) => {
            handleFirebaseError(err, res, next, 'Error deleting overridden opening');
        });
    }
}).all('/:gymId/holidays', (_req: Request, _res: Response, next: NextFunction) => {
    next(new APIException(405, 'Method not allowed'));
});

export default router;

const isGymOwner = (gymId: string, userId: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        admin.database().ref('/permissions/' + gymId + '/' + userId).once('value', (snapshot: any) => {
            // if permission power is >= 50, then user is owner
            if (snapshot.val() !== null && snapshot.val() >= 50) {
                resolve(true);
            } else {
                resolve(false);
            }
        }, (error: any) => {
            reject(error);
        });
    });
};

const isStaff = (gymId: string, userId: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        admin.database().ref('/permissions/' + gymId + '/' + userId).once('value', (snapshot: any) => {
            // if permission power is >= 10, then user is owner
            if (snapshot.val() !== null && snapshot.val() >= 10) {
                resolve(true);
            } else {
                resolve(false);
            }
        }, (error: any) => {
            reject(error);
        });
    });
};
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

    getAllGyms(limit, res, next);
}).all('/', (_req: Request, _res: Response, next: NextFunction) => {
    next(new APIException(405, 'Method not allowed'));
});

// Get gym by gymId
router.get('/:gymId', (req: Request, res: Response, next: NextFunction) => {
    const gymId = req.params.gymId;
    getGymById(gymId, next, res);
});

// Update gym by gymId
router.patch('/:gymId', (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.gymId;
    const gym: Gym = steriliseGym(req.body as Gym, false);
    const currentUser = req.headers.uid as string;
    if (Object.keys(gym).length === 0) {
        return res.status(400).json({ error: 'No gym data provided' });
    }
    if (!validateGym(gym, true)) {
        return next(new APIException(400, 'Invalid gym'));
    }
    if (!req.headers.admin) {
        isGymOwner(id, currentUser).then((isOwner) => {
            if (isOwner) {
                updateGymById(id, gym, res, next);
            } else {
                next(new APIException(403, 'Not authorised to update this gym'));
            }
        }).catch((err) => {
            handleFirebaseError(err, res, next, 'Error checking if user is owner');
        });
    } else {
        updateGymById(id, gym, res, next);
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
    createGym(gymId, next, gym, res);
});

// Delete gym by gymId
router.delete('/:gymId', (req: Request, res: Response, next: NextFunction) => {
    const gymId = req.params.gymId;
    const currentUser = req.headers.uid;
    if (!req.headers.admin) {
        return next(new APIException(403, 'Not authorised to delete this gym'));
    }
    deleteGym(gymId, res, next);
}).all('/:gymId', (_req: Request, _res: Response, next: NextFunction) => {
    next(new APIException(405, 'Method not allowed'));
});

// Logo routes

// Get gym logo
router.get('/:gymId/logo', (req: Request, res: Response, next: NextFunction) => {
    const gymId = req.params.gymId;
    getFileLink(gymId, next, res);
});

// Set gym logo
router.post('/:gymId/logo', (req: Request, res: Response, next: NextFunction) => {
    const gymId = req.params.gymId;
    const currentUser = req.headers.uid as string;
    if (!req.headers.admin) {
        isGymOwner(gymId, currentUser).then((isOwner) => {
            if (isOwner) {
                createLogo(req,res,next,gymId);
            } else {
                next(new APIException(403, 'Not authorised to set this gym logo'));
            }
        }).catch((err) => {
            handleFirebaseError(err, res, next, 'Error checking if user is owner');
        });
    } else {
        createLogo(req,res,next,gymId);
    }
});

// Delete gym logo
router.delete('/:gymId/logo', (req: Request, res: Response, next: NextFunction) => {
    const gymId = req.params.gymId;
    const currentUser = req.headers.uid as string;
    if (!req.headers.admin) {
        isGymOwner(gymId, currentUser).then((isOwner) => {
            if (isOwner) {
                deleteLogo(gymId, next, res);
            } else {
                next(new APIException(403, 'Not authorised to delete this gym logo'));
            }
        }).catch((err) => {
            handleFirebaseError(err, res, next, 'Error checking if user is owner');
        });
    } else {
        deleteLogo(gymId, next, res);
    }
}).all('/:gymId/logo', (_req: Request, _res: Response, next: NextFunction) => {
    next(new APIException(405, 'Method not allowed'));
});

// Openings routes

// Get all openings for gym by gymId
router.get('/:gymId/openings', (req: Request, res: Response, next: NextFunction) => {
    const gymId = req.params.gymId;
    getAllOpeningsbyGymId(gymId, next, res);
});

// Set opening for gym by gymId
router.post('/:gymId/openings', (req: Request, res: Response, next: NextFunction) => {
    const gymId = req.params.gymId;
    const opening: Openings = steriliseOpenings(req.body as Openings, false);
    const currentUser = req.headers.uid as string;
    if (!validateOpenings(opening)) {
        return next(new APIException(400, 'Invalid opening'));
    }
    if (!req.headers.admin) {
        isGymOwner(gymId, currentUser).then((isOwner) => {
            if (isOwner) {
                setNewOpeningsByGymId(gymId, next, opening, res);
            } else {
                next(new APIException(403, 'Not authorised to set opening for this gym'));
            }
        });
    } else {
        setNewOpeningsByGymId(gymId, next, opening, res);
    }
});

// Get opening for gym by gymId and day
router.get('/:gymId/openings/:day', (req: Request, res: Response, next: NextFunction) => {
    const gymId = req.params.gymId;
    const day = req.params.day;
    if (!validateDay(day.trim().toLowerCase())) {
        return next(new APIException(400, 'Invalid day'));
    }
    getOpeningFromDayByGymId(gymId, day, next, res);
});

// Update opening for gym by gymId and day
router.patch('/:gymId/openings/:day', (req: Request, res: Response, next: NextFunction) => {
    const gymId = req.params.gymId;
    const day = req.params.day;
    const openingDay: Day = steriliseDayFromInterface(req.body as Day, false);
    const currentUser = req.headers.uid as string;
    if (!validateDay(day.trim().toLowerCase())) {
        return next(new APIException(400, 'Invalid day'));
    }
    if (!validateDayFromInterface(openingDay)) {
        return next(new APIException(400, 'Invalid opening'));
    }
    if (!req.headers.admin) {
        isGymOwner(gymId, currentUser).then((isOwner) => {
            if (isOwner) {
                updateOpeningFromDayByGymId(gymId, next, day, openingDay, res);
            } else {
                next(new APIException(403, 'Not authorised to update opening for this gym'));
            }
        });
    } else {
        updateOpeningFromDayByGymId(gymId, next, day, openingDay, res);
    }
});

// Delete opening for gym by gymId
router.delete('/:gymId/openings', (req: Request, res: Response, next: NextFunction) => {
    const gymId = req.params.gymId;
    const currentUser = req.headers.uid as string;
    if (!req.headers.admin) {
        isGymOwner(gymId, currentUser).then((isOwner) => {
            if (isOwner) {
                deleteOpeningByGymId(gymId, next, res);
            } else {
                next(new APIException(403, 'Not authorised to delete opening for this gym'));
            }
        });
    } else {
        deleteOpeningByGymId(gymId, next, res);
    }
}).all('/:gymId/openings', (_req: Request, _res: Response, next: NextFunction) => {
    next(new APIException(405, 'Method not allowed'));
});

// Delete opening for gym by gymId and day
router.delete('/:gymId/openings/:day', (req: Request, res: Response, next: NextFunction) => {
    const gymId = req.params.gymId;
    const day = req.params.day;
    const currentUser = req.headers.uid as string;
    if (!req.headers.admin) {
        isGymOwner(gymId, currentUser).then((isOwner) => {
            if (isOwner) {
                deleteOpeningFromDayByGymId(gymId, next, day, res);
            } else {
                next(new APIException(403, 'Not authorised to delete opening for this gym'));
            }
        });
    } else {
        deleteOpeningFromDayByGymId(gymId, next, day, res);
    }
}).all('/:gymId/openings/:day', (_req: Request, _res: Response, next: NextFunction) => {
    next(new APIException(405, 'Method not allowed'));
});

// Get overridden opening for gym by gymId and day (if day not given, returns all overridden openings)
router.get('/:gymId/holidays', (req: Request, res: Response, next: NextFunction) => {
    const gymId = req.params.gymId;
    const date = req.query.date ? String(req.query.date) : "null";
    if (date === 'null') {
        getAllHolidaysFromGymId(gymId, next, res);
    } else {
        if (!validateDate(date)) {
            return next(new APIException(400, 'Invalid date'));
        }
        getHoldaysFromDateByGymId(gymId, date, next, res);
    }
});

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
    // if gym doesn't exist, return 404
    admin.database().ref('/gyms/' + gymId).once('value').then((snapshot) => {
        if (snapshot.val() === null) {
            next(new APIException(404, 'Gym not found'));
        } else {
            if (!req.headers.admin) {
                isGymOwner(gymId, currentUser).then((isOwner) => {
                    if (isOwner) {
                        setHolidayFromDateByGymId(gymId, date, day, res, next);
                    } else {
                        next(new APIException(403, 'Not authorised to set overridden opening for this gym'));
                    }
                });
            } else {
                setHolidayFromDateByGymId(gymId, date, day, res, next);
            }
        }
    }).catch((err) => {
        handleFirebaseError(err, res, next, 'Error getting gym');
    });
});

// Delete overridden opening for gym by gymId and day
router.delete('/:gymId/holidays', (req: Request, res: Response, next: NextFunction) => {
    const gymId = req.params.gymId;
    const date = req.query.date ? String(req.query.date) : "null";
    if (date === 'null' || !validateDate(date)) {
        deleteAllHolidaysFromGymId(gymId, next, res);
    }
    const currentUser = req.headers.uid as string;
    // if gym doesn't exist, return 404
    admin.database().ref('/gyms/' + gymId).once('value').then((snapshot) => {
        if (snapshot.val() === null) {
            next(new APIException(404, 'Gym not found'));
        } else {
            if (!req.headers.admin) {
                isGymOwner(gymId, currentUser).then((isOwner) => {
                    if (isOwner) {
                        deleteHolidayFromDateByGymId(gymId, date, res, next);
                    } else {
                        next(new APIException(403, 'Not authorised to delete overridden opening for this gym'));
                    }
                });
            } else {
                deleteHolidayFromDateByGymId(gymId, date, res, next);
            }
        }
    }).catch((err) => {
        handleFirebaseError(err, res, next, 'Error getting gym');
    });
}).all('/:gymId/holidays', (_req: Request, _res: Response, next: NextFunction) => {
    next(new APIException(405, 'Method not allowed'));
});

export default router;

export const isGymOwner = (gymId: string, userId: string): Promise<boolean> => {
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

export const isStaff = (gymId: string, userId: string): Promise<boolean> => {
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

function deleteHolidayFromDateByGymId(gymId: string, date: string, res: Response<any, Record<string, any>>, next: NextFunction) {
    admin.database().ref('/overridden-openings/' + gymId + '/' + date).remove().then(() => {
        res.status(200).json({ data: { [date]: null } });
    }).catch((err) => {
        handleFirebaseError(err, res, next, 'Error deleting overridden opening');
    });
}

function deleteAllHolidaysFromGymId(gymId: string, next: NextFunction, res: Response<any, Record<string, any>>) {
    admin.database().ref('/overridden-openings/' + gymId).remove().then(() => {
        res.status(200).json({ data: { [gymId]: null } });
    }).catch((err) => {
        handleFirebaseError(err, res, next, 'Error deleting overridden opening');
    });
}

function setHolidayFromDateByGymId(gymId: string, date: string, day: Day, res: Response<any, Record<string, any>>, next: NextFunction) {
    admin.database().ref('/overridden-openings/' + gymId + '/' + date).set(day).then(() => {
        res.status(200).json({ data: { [date]: day } });
    }).catch((err) => {
        handleFirebaseError(err, res, next, 'Error updating overridden opening');
    });
}

function getHoldaysFromDateByGymId(gymId: string, date: string, next: NextFunction, res: Response<any, Record<string, any>>) {
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

function getAllHolidaysFromGymId(gymId: string, next: NextFunction, res: Response<any, Record<string, any>>) {
    admin.database().ref('/overridden-openings/' + gymId).once('value', (snapshot: any) => {
        if (snapshot.val() === null) {
            next(new APIException(404, 'No overridden openings found for given gym'));
        } else {
            res.status(200).json({ data: { overriddenOpenings: snapshot.val() } });
        }
    }, (error: any) => {
        handleFirebaseError(error, res, next, 'Error getting overridden openings');
    });
}

function deleteOpeningFromDayByGymId(gymId: string, next: NextFunction, day: string, res: Response<any, Record<string, any>>) {
    admin.database().ref('/gyms/' + gymId).once('value').then((snapshot) => {
        if (snapshot.val() === null) {
            next(new APIException(404, 'Gym not found'));
        } else {
            admin.database().ref('/openings/' + gymId + '/' + day).remove().then(() => {
                res.status(200).json({ data: { message: 'Opening deleted' } });
            }).catch((err) => {
                handleFirebaseError(err, res, next, 'Error deleting opening');
            });
        }
    }).catch((err) => {
        handleFirebaseError(err, res, next, 'Error getting gym');
    });
}

function deleteOpeningByGymId(gymId: string, next: NextFunction, res: Response<any, Record<string, any>>) {
    admin.database().ref('/gyms/' + gymId).once('value').then((snapshot) => {
        if (snapshot.val() === null) {
            next(new APIException(404, 'Gym not found'));
        } else {
            admin.database().ref('/openings/' + gymId).remove().then(() => {
                res.status(200).json({ data: { message: 'Opening deleted' } });
            }).catch((err) => {
                handleFirebaseError(err, res, next, 'Error deleting opening');
            });
        }
    }).catch((err) => {
        handleFirebaseError(err, res, next, 'Error getting gym');
    });
}

function updateOpeningFromDayByGymId(gymId: string, next: NextFunction, day: string, openingDay: Day, res: Response<any, Record<string, any>>) {
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

function getOpeningFromDayByGymId(gymId: string, day: string, next: NextFunction, res: Response<any, Record<string, any>>) {
    admin.database().ref('/openings/' + gymId + '/' + day).once('value', (snapshot: any) => {
        if (snapshot.val() === null) {
            next(new APIException(404, 'No openings found for given gym and day'));
        } else {
            res.status(200).json({ data: { [day]: snapshot.val() } });
        }
    }, (error: any) => {
        handleFirebaseError(error, res, next, 'Error getting opening');
    });
}

function setNewOpeningsByGymId(gymId: string, next: NextFunction, opening: Openings, res: Response<any, Record<string, any>>) {
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

function getAllOpeningsbyGymId(gymId: string, next: NextFunction, res: Response<any, Record<string, any>>) {
    admin.database().ref('/openings/' + gymId).once('value', (snapshot: any) => {
        if (snapshot.val() === null) {
            next(new APIException(404, 'No openings found for given gym'));
        } else {
            res.status(200).json({ data: { openings: snapshot.val() } });
        }
    }, (error: any) => {
        handleFirebaseError(error, res, next, 'Error getting openings');
    });
}

function createLogo(req: Request, res: Response, next: NextFunction, gymId: string) {
    // base 64 image
    const logo = req.body.logo;
    if (!logo || !logo.startsWith('data:image/jpeg;base64,')) {
        return next(new APIException(400, 'Invalid logo'));
    }
    const base64Data = logo.replace(/^data:image\/jpeg;base64,/, '');
    const fileName = 'Gyms/' + gymId + '/logo.jpg'
    const image = Buffer.from(base64Data, 'base64');
    // if image is bigger than 2MB, return error
    if (image.length > 2000000) {
        return next(new APIException(413, 'Image is too big'));
    }
    // upload image to storage
    admin.storage().bucket().file(fileName).save(image, {
        metadata: {
            contentType: 'image/jpeg',
            public: true,
            cacheControl: 'public, max-age=31536000'
        }
    }).then(() => {
        getFileLink(gymId, next, res);
    }).catch((err) => {
        handleFirebaseError(err, res, next, 'Error setting gym logo');
    });
}

function deleteLogo(gymId: string, next: NextFunction, res: Response<any, Record<string, any>>) {
    admin.storage().bucket().file('Gyms/' + gymId + '/logo.jpg').delete().then(() => {
        res.status(200).json({ data: { message: 'Logo deleted' } });
    }).catch((err) => {
        handleFirebaseError(err, res, next, 'Error deleting logo');
    });
}

function getFileLink(gymId: string, next: NextFunction, res: Response<any, Record<string, any>>) {
    admin.storage().bucket().file('Gyms/' + gymId + '/logo.jpg').get((err: any, file: any) => {
        if (err) {
            if (err?.errors[0]?.reason === 'notFound') {
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
}

function deleteGym(gymId: string, res: Response<any, Record<string, any>>, next: NextFunction) {
    // delete opening from gym
    admin.database().ref('/openings/' + gymId).remove().then(() => {
        // delete holidays from gym
        admin.database().ref('/overridden-openings/' + gymId).remove().then(() => {
                // delete logo from storage
                admin.storage().bucket().file('Gyms/' + gymId + '/logo.jpg').delete((errLogo: any, file: any) => {
                    if (errLogo) {
                        handleFirebaseError(errLogo, res, next, 'Error deleting gym logo');
                    } else {
                        // delete gym from database
                        admin.database().ref('/gyms/' + gymId).remove().then(() => {
                            res.status(200).json({ data: { gym: null } });
                        }).catch((errGym) => {
                            handleFirebaseError(errGym, res, next, 'Error deleting gym');
                        });
                    }
                });
            }).catch((err) => {
                handleFirebaseError(err, res, next, 'Error deleting gym holidays');
            });
    }).catch((err) => {
        handleFirebaseError(err, res, next, 'Error deleting gym opening');
    });
}

function createGym(gymId: string, next: NextFunction, gym: Gym, res: Response<any, Record<string, any>>) {
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
}

function updateGymById(id: string, gym: Gym, res: Response<any, Record<string, any>>, next: NextFunction) {
    admin.database().ref('/gyms/' + id).update(gym).then(() => {
        res.status(200).json({ data: { gym } });
    }).catch((err) => {
        handleFirebaseError(err, res, next, 'Error updating gym');
    });
}

function getGymById(gymId: string, next: NextFunction, res: Response<any, Record<string, any>>) {
    admin.database().ref('/gyms/' + gymId).once('value').then((snapshot) => {
        if (snapshot.val() === null) {
            next(new APIException(404, 'Gym not found'));
        } else {
            res.status(200).json({ data: { gym: snapshot.val() } });
        }
    }).catch((err) => {
        handleFirebaseError(err, res, next, 'Error getting gym');
    });
}

function getAllGyms(limit: number, res: Response<any, Record<string, any>>, next: NextFunction) {
    admin.database().ref('/gyms').limitToFirst(limit).once('value', (snapshot: any) => {
        res.status(200).json({ data: { gyms: snapshot.val() } });
    }, (error: any) => {
        handleFirebaseError(error, res, next, 'Error getting gyms');
    });
}

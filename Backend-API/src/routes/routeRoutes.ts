import { NextFunction, Request, Response } from "express";
import * as admin from 'firebase-admin';
import APIException from "../APIException";
import Route from "../interfaces/Route";
import express from "express";
import { handleFirebaseError, validateComment, validateDifficulty, validateRoute, validateRouteFeatures, validateWall, validateWallFeatures } from "../HelperFunctions";
import { isStaff } from "./gymRoutes";
import Comment from "../interfaces/Comment";

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
                admin.database().ref('/walls/' + gymId + "/" + wallId).once('value').then((wallSnapshot) => {
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
            admin.database().ref('/walls/' + gymId + "/" + wallId).once('value', (snapshotWall: any) => {
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
                    // Get gym difficulties
                    admin.database().ref('/difficulties/' + gymId).once('value', (snapshotDifficulties: any) => {
                        if (snapshotDifficulties.val() === null) {
                            return res.status(404).json({ error: 'No difficulties found' });
                        } else {
                            if (!validateRoute(route, snapshotDifficulties.val() as string[])) {
                                return res.status(400).json({ error: 'Invalid route' });
                            }
                            admin.database().ref('/walls/' + gymId + "/" + wallId).once('value', (snapshotWall: any) => {
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
                        handleFirebaseError(error, res, next, 'Error getting difficulties');
                    });
                }
            }, (error: any) => {
                handleFirebaseError(error, res, next, 'Error getting gym');
            });
        } else {
            return res.status(403).json({ error: 'Not authorized to create route' });
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
                    admin.database().ref('/walls/' + gymId + "/" + wallId).once('value', (snapshotWall: any) => {
                        if (snapshotWall.val() === null) {
                            return res.status(404).json({ error: 'Wall not found' });
                        } else {
                            admin.database().ref('/routes/' + gymId + '/' + wallId + '/' + routeId).once('value', (snapshot: any) => {
                                if (snapshot.val() === null) {
                                    return res.status(404).json({ error: 'Route not found' });
                                } else {
                                    admin.database().ref('/routes/' + gymId + '/' + wallId + '/' + routeId).update({ features: newFeatures }).then(() => {
                                        const oldData = snapshot.val();
                                        const newData = {
                                            ...oldData,
                                            features: newFeatures
                                        };
                                        res.status(200).json({ data: { route: newData } });
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
            return res.status(403).json({ error: 'Not authorized to update features' });
        }
    }, (error: any) => {
        handleFirebaseError(error, res, next, 'Error checking if user is staff');
    });
}).all('/:routeId/feature', (_req: Request, _res: Response, next: NextFunction) => {
    next(new APIException(405, 'Method not allowed'));
});

// Update difficulty for given route
router.patch('/:routeId/difficulty', (req: Request, res: Response, next: NextFunction) => {
    const newDifficulty: number = req.body.difficulty as number;
    const gymId = req.query.gymId ? String(req.query.gymId) : null;
    const wallId = req.query.wallId ? String(req.query.wallId) : null;
    const routeId = req.params.routeId;
    const currentUser = req.headers.uid as string;
    if (gymId === null) {
        return res.status(400).json({ error: 'Invalid gymId' });
    }
    if (wallId === null) {
        return res.status(400).json({ error: 'Invalid wallId' });
    }
    if (routeId === null) {
        return res.status(400).json({ error: 'Invalid routeId' });
    }
    isStaff(gymId, currentUser).then((isStaffBool: boolean) => {
        if (isStaffBool || req.headers.admin) {
            admin.database().ref('/gyms/' + gymId).once('value', (snapshotGym: any) => {
                if (snapshotGym.val() === null) {
                    return res.status(404).json({ error: 'Gym not found' });
                } else {
                    // Get difficulties
                    admin.database().ref('/difficulties/' + gymId).once('value', (snapshotDifficulties: any) => {
                        if (snapshotDifficulties.val() === null) {
                            return res.status(404).json({ error: 'Difficulties not found' });
                        } else {
                            if (!validateDifficulty(newDifficulty, snapshotDifficulties.val() as string[])) {
                                return res.status(400).json({ error: 'Invalid difficulty' });
                            }
                            admin.database().ref('/walls/' + gymId + "/" + wallId).once('value', (snapshotWall: any) => {
                                if (snapshotWall.val() === null) {
                                    return res.status(404).json({ error: 'Wall not found' });
                                } else {
                                    admin.database().ref('/routes/' + gymId + '/' + wallId + '/' + routeId).once('value', (snapshot: any) => {
                                        if (snapshot.val() === null) {
                                            return res.status(404).json({ error: 'Route not found' });
                                        } else {
                                            admin.database().ref('/routes/' + gymId + '/' + wallId + '/' + routeId).update({ difficulty: newDifficulty }).then(() => {
                                                const oldData = snapshot.val();
                                                const newData = {
                                                    ...oldData,
                                                    difficulty: newDifficulty
                                                };
                                                res.status(200).json({ data: { route: newData } });
                                            }, (error: any) => {
                                                handleFirebaseError(error, res, next, 'Error updating difficulty');
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
                        handleFirebaseError(error, res, next, 'Error getting difficulties');
                    });
                }
            }, (error: any) => {
                handleFirebaseError(error, res, next, 'Error getting gym');
            });
        } else {
            return res.status(403).json({ error: 'Not authorized to update difficulty' });
        }
    }, (error: any) => {
        handleFirebaseError(error, res, next, 'Error checking if user is staff');
    });
}).all('/:routeId/difficulty', (_req: Request, _res: Response, next: NextFunction) => {
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
                    admin.database().ref('/walls/' + gymId + "/" + wallId).once('value', (snapshotWall: any) => {
                        if (snapshotWall.val() === null) {
                            return res.status(404).json({ error: 'Wall not found' });
                        } else {
                            admin.database().ref('/routes/' + gymId + '/' + wallId + '/' + routeId).once('value', (snapshot: any) => {
                                if (snapshot.val() === null) {
                                    return res.status(404).json({ error: 'Route not found' });
                                } else {
                                    // Remove comments from route
                                    admin.database().ref('/comments/' + gymId + '/' + wallId + '/' + routeId).remove().then(() => {
                                        // Remove completed route checks
                                        admin.database().ref('/completed/' + gymId + '/' + wallId + '/' + routeId).remove().then(() => {
                                            // Remove route
                                            admin.database().ref('/routes/' + gymId + '/' + wallId + '/' + routeId).remove().then(() => {
                                                res.status(200).json({ data: { route: snapshot.val() } });
                                            }, (error: any) => {
                                                handleFirebaseError(error, res, next, 'Error deleting route');
                                            });
                                        }, (error: any) => {
                                            handleFirebaseError(error, res, next, 'Error deleting completed checks');
                                        });
                                    }, (error: any) => {
                                        handleFirebaseError(error, res, next, 'Error deleting comments');
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
            return res.status(403).json({ error: 'Not authorized to delete route' });
        }
    }, (error: any) => {
        handleFirebaseError(error, res, next, 'Error checking if user is staff');
    });
}).all('/:routeId', (_req: Request, _res: Response, next: NextFunction) => {
    next(new APIException(405, 'Method not allowed'));
});

// Get comments for route
router.get('/:routeId/comments', (req: Request, res: Response, next: NextFunction) => {
    const gymId = req.query.gymId ? String(req.query.gymId) : null;
    const wallId = req.query.wallId ? String(req.query.wallId) : null;
    const routeId = req.params.routeId;

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
            admin.database().ref('/walls/' + gymId + "/" + wallId).once('value', (snapshotWall: any) => {
                if (snapshotWall.val() === null) {
                    return res.status(404).json({ error: 'Wall not found' });
                } else {
                    admin.database().ref('/routes/' + gymId + '/' + wallId + '/' + routeId).once('value', (snapshot: any) => {
                        if (snapshot.val() === null) {
                            return res.status(404).json({ error: 'Route not found' });
                        } else {
                            admin.database().ref('/comments/' + gymId + '/' + wallId + '/' + routeId).once('value', (snapshotComments: any) => {
                                if (snapshotComments.val() === null) {
                                    return res.status(404).json({ error: 'No comments found' });
                                } else {
                                    res.status(200).json({ data: { comments: snapshotComments.val() } });
                                }
                            }, (error: any) => {
                                handleFirebaseError(error, res, next, 'Error getting comments');
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
});

// Set comment for route
router.post('/:routeId/comments', (req: Request, res: Response, next: NextFunction) => {
    const gymId = req.query.gymId ? String(req.query.gymId) : null;
    const wallId = req.query.wallId ? String(req.query.wallId) : null;
    const routeId = req.params.routeId;
    const currentUser = req.headers.uid as string;
    const comment: Comment = req.body.comment;

    if (gymId === null) {
        return res.status(400).json({ error: 'Invalid gymId' });
    }
    if (wallId === null) {
        return res.status(400).json({ error: 'Invalid wallId' });
    }
    if (!validateComment(comment)) {
        return res.status(400).json({ error: 'Invalid comment' });
    }
    // set comment timestamp to current time
    comment.timestamp = String(Date.now());
    // If user send image, save it to storage
    if (comment.image) {
        if (!comment.image.startsWith('data:image/jpeg;base64,')) {
            return res.status(400).json({ error: 'Invalid image' });
        } else {
            const imageData = comment.image.replace(/^data:image\/jpeg;base64,/, '');
            const fileName = 'Reviews/' + gymId + "/Walls/" + wallId + "/" + routeId + "/" + currentUser + ".jpg";
            const imageBuffer = Buffer.from(imageData, 'base64');
            // max image size is 2MB
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
                admin.storage().bucket().file(fileName).getSignedUrl({
                    action: 'read',
                    expires: '03-09-2491'
                }).then((url: string[]) => {
                    comment.image = url[0];
                    saveComment(gymId, wallId, routeId, currentUser, comment, res, next);
                }, (error: any) => {
                    handleFirebaseError(error, res, next, 'Error getting image url');
                });
            }, (error: any) => {
                handleFirebaseError(error, res, next, 'Error saving image');
            });
        }
    } else {
        saveComment(gymId, wallId, routeId, currentUser, comment, res, next);
    }
});

// Delete comment for route
router.delete('/:routeId/comments/:commentId', (req: Request, res: Response, next: NextFunction) => {
    const gymId = req.query.gymId ? String(req.query.gymId) : null;
    const wallId = req.query.wallId ? String(req.query.wallId) : null;
    const routeId = req.params.routeId;
    const commentId = req.params.commentId;
    const currentUser = req.headers.uid as string;

    if (gymId === null) {
        return res.status(400).json({ error: 'Invalid gymId' });
    }
    if (wallId === null) {
        return res.status(400).json({ error: 'Invalid wallId' });
    }

    isStaff(gymId, currentUser).then((isStaffBoolean: boolean) => {
        if (!isStaffBoolean && !req.headers.admin && currentUser !== commentId) {
            return res.status(403).json({ error: 'Not authorized to delete comment' });
        }

        admin.database().ref('/comments/' + gymId + '/' + wallId + '/' + routeId + '/' + commentId).once('value', (snapshot: any) => {
            if (snapshot.val() === null) {
                return res.status(404).json({ error: 'Comment not found' });
            } else {
                if (snapshot.val().image) {
                    admin.storage().bucket().file("Reviews/" + gymId + "/Walls/" + wallId + "/" + routeId + "/" + commentId + ".jpg").delete().then(() => {
                        admin.database().ref('/comments/' + gymId + '/' + wallId + '/' + routeId + '/' + commentId).remove().then(() => {
                            res.status(200).json({ data: { commentId } });
                        }, (error: any) => {
                            handleFirebaseError(error, res, next, 'Error deleting comment');
                        });
                    }, (error: any) => {
                        handleFirebaseError(error, res, next, 'Error deleting image');
                    });
                } else {
                    admin.database().ref('/comments/' + gymId + '/' + wallId + '/' + routeId + '/' + commentId).remove().then(() => {
                        res.status(200).json({ data: { comment: null } });
                    }, (error: any) => {
                        handleFirebaseError(error, res, next, 'Error deleting comment');
                    });
                }
            }
        }, (error: any) => {
            handleFirebaseError(error, res, next, 'Error getting comment');
        });
    }, (error: any) => {
        handleFirebaseError(error, res, next, 'Error getting gym');
    });
}).all('/:routeId/comments', (_req: Request, _res: Response, next: NextFunction) => {
    next(new APIException(405, 'Method not allowed'));
});

// Update user difficulty to route
router.post('/:routeId/userRatings', (req: Request, res: Response, next: NextFunction) => {
    const gymId = req.query.gymId ? String(req.query.gymId) : null;
    const wallId = req.query.wallId ? String(req.query.wallId) : null;
    const routeId = req.params.routeId;
    const currentUser = req.headers.uid as string;
    const userRating: number = Number(req.body.userRating);
    if (gymId === null) {
        return res.status(400).json({ error: 'Invalid gymId' });
    }
    if (wallId === null) {
        return res.status(400).json({ error: 'Invalid wallId' });
    }
    // Valid user rating : -2, -1, 0, 1, 2
    if (isNaN(userRating) || userRating < -2 || userRating > 2) {
        return res.status(400).json({ error: 'Invalid user rating' });
    }

    gymExists(gymId).then((gymExistsBool: boolean) => {
        if (!gymExistsBool) {
            return res.status(404).json({ error: 'Gym not found' });
        }
        wallExists(gymId, wallId).then((wallExistsBool: boolean) => {
            if (!wallExistsBool) {
                return res.status(404).json({ error: 'Wall not found' });
            }
            routeExists(gymId, wallId, routeId, true).then((routeExistsBool: any[]) => {
                if (!(routeExistsBool[0] as boolean)) {
                    return res.status(404).json({ error: 'Route not found' });
                }
                admin.database().ref('/userRatings/' + gymId + '/' + wallId + '/' + routeId + '/' + currentUser).set(userRating).then(() => {
                    const oldValue = (routeExistsBool[1]?.userRatings || 0) as number;
                    setUserRating(gymId, wallId, routeId, userRating - oldValue).then(() => {
                        res.status(200).json({ data: { userRating } });
                    }).catch((error: any) => {
                        handleFirebaseError(error, res, next, 'Error updating user rating');
                    });
                }, (error: any) => {
                    handleFirebaseError(error, res, next, 'Error saving user rating');
                });
            }, (error: any) => {
                handleFirebaseError(error, res, next, 'Error getting route');
            });
        }, (error: any) => {
            handleFirebaseError(error, res, next, 'Error getting wall');
        });
    }, (error: any) => {
        handleFirebaseError(error, res, next, 'Error getting gym');
    });
});

// Delete user difficulty to route
router.delete('/:routeId/userRatings', (req: Request, res: Response, next: NextFunction) => {
    const gymId = req.query.gymId ? String(req.query.gymId) : null;
    const wallId = req.query.wallId ? String(req.query.wallId) : null;
    const routeId = req.params.routeId;
    const currentUser = req.headers.uid as string;

    if (gymId === null) {
        return res.status(400).json({ error: 'Invalid gymId' });
    }
    if (wallId === null) {
        return res.status(400).json({ error: 'Invalid wallId' });
    }

    admin.database().ref('/userRatings/' + gymId + '/' + wallId + '/' + routeId + '/' + currentUser).once('value', (snapshot: any) => {
        if (snapshot.val() === null) {
            return res.status(404).json({ error: 'User rating not found' });
        } else {
            admin.database().ref('/userRatings/' + gymId + '/' + wallId + '/' + routeId + '/' + currentUser).remove().then(() => {
                setUserRating(gymId, wallId, routeId, snapshot.val() || 0).then(() => {
                    res.status(200).json({ data: { userRating: null } });
                }).catch((error: any) => {
                    handleFirebaseError(error, res, next, 'Error updating user rating');
                });
            }, (error: any) => {
                handleFirebaseError(error, res, next, 'Error deleting user rating');
            });
        }
    }, (error: any) => {
        handleFirebaseError(error, res, next, 'Error getting user rating');
    });
}).all('/:routeId/userRatings', (_req: Request, _res: Response, next: NextFunction) => {
    next(new APIException(405, 'Method not allowed'));
});

// Complete route
router.post('/:routeId/complete', (req: Request, res: Response, next: NextFunction) => {
    const gymId = req.query.gymId ? String(req.query.gymId) : null;
    const wallId = req.query.wallId ? String(req.query.wallId) : null;
    const routeId = req.params.routeId;
    const flashed = req.query.flashed === 'true';
    const currentUser = req.headers.uid as string;

    if (gymId === null) {
        return res.status(400).json({ error: 'Invalid gymId' });
    }
    if (wallId === null) {
        return res.status(400).json({ error: 'Invalid wallId' });
    }

    gymExists(gymId).then((gymExistsBool: boolean) => {
        if (!gymExistsBool) {
            return res.status(404).json({ error: 'Gym not found' });
        }
        wallExists(gymId, wallId).then((wallExistsBool: boolean) => {
            if (!wallExistsBool) {
                return res.status(404).json({ error: 'Wall not found' });
            }
            routeExists(gymId, wallId, routeId, true).then((routeExistsBool: any[]) => {
                const oldRoute = routeExistsBool[1] as Route;
                if (!(routeExistsBool[0] as boolean)) {
                    return res.status(404).json({ error: 'Route not found' });
                }
                hasUserCompletedRoute(gymId, wallId, routeId, currentUser).then((hasCompletedRoute: boolean) => {
                    if (hasCompletedRoute) {
                        return res.status(400).json({ error: 'User has already completed this route' });
                    } else {
                        setUserCompletedRoute(gymId, wallId, routeId, currentUser, flashed).then(() => {
                            // Increment user completed route count and routes completed count
                            incrementUserCompletedRouteCount(currentUser).then(() => {
                                incrementRoutesCompletedCount(gymId, wallId, routeId).then(() => {
                                    // Update user completed features
                                    updateUsersCompletedFeatures(gymId, wallId, routeId, currentUser).then(() => {
                                        res.status(200).json({ data: { userCompletedRoute: true } });
                                    }).catch((error: any) => {
                                        handleFirebaseError(error, res, next, 'Error updating user completed features');
                                    });
                                }).catch((error: any) => {
                                    handleFirebaseError(error, res, next, 'Error incrementing routes completed count');
                                });
                            }).catch((error: any) => {
                                handleFirebaseError(error, res, next, 'Error incrementing user completed route count');
                            });
                        }).catch((error: any) => {
                            handleFirebaseError(error, res, next, 'Error setting user completed route');
                        });
                    }
                }, (error: any) => {
                    handleFirebaseError(error, res, next, 'Error checking if user has completed route');
                });
            }, (error: any) => {
                handleFirebaseError(error, res, next, 'Error getting route');
            });
        }, (error: any) => {
            handleFirebaseError(error, res, next, 'Error getting wall');
        });
    }, (error: any) => {
        handleFirebaseError(error, res, next, 'Error getting gym');
    });
});

// Uncomplete route
router.delete('/:routeId/complete', (req: Request, res: Response, next: NextFunction) => {
    const gymId = req.query.gymId ? String(req.query.gymId) : null;
    const wallId = req.query.wallId ? String(req.query.wallId) : null;
    const routeId = req.params.routeId;
    const currentUser = req.headers.uid as string;

    if (gymId === null) {
        return res.status(400).json({ error: 'Invalid gymId' });
    }
    if (wallId === null) {
        return res.status(400).json({ error: 'Invalid wallId' });
    }

    gymExists(gymId).then((gymExistsBool: boolean) => {
        if (!gymExistsBool) {
            return res.status(404).json({ error: 'Gym not found' });
        }
        wallExists(gymId, wallId).then((wallExistsBool: boolean) => {
            if (!wallExistsBool) {
                return res.status(404).json({ error: 'Wall not found' });
            }
            routeExists(gymId, wallId, routeId, true).then((routeExistsBool: any[]) => {
                const oldRoute = routeExistsBool[1] as Route;
                if (!(routeExistsBool[0] as boolean)) {
                    return res.status(404).json({ error: 'Route not found' });
                }
                hasUserCompletedRoute(gymId, wallId, routeId, currentUser).then((hasCompletedRoute: boolean) => {
                    if (!hasCompletedRoute) {
                        return res.status(400).json({ error: 'User has not completed this route' });
                    } else {
                        deleteUserCompletedRoute(gymId, wallId, routeId, currentUser).then(() => {
                            // Decrement user completed route count and routes completed count
                            decrementUserCompletedRouteCount(currentUser).then(() => {
                                decrementRoutesCompletedCount(gymId, wallId, routeId).then(() => {
                                    // Update user completed features
                                    updateUsersCompletedFeatures(gymId, wallId, routeId, currentUser, true).then(() => {
                                        res.status(200).json({ data: { userCompletedRoute: false } });
                                    }).catch((error: any) => {
                                        handleFirebaseError(error, res, next, 'Error updating user completed features');
                                    });
                                }).catch((error: any) => {
                                    handleFirebaseError(error, res, next, 'Error decrementing routes completed count');
                                });
                            }).catch((error: any) => {
                                handleFirebaseError(error, res, next, 'Error decrementing user completed route count');
                            });
                        }).catch((error: any) => {
                            handleFirebaseError(error, res, next, 'Error deleting user completed route');
                        });
                    }
                }, (error: any) => {
                    handleFirebaseError(error, res, next, 'Error checking if user has completed route');
                });
            }, (error: any) => {
                handleFirebaseError(error, res, next, 'Error getting route');
            });
        }, (error: any) => {
            handleFirebaseError(error, res, next, 'Error getting wall');
        });
    }, (error: any) => {
        handleFirebaseError(error, res, next, 'Error getting gym');
    });
}).all('/:routeId/complete', (_req: Request, _res: Response, next: NextFunction) => {
    next(new APIException(405, 'Method not allowed'));
});

export default router;

const saveComment = (gymId: string, wallId: string, routeId: string, currentUser: string, comment: Comment, res: Response, next: NextFunction) => {
    admin.database().ref('/comments/' + gymId + '/' + wallId + '/' + routeId + '/' + currentUser).set(comment).then(() => {
        res.status(200).json({ data: { comment } });
    }, (error: any) => {
        handleFirebaseError(error, res, next, 'Error saving comment');
    });
};

const gymExists = (gymId: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        admin.database().ref('/gyms/' + gymId).once('value', (snapshot: any) => {
            if (snapshot.val() === null) {
                resolve(false);
            } else {
                resolve(true);
            }
        }, (error: any) => {
            reject(error);
        });
    });
};

const wallExists = (gymId: string, wallId: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        admin.database().ref('/walls/' + gymId + '/' + wallId).once('value', (snapshot: any) => {
            if (snapshot.val() === null) {
                resolve(false);
            } else {
                resolve(true);
            }
        }, (error: any) => {
            reject(error);
        });
    });
};

const routeExists = (gymId: string, wallId: string, routeId: string, getRoute: boolean = false): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        admin.database().ref('/routes/' + gymId + '/' + wallId + '/' + routeId).once('value', (snapshot: any) => {
            if (snapshot.val() === null) {
                resolve([false]);
            } else {
                resolve([true, getRoute ? snapshot.val() as Route : null]);
            }
        }, (error: any) => {
            reject(error);
        });
    });
};

const setUserRating = (gymId: string, wallId: string, routeId: string, amount: number): Promise<void> => {
    return new Promise((resolve, reject) => {
        admin.database().ref('/routes/' + gymId + '/' + wallId + '/' + routeId + '/userRatings').transaction((currentValue: number) => {
            if (currentValue === null) {
                return amount;
            } else {
                return currentValue + amount;
            }
        }, (error: any, committed: boolean, snapshot: any) => {
            if (error) {
                reject(error);
            } else if (!committed) {
                reject('Rating not committed');
            } else {
                resolve();
            }
        });
    });
};

const hasUserCompletedRoute = (gymId: string, wallId: string, routeId: string, currentUser: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        admin.database().ref('/completed/' + gymId + '/' + wallId + '/' + routeId + '/' + currentUser).once('value', (snapshot: any) => {
            if (snapshot.val() === null) {
                resolve(false);
            } else {
                resolve(true);
            }
        }, (error: any) => {
            reject(error);
        });
    });
};

const setUserCompletedRoute = (gymId: string, wallId: string, routeId: string, currentUser: string, flashed: boolean = false): Promise<void> => {
    return new Promise((resolve, reject) => {
        admin.database().ref('/completed/' + gymId + '/' + wallId + '/' + routeId + '/' + currentUser).set(flashed).then(() => {
            resolve();
        }, (error: any) => {
            reject(error);
        });
    });
};

const incrementUserCompletedRouteCount = (currentUser: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        admin.database().ref('/users/' + currentUser + '/completedRoutes').transaction((currentValue: number) => {
            if (currentValue === null) {
                return 1;
            } else {
                return currentValue + 1;
            }
        }, (error: any, committed: boolean, snapshot: any) => {
            if (error) {
                reject(error);
            } else if (!committed) {
                reject('Completed route count not committed');
            } else {
                resolve();
            }
        });
    });
};

const incrementRoutesCompletedCount = (gymId: string, wallId: string, routeId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        admin.database().ref('/routes/' + gymId + '/' + wallId + '/' + routeId + '/completedCount').transaction((currentValue: number) => {
            if (currentValue === null) {
                return 1;
            } else {
                return currentValue + 1;
            }
        }, (error: any, committed: boolean, snapshot: any) => {
            if (error) {
                reject(error);
            } else if (!committed) {
                reject('Completed count not committed');
            } else {
                resolve();
            }
        });
    });
};

const updateUsersCompletedFeatures = (gymId: string, wallId: string, routeId: string, currentUser: string, revert: boolean = false): Promise<void> => {
    const oldCompletedFeaturesRef = admin.database().ref('/users/' + currentUser + '/completedFeatures');
    const wallFeaturesRef = admin.database().ref('/walls/' + gymId + '/' + wallId + '/features');
    const routeFeaturesRef = admin.database().ref('/routes/' + gymId + '/' + wallId + '/' + routeId + '/features');
    return new Promise((resolve, reject) => {
        oldCompletedFeaturesRef.once('value', (oldFeaturesSnapshot: any) => {
            const oldFeatures: object = oldFeaturesSnapshot.val() || {};
            wallFeaturesRef.once('value', (wallFeaturesSnapshot: any) => {
                const wallFeatures: string[] = (wallFeaturesSnapshot.val() as string).split(",") || [];
                routeFeaturesRef.once('value', (routeFeaturesSnapshot: any) => {
                    const routeFeatures: string[] = (routeFeaturesSnapshot.val() as string).split(",") || [];
                    if (wallFeatures && routeFeatures) {
                        const newFeatures: any = buildNewUserFeatures(oldFeatures, wallFeatures, routeFeatures, revert);
                        setNewUserAvgDifficulty(gymId, wallId, routeId, currentUser, revert).then(() => {

                            admin.database().ref('/users/' + currentUser + '/completedFeatures').set(newFeatures).then(() => {
                                resolve();
                            }, (error: any) => {
                                reject(error);
                            });
                        }, (error: any) => {
                            reject(error);
                        });
                    } else {
                        reject('Features not found');
                    }
                }, (error: any) => {
                    reject(error);
                });
            }, (error: any) => {
                reject(error);
            });
        }, (error: any) => {
            reject(error);
        });
    });
};

const buildNewUserFeatures = (oldFeatures: any, wallFeatures: string[], routeFeatures: string[], revert: boolean = false): any => {
    for (const wallFeature of wallFeatures) {
        if (!revert) {
            oldFeatures[wallFeature] = oldFeatures[wallFeature] + 1 || 1;
        } else {
            oldFeatures[wallFeature] = oldFeatures[wallFeature] - 1 || 0;
        }

    }
    for (const routeFeature of routeFeatures) {
        if (!revert) {
            oldFeatures[routeFeature] = oldFeatures[routeFeature] + 1 || 1;
        } else {
            oldFeatures[routeFeature] = oldFeatures[routeFeature] - 1 || 0;
        }
    }

    return oldFeatures;
};

const deleteUserCompletedRoute = (gymId: string, wallId: string, routeId: string, currentUser: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        admin.database().ref('/completed/' + gymId + '/' + wallId + '/' + routeId + '/' + currentUser).remove().then(() => {
            resolve();
        }, (error: any) => {
            reject(error);
        });
    });
};

const decrementUserCompletedRouteCount = (currentUser: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        admin.database().ref('/users/' + currentUser + '/completedRoutes').transaction((currentValue: number) => {
            if (currentValue === null) {
                return 0;
            } else {
                return currentValue - 1;
            }
        }, (error: any, committed: boolean, snapshot: any) => {
            if (error) {
                reject(error);
            } else if (!committed) {
                reject('Completed route count not committed');
            } else {
                resolve();
            }
        });
    });
};

const decrementRoutesCompletedCount = (gymId: string, wallId: string, routeId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        admin.database().ref('/routes/' + gymId + '/' + wallId + '/' + routeId + '/completedCount').transaction((currentValue: number) => {
            if (currentValue === null) {
                return 0;
            } else {
                return currentValue - 1;
            }
        }, (error: any, committed: boolean, snapshot: any) => {
            if (error) {
                reject(error);
            } else if (!committed) {
                reject('Completed count not committed');
            } else {
                resolve();
            }
        });
    });
};

const setNewUserAvgDifficulty = (gymId: string, wallId: string, routeId: string, currentUser: string, revert: boolean = false): Promise<void> => {
    const oldAvgDifficultyRef = admin.database().ref('/users/' + currentUser + '/avgDifficulty');
    const routeDifficultyRef = admin.database().ref('/routes/' + gymId + '/' + wallId + '/' + routeId + '/difficulty');
    const countRef = admin.database().ref('/users/' + currentUser + '/completedRoutes');
    return new Promise((resolve, reject) => {
        oldAvgDifficultyRef.once('value', (oldAvgDifficultySnapshot: any) => {
            const oldAvgDifficulty: number = oldAvgDifficultySnapshot.val() || 0;
            routeDifficultyRef.once('value', (routeDifficultySnapshot: any) => {
                const routeDifficulty: number = routeDifficultySnapshot.val() || 0;
                if (routeDifficulty) {
                    countRef.once('value', (countSnapshot: any) => {
                        const count: number = countSnapshot.val() || 0;
                        const newAvgDifficulty = revert ? ((oldAvgDifficulty - routeDifficulty) / count) : ((oldAvgDifficulty + routeDifficulty) / count)
                        // round to 1 decimal place
                        const newAvgDifficultyRounded = isNaN(newAvgDifficulty) ? 0 : Math.round(newAvgDifficulty * 10) / 10;
                        admin.database().ref('/users/' + currentUser + '/avgDifficulty').set(newAvgDifficultyRounded).then(() => {
                            resolve();
                        }, (error: any) => {
                            reject(error);
                        });
                    }, (error: any) => {
                        reject(error);
                    });
                } else {
                    reject('Route difficulty not found');
                }
            }, (error: any) => {
                reject(error);
            });
        }, (error: any) => {
            reject(error);
        });
    });
};
import APIException from "./APIException";
import { NextFunction, Request, Response } from "express";
import User from "./interfaces/User";
import Gym, { Day, Openings } from "./interfaces/Gym";
import Wall, { WallFeatures } from "./interfaces/Wall";
import Route, { RouteFeatures } from "./interfaces/Route";
import Comment from "./interfaces/Comment";

// Helper functions for the application

// Checks if value is an valid email
export const isEmail = (email: string, undefinedIsValid: boolean = false) => {
    if (email === undefined) {
        return undefinedIsValid;
    }
    return email?.length >= 3 && email
        .toLowerCase()
        .match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        )
};

// Handles some common firebase errors
export const handleFirebaseError = (err: any, _res: Response, next: NextFunction, defaultErrorMessage: string = 'Internal server error') => {
    switch (err.code) {
        case 'auth/invalid-argument':
            next(new APIException(400, 'Invalid argument'));
            break;
        case 'auth/user-not-found':
            next(new APIException(404, 'User not found'));
            break;
        case 'auth/invalid-uid':
            next(new APIException(400, 'Invalid user id'));
            break;
        case 'auth/argument-error':
            next(new APIException(400, 'Invalid argument'));
            break;
        default:
            console.error(err);
            next(new APIException(500, defaultErrorMessage));
    }
}

// Checks if the user is valid
export const validateUser = (user: User, undefinedEmailIsValid:boolean = false): boolean => {
    if (user == undefined || Object.keys(user).length === 0) {
        return false;
    }
    if (user.username?.length < 3 || user.username?.length > 16) {
        return false;
    }
    if (!isEmail(user.email, undefinedEmailIsValid)) {
        return false;
    }
    if (user.zip != undefined && user.zip?.length < 1) {
        return false;
    }

    return true;
};

// Sterilises the user
export const steriliseUser = (user: User, fillup: boolean = false): User => {
    const newUser: User = {
        username: user.username ? user.username.trim() : null,
        email: user.email ? user.email.trim() : null,
        zip: user.zip ? user.zip.trim() : null,
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

// Checks if the gym is valid
export const validateGym = (gym: Gym, undefinedEmailIsValid: boolean = false): boolean => {
    if (gym == undefined || Object.keys(gym).length === 0) {
        return false;
    }

    if (gym.name === null || gym.name?.length < 1 || gym.name?.length > 32) {
        return false;
    }
    if (gym.zip != undefined && gym.zip?.length < 1) {
        return false;
    }
    if (gym.city != undefined && gym.city?.length < 1) {
        return false;
    }
    if (gym.street != undefined && gym.street?.length < 1) {
        return false;
    }
    if (gym.houseNumber != undefined && gym.houseNumber?.length < 1) {
        return false;
    }
    if (gym.phone != undefined && gym.phone?.length < 4) {
        return false;
    }
    if (!isEmail(gym.email, undefinedEmailIsValid)) {
        return false;
    }
    if (gym.website != undefined && gym.website?.length < 1) {
        return false;
    }
    if (gym.description != undefined && gym.description?.length > 256) {
        return false;
    }

    return true;
}

// Sterilises the gym
export const steriliseGym = (gym: Gym, fillup: boolean = false): any => {
    const newGym: any = {
        name: gym.name ? gym.name.trim() : null,
        zip: gym.zip ? gym.zip.trim() : null,
        city: gym.city ? gym.city.trim() : null,
        street: gym.street ? gym.street.trim() : null,
        houseNumber: gym.houseNumber ? gym.houseNumber.trim() : null,
        phone: gym.phone ? gym.phone.trim() : null,
        email: gym.email ? gym.email.trim() : null,
        website: gym.website ? gym.website.trim() : null,
        description: gym.description ? gym.description.trim() : null,
    };
    if (!fillup) {
        // remove empty fields
        Object.keys(newGym).forEach((key) => {
            if ((newGym as any)[key] === null) {
                delete (newGym as any)[key];
            }
        });
    }
    return newGym;
};

// Checks if value is a valid day
export const validateDay = (day: string) => {
    return day === 'monday' || day === 'tuesday' || day === 'wednesday' || day === 'thursday' || day === 'friday' || day === 'saturday' || day === 'sunday';
}

// Checks if value is a valid day from Interface
export const validateDayFromInterface = (day: Day, validNull:boolean = false) => {
    if (day?.open === null && day?.closed === null && validNull) {
        return true;
    }
    if (day == undefined || Object.keys(day).length !== 2) {
        return false;
    }
    if (typeof day.open !== 'string' || typeof day.closed !== 'string') {
        return false;
    }
    if (day.open.match(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/) === null || day.closed.match(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/) === null) {
        return false;
    }
    return true;
}

// Checks if value is valid Openings
export const validateOpenings = (openings: Openings) => {
    if (openings == undefined || Object.keys(openings).length !== 7) {
        return false;
    }
    for (const day in openings) {
        if (!validateDayFromInterface(openings[day as keyof Openings], true)) {
            return false;
        }
    }
    return true;
}

// Sterilises the Openings
export const steriliseOpenings = (openings: Openings, fillup: boolean = false): Openings => {
    const newOpenings: any = {};
    const key = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    for (const day of key) {
        newOpenings[day as keyof Openings] = steriliseDayFromInterface(openings[day as keyof Openings], fillup);
    }
    return newOpenings;
}

// Sterilises the Day from Interface
export const steriliseDayFromInterface = (day: Day, fillup: boolean = false): Day => {
    const newDay: Day = {
        open: day?.open ? day.open.trim() : null,
        closed: day?.closed ? day.closed.trim() : null,
    };
    if (!fillup) {
        // remove empty fields
        Object.keys(newDay).forEach((key) => {
            if ((newDay as any)[key] === null) {
                delete (newDay as any)[key];
            }
        });
    }
    return newDay;
}

// Checks if value is a valid date (YYYY-MM-DD)
export const validateDate = (date: string) => {
    if (date == undefined || date.length !== 10) {
        return false;
    }
    const dateArray = date.split('-');
    if (dateArray.length !== 3) {
        return false;
    }
    if (dateArray[0].length !== 4 || dateArray[1].length !== 2 || dateArray[2].length !== 2) {
        return false;
    }
    if (isNaN(parseInt(dateArray[0])) || isNaN(parseInt(dateArray[1])) || isNaN(parseInt(dateArray[2]))) {
        return false;
    }
    if (parseInt(dateArray[1]) < 1 || parseInt(dateArray[1]) > 12 || parseInt(dateArray[2]) < 1 || parseInt(dateArray[2]) > 31) {
        return false;
    }
    return true;
}

export const validateWall = (wall: Wall) => {
    const features = wall.features ? (wall.features as string).split(',') : [];
    if (wall == undefined || Object.keys(wall).length !== 2) {
        return false;
    }
    if (wall.setDate == undefined || wall.setDate.length !== 10 || !validateDate(wall.setDate)) {
        return false;
    }
    if (wall.features == undefined || features.length < 1) {
        return false;
    }

    return validateWallFeatures(features);
}

export const validateWallFeatures = (features: string[]) => {
    const usedFeatures = [] as string[];
    for (const feature of features) {
        // if feature is already used or feature is not valid
        if (usedFeatures.includes(feature) || WallFeatures[feature.toUpperCase() as keyof typeof WallFeatures] == undefined) {
            return false;
        }
        usedFeatures.push(feature);
    }
    return true;
}

export const validateRoute = (route: Route, difficulties:string[]) => {
    const features = route.features ? (route.features as string).split(',') : [];
    const difficulty = route.difficulty || null;
    if (route == undefined || Object.keys(route).length !== 1) {
        return false;
    }
    if (route.features == undefined || features.length < 1) {
        return false;
    }
    if (difficulty == null || !validateDifficulty(difficulty,  difficulties)) {
        return false;
    }

    return validateRouteFeatures(features);
}

export const validateRouteFeatures = (features: string[]) => {
    const usedFeatures = [] as string[];
    for (const feature of features) {
        // if feature is already used or feature is not valid
        if (usedFeatures.includes(feature) || RouteFeatures[feature.toUpperCase() as keyof typeof RouteFeatures] == undefined) {
            return false;
        }
        usedFeatures.push(feature);
    }
    return true;
}

export const validateComment = (comment: Comment): boolean => {
    if (comment == null) {
        return false;
    }
    if (comment.message == null && comment.image == null) {
        return false;
    }
    return true;
};

export const validateDifficulties = (difficulty: any) => {
    if (difficulty == undefined || Object.keys(difficulty).length < 1) {
        return false;
    }
    const counter = []; // key should be assending
    for (const key in difficulty) {
        let val = difficulty[key] as string; // Should be hex color string

        if (typeof val !== 'string' || val.length === 6) { // if '#' is missing for hex color string, add it
            difficulty[key] = "#" + val;
            val = difficulty[key] as string;
        }

        if (isNaN(parseInt(key)) || typeof val !== 'string' || val.length !== 7 || !val.match(/^#[0-9a-fA-F]{6}$/)) {
            return false;
        }
        counter.push(parseInt(key));
    }
    counter.sort((a, b) => a - b); // sort counter ascending
    for (let i = 0; i < counter.length; i++) { // check if keys are assending
        if (counter[i] !== i) {
            return false;
        }
    }
    return true;
}

export const validateDifficulty = (difficulty: number, difficulties:string[]) => {
    if (difficulty == undefined) {
        return false;
    }
    if (difficulties == undefined || difficulties.length < 1) {
        return false;
    }
    if (difficulty < 0 || difficulty > difficulties.length - 1) {
        return false;
    }
    return true;
}

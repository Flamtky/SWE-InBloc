import APIException from "./APIException";
import { NextFunction, Request, Response } from "express";
import User from "./interfaces/User";
import Gym from "./interfaces/Gym";

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
    console.log(gym);
    console.log(gym.name, gym.name?.length < 1 , gym.name?.length > 32);
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
        description: gym.description ? gym.description.trim() : "",
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
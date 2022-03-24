// Route Features
export enum RouteFeatures {
    SLOPER,
    CRIMPS,
    BALANCE,
    POWER,
    CAMPUS,
    BEGINNER,
    VOLUMES,
    COMP
}

// Route Interface
export default interface Route {
    features?: string;
    difficulty?: number;
}

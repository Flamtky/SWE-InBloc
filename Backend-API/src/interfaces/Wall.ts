// Wall Features
export enum WallFeatures {
    SLAB,
    ROOF,
    POSITIVE,
    NEGATIVE
}

// Wall Interface
export default interface Wall {
    setDate?: string;
    features?: string;
}

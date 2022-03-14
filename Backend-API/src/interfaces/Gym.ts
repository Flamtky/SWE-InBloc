// Gym Interface
export default interface Gym {
    name?: string;
    zip?: string;
    city?: string;
    street?: string;
    houseNumber?: string;
    phone?: string;
    email?: string;
    website?: string;
    description?: string;
}

export interface OpeningHours {
    monday: Day;
    tuesday: Day;
    wednesday: Day;
    thursday: Day;
    friday: Day;
    saturday: Day;
    sunday: Day;
}

export interface Day {
    open: string;
    closed: string;
}
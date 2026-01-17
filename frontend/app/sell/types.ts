export interface CarSpecs {
    // Step 1: The Basics
    make: string;
    model: string;
    year: number;
    trim: string; // e.g., Type R, Spec-R
    price: number;
    isNegotiable: boolean;
    odo: number;
    odoUnit: 'km' | 'miles';

    // Step 2: The Soul
    chassisCode: string; // e.g., S15, EK9
    engineCode: string; // e.g., SR20DET, B16B
    transmission: string; // e.g., "Số sàn (MT)", "Tự động (AT)", "CVT"
    drivetrain: string;   // e.g., "FWD (Trước)", "RWD (Sau)", "AWD (2 cầu)"
    condition: string;    // e.g., "Zin", "Độ nhẹ", "Độ khủng", etc.

    // Step 3: Legal
    paperwork: string;    // e.g., "CHÍNH CHỦ", "KHÔNG CHÍNH CHỦ"
    registryExpiry?: string; // Date string
    plateNumber?: string;
    hidePlate: boolean;
    noRegistry: boolean;

    // Step 4: Mods
    mods: {
        exterior: string[]; // List of items
        interior: string[];
        engine: string[];
        footwork: string[];
    };

    // Step 5: Media & Details
    description: string;
    thumbnail: string;
    images: string[];
    videoLink: string;
    location: string;
    phoneNumber: string;
    facebookLink: string;
    zaloLink: string;
    additionalInfo: string;
}

export const initialCarSpecs: CarSpecs = {
    make: '',
    model: '',
    year: new Date().getFullYear(),
    trim: '',
    price: 0,
    isNegotiable: true,
    odo: 0,
    odoUnit: 'km',
    location: '',
    chassisCode: '',
    engineCode: '',
    transmission: '',
    drivetrain: '',
    condition: '',
    paperwork: '',
    hidePlate: true,
    noRegistry: false,
    mods: {
        exterior: [],
        interior: [],
        engine: [],
        footwork: [],
    },
    description: '',
    thumbnail: '',
    images: [],
    videoLink: '',
    phoneNumber: '',
    facebookLink: '',
    zaloLink: '',
    additionalInfo: '',
};

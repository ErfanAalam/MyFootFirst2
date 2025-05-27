declare module 'country-data' {
    interface Country {
        name: string;
        currencies: string[];
        altNames?: string[];
    }
    
    export const countries: {
        all: Country[];
    };
} 
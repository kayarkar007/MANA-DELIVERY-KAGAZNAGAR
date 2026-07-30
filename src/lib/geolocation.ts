export function getCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Geolocation is not supported by your browser"));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
            },
            (error) => {
                reject(error);
            }
        );
    });
}

export const KAGAZNAGAR_CENTER = {
    latitude: 19.3316,
    longitude: 79.4831,
    name: "Sirpur Kagaznagar, Telangana",
};

export const DEFAULT_SERVICE_RADIUS_KM = 15;

/**
 * Calculates Haversine distance in kilometers between two GPS coordinates.
 */
export function calculateDistanceKm(
    lat1: number,
    lon1: number,
    lat2: number = KAGAZNAGAR_CENTER.latitude,
    lon2: number = KAGAZNAGAR_CENTER.longitude
): number {
    const R = 6371; // Earth radius in KM
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(2));
}

/**
 * Validates whether a text address belongs to the Kagaznagar / Sirpur delivery zone.
 */
export function isKagaznagarAddress(address: string): boolean {
    if (!address || typeof address !== "string") return false;
    const normalized = address.toLowerCase();
    const keywords = [
        "kagaznagar",
        "kaghaznagar",
        "kagaz nagar",
        "kaghaz nagar",
        "sirpur",
        "easgaon",
        "504296",
        "504293",
        "spm",
        "nazrulnagar",
        "chintaguda",
        "ankusapur",
        "andavelli",
    ];
    return keywords.some((kw) => normalized.includes(kw));
}

/**
 * Checks if a given coordinate is within the serviceable delivery radius.
 */

export function isWithinServiceZone(
    latitude: number,
    longitude: number,
    maxRadiusKm: number = DEFAULT_SERVICE_RADIUS_KM
): { serviceable: boolean; distanceKm: number; maxRadiusKm: number } {
    const distanceKm = calculateDistanceKm(latitude, longitude);
    return {
        serviceable: distanceKm <= maxRadiusKm,
        distanceKm,
        maxRadiusKm,
    };
}

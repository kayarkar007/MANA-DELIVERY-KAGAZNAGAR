import { calculateDistanceKm, isWithinServiceZone, KAGAZNAGAR_CENTER } from "../geolocation";
import { calculatePricing, formatCurrency } from "../utils";

function assert(condition: boolean, message: string) {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
}

export function runLibUnitTests() {
    // 1. Geolocation & Geofencing tests
    const zeroDist = calculateDistanceKm(KAGAZNAGAR_CENTER.latitude, KAGAZNAGAR_CENTER.longitude);
    assert(zeroDist === 0, "Distance to center should be 0 km");

    const insideZone = isWithinServiceZone(19.34, 79.49);
    assert(insideZone.serviceable === true, "19.34, 79.49 should be within 15 km service zone");
    assert(insideZone.distanceKm <= 15, "Distance should be <= 15 km");

    const outsideZone = isWithinServiceZone(17.385, 78.4867);
    assert(outsideZone.serviceable === false, "Hyderabad coords should be outside 15 km service zone");
    assert(outsideZone.distanceKm > 15, "Distance should be > 15 km");

    // 2. Pricing & Currency tests
    const formatted = formatCurrency(150);
    assert(formatted.includes("150"), "Formatted currency should include amount");

    const pricing = calculatePricing(100);
    assert(pricing.subtotal === 100, "Subtotal should be 100");
    assert(pricing.deliveryFee === 30, "Delivery fee should be 30");
    assert(pricing.platformFee === 5, "Platform fee should be 5");
    assert(pricing.tax === 5, "Tax should be 5");
    assert(pricing.total === 140, "Total should be 140");

    console.log("✅ All unit tests passed!");
}

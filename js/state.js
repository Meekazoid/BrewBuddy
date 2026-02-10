// ==========================================
// STATE MANAGEMENT
// Central shared mutable state
// ==========================================

// Core state variables
export let coffees = JSON.parse(localStorage.getItem('coffees') || '[]');
export let coffeeAmount = parseInt(localStorage.getItem('coffeeAmount')) || 15;
export let preferredGrinder = localStorage.getItem('preferredGrinder') || 'fellow';
export let waterHardness = null; // Current active water hardness (manual or API)
export let manualWaterHardness = JSON.parse(localStorage.getItem('manualWaterHardness') || 'null');
export let apiWaterHardness = null; // Water hardness from ZIP lookup
export let userZipCode = localStorage.getItem('userZipCode') || '';

// Expose state on window for legacy non-module scripts (backend-sync.js)
window.coffees = coffees;
window.coffeeAmount = coffeeAmount;
window.preferredGrinder = preferredGrinder;
window.waterHardness = waterHardness;
window.manualWaterHardness = manualWaterHardness;
window.userZipCode = userZipCode;

// Brew timer state (per-card)
export let brewTimers = {};
export let animationFrames = {};

// Setter functions with localStorage persistence
export function setCoffees(value) {
    coffees = value;
    localStorage.setItem('coffees', JSON.stringify(coffees));
    window.coffees = coffees; // Keep window in sync for legacy scripts
}

export function setCoffeeAmount(value) {
    coffeeAmount = value;
    localStorage.setItem('coffeeAmount', value);
    window.coffeeAmount = coffeeAmount; // Keep window in sync for legacy scripts
}

export function setPreferredGrinder(value) {
    preferredGrinder = value;
    localStorage.setItem('preferredGrinder', value);
    window.preferredGrinder = preferredGrinder; // Keep window in sync for legacy scripts
}

export function setWaterHardness(value) {
    waterHardness = value;
    window.waterHardness = waterHardness; // Keep window in sync for legacy scripts
}

export function setManualWaterHardness(value) {
    manualWaterHardness = value;
    localStorage.setItem('manualWaterHardness', JSON.stringify(value));
    window.manualWaterHardness = manualWaterHardness; // Keep window in sync for legacy scripts
}

export function setApiWaterHardness(value) {
    apiWaterHardness = value;
}

export function setUserZipCode(value) {
    userZipCode = value;
    localStorage.setItem('userZipCode', value);
    window.userZipCode = userZipCode; // Keep window in sync for legacy scripts
}

export function setBrewTimers(value) {
    brewTimers = value;
}

export function setAnimationFrames(value) {
    animationFrames = value;
}

// Helper to add a coffee using the setter for consistency
export function addCoffee(coffee) {
    coffees.push(coffee);
    setCoffees(coffees);
}

// Sync coffees to backend and localStorage
export function saveCoffeesAndSync() {
    localStorage.setItem('coffees', JSON.stringify(coffees));
    if (typeof window.backendSync !== 'undefined' && window.backendSync.syncCoffeesToBackend) {
        window.backendSync.syncCoffeesToBackend(coffees);
    }
}

// Utility to sanitize HTML for XSS protection
export function sanitizeHTML(str) {
    if (str === null || str === undefined) return '';
    // IMPORTANT: Ampersand must be replaced first to avoid double-encoding
    // (e.g., if we replace < first, then &, we'd turn &lt; into &amp;lt;)
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

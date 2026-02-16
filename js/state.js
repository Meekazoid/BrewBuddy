// ==========================================
// CENTRALIZED SHARED STATE V5.2
// ES module · Expose legacy window.* values
// ==========================================

// Load persisted values from localStorage
export let coffees = JSON.parse(localStorage.getItem('coffees') || '[]');
export let coffeeAmount = parseInt(localStorage.getItem('coffeeAmount')) || 15;
export let preferredGrinder = localStorage.getItem('preferredGrinder') || 'fellow';
export let preferredMethod = localStorage.getItem('preferredMethod') || 'v60';
export let waterHardness = null;
export let manualWaterHardness = (() => {
  try {
    return JSON.parse(localStorage.getItem('manualWaterHardness')) || null;
  } catch (e) {
    return null;
  }
})();
export let apiWaterHardness = null;
export let userZipCode = localStorage.getItem('userZipCode') || '';

// Brew timer state (per-card)
export let brewTimers = {};
export let animationFrames = {};

// Expose legacy globals so root-level scripts (backend-sync.js) continue to work
window.coffees = coffees;
window.coffeeAmount = coffeeAmount;
window.preferredGrinder = preferredGrinder;
window.preferredMethod = preferredMethod;
window.waterHardness = waterHardness;
window.manualWaterHardness = manualWaterHardness;
window.apiWaterHardness = apiWaterHardness;
window.userZipCode = userZipCode;
window.brewTimers = brewTimers;
window.animationFrames = animationFrames;

// ==========================================
// SETTERS (update module + localStorage + window.*)
// ==========================================

export function setCoffees(value) {
  coffees = value || [];
  try {
    localStorage.setItem('coffees', JSON.stringify(coffees));
  } catch (e) {
    console.warn('Failed to persist coffees to localStorage', e);
  }
  window.coffees = coffees;
}

export function setCoffeeAmount(value) {
  coffeeAmount = Number(value) || 0;
  try {
    localStorage.setItem('coffeeAmount', String(coffeeAmount));
  } catch (e) {
    console.warn('Failed to persist coffeeAmount to localStorage', e);
  }
  window.coffeeAmount = coffeeAmount;
}

export function setPreferredGrinder(value) {
  preferredGrinder = String(value || 'fellow');
  try {
    localStorage.setItem('preferredGrinder', preferredGrinder);
  } catch (e) {
    console.warn('Failed to persist preferredGrinder to localStorage', e);
  }
  window.preferredGrinder = preferredGrinder;
}

export function setPreferredMethod(value) {
  preferredMethod = String(value || 'v60');
  try {
    localStorage.setItem('preferredMethod', preferredMethod);
  } catch (e) {
    console.warn('Failed to persist preferredMethod to localStorage', e);
  }
  window.preferredMethod = preferredMethod;
}

export function setWaterHardness(value) {
  waterHardness = value;
  window.waterHardness = waterHardness;
}

export function setManualWaterHardness(value) {
  manualWaterHardness = value;
  try {
    localStorage.setItem('manualWaterHardness', JSON.stringify(manualWaterHardness));
  } catch (e) {
    console.warn('Failed to persist manualWaterHardness', e);
  }
  window.manualWaterHardness = manualWaterHardness;
}

export function setApiWaterHardness(value) {
  apiWaterHardness = value;
  window.apiWaterHardness = apiWaterHardness;
}

export function setUserZipCode(value) {
  userZipCode = String(value || '');
  try {
    localStorage.setItem('userZipCode', userZipCode);
  } catch (e) {
    console.warn('Failed to persist userZipCode to localStorage', e);
  }
  window.userZipCode = userZipCode;
}

export function setBrewTimers(value) {
  brewTimers = value || {};
  window.brewTimers = brewTimers;
}

export function setAnimationFrames(value) {
  animationFrames = value || {};
  window.animationFrames = animationFrames;
}

// ==========================================
// PERSISTENCE & SYNC
// ==========================================

export async function saveCoffeesAndSync() {
  setCoffees(coffees);

  if (typeof window.backendSync !== 'undefined' && typeof window.backendSync.syncCoffeesToBackend === 'function') {
    try {
      await window.backendSync.syncCoffeesToBackend(coffees);
    } catch (e) {
      console.warn('backendSync.syncCoffeesToBackend threw:', e);
    }
  }

  window.coffees = coffees;
}

export function addCoffee(coffee) {
  if (!coffee) return;
  coffees = [coffee, ...(coffees || [])];
  setCoffees(coffees);
}

export function replaceState(partialState = {}) {
  if (partialState.coffees) setCoffees(partialState.coffees);
  if (partialState.coffeeAmount !== undefined) setCoffeeAmount(partialState.coffeeAmount);
  if (partialState.preferredGrinder) setPreferredGrinder(partialState.preferredGrinder);
  if (partialState.preferredMethod) setPreferredMethod(partialState.preferredMethod);
  if (partialState.waterHardness !== undefined) setWaterHardness(partialState.waterHardness);
  if (partialState.manualWaterHardness !== undefined) setManualWaterHardness(partialState.manualWaterHardness);
  if (partialState.apiWaterHardness !== undefined) setApiWaterHardness(partialState.apiWaterHardness);
  if (partialState.userZipCode !== undefined) setUserZipCode(partialState.userZipCode);
  if (partialState.brewTimers !== undefined) setBrewTimers(partialState.brewTimers);
  if (partialState.animationFrames !== undefined) setAnimationFrames(partialState.animationFrames);
}

// ==========================================
// UTILITY
// ==========================================

export function sanitizeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

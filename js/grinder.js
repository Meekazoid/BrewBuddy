// ==========================================
// GRINDER & METHOD SELECTION (V5.2)
// Dropdown-based, 8 grinders + 3 methods
// ==========================================

import { preferredGrinder, setPreferredGrinder } from './state.js';
import { preferredMethod, setPreferredMethod } from './state.js';

// ── Grinder metadata ──
const GRINDER_INFO = {
    comandante_mk4: { label: 'Comandante MK4',   short: 'C40 MK4',   unit: 'clicks' },
    comandante_mk3: { label: 'Comandante MK3',   short: 'C40 MK3',   unit: 'clicks' },
    fellow_gen2:    { label: 'Fellow Ode Gen 2',  short: 'Ode Gen 2', unit: '' },
    fellow_gen1:    { label: 'Fellow Ode Gen 1',  short: 'Ode Gen 1', unit: '' },
    timemore_s3:    { label: 'Timemore S3',       short: 'S3',        unit: 'clicks' },
    timemore_c2:    { label: 'Timemore C2',       short: 'C2',        unit: 'clicks' },
    '1zpresso':     { label: '1Zpresso JX',       short: 'JX',        unit: 'rot' },
    baratza:        { label: 'Baratza Encore',     short: 'Encore',    unit: '' },
};

const METHOD_INFO = {
    v60:       { label: 'V60' },
    chemex:    { label: 'Chemex' },
    aeropress: { label: 'AeroPress' },
};

// ── Migration: old keys → new ──
const GRINDER_MIGRATION = {
    'fellow':     'fellow_gen2',
    'comandante': 'comandante_mk3',
    'timemore':   'timemore_s3',
};

export function migrateGrinderPreference() {
    const current = preferredGrinder;
    if (GRINDER_MIGRATION[current]) {
        setPreferredGrinder(GRINDER_MIGRATION[current]);
        return true;
    }
    return false;
}

/**
 * Initialize both dropdowns
 */
export function initGlobalGrinder() {
    // Run migration first
    migrateGrinderPreference();

    const grinderSelect = document.getElementById('grinder-select');
    const methodSelect = document.getElementById('method-select');

    if (!grinderSelect || !methodSelect) {
        console.warn('⚠️ Grinder/Method selects not found in DOM');
        return;
    }

    // Set initial values
    grinderSelect.value = preferredGrinder;
    methodSelect.value = preferredMethod || 'v60';

    // If the stored value doesn't match any option, fall back to fellow_gen2
    if (!grinderSelect.value || grinderSelect.selectedIndex === -1) {
        grinderSelect.value = 'fellow_gen2';
        setPreferredGrinder('fellow_gen2');
    }

    // Bind event listeners
    grinderSelect.addEventListener('change', (e) => switchGrinder(e.target.value));
    methodSelect.addEventListener('change', (e) => switchMethod(e.target.value));
}

/**
 * Switch grinder preference
 */
export async function switchGrinder(grinder) {
    setPreferredGrinder(grinder);

    if (typeof window.backendSync !== 'undefined' && window.backendSync.syncGrinderPreference) {
        await window.backendSync.syncGrinderPreference(grinder);
    }

    // Re-render all coffee cards
    if (!switchGrinder._renderCoffees) {
        const module = await import('./coffee-list.js');
        switchGrinder._renderCoffees = module.renderCoffees;
    }
    switchGrinder._renderCoffees();

    if (navigator.vibrate) navigator.vibrate(10);
    console.log(`✓ Grinder switched to: ${grinder}`);
}

/**
 * Switch brew method preference
 */
export async function switchMethod(method) {
    setPreferredMethod(method);

    if (typeof window.backendSync !== 'undefined' && window.backendSync.syncMethodPreference) {
        await window.backendSync.syncMethodPreference(method);
    }

    // Re-render all coffee cards
    if (!switchMethod._renderCoffees) {
        const module = await import('./coffee-list.js');
        switchMethod._renderCoffees = module.renderCoffees;
    }
    switchMethod._renderCoffees();

    if (navigator.vibrate) navigator.vibrate(10);
    console.log(`✓ Method switched to: ${method}`);
}

/**
 * Get human-readable grinder label
 */
export function getGrinderLabel(grinder) {
    return GRINDER_INFO[grinder]?.label || GRINDER_INFO.fellow_gen2.label;
}

/**
 * Get short grinder label (for tight spaces)
 */
export function getGrinderShortLabel(grinder) {
    return GRINDER_INFO[grinder]?.short || GRINDER_INFO.fellow_gen2.short;
}

/**
 * Get method label
 */
export function getMethodLabel(method) {
    return METHOD_INFO[method]?.label || 'V60';
}

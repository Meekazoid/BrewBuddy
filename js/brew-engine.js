// ==========================================
// BREW PARAMETERS ENGINE
// Brew ratio/recommendation calculations
// ==========================================

import { coffeeAmount, preferredGrinder, manualWaterHardness, apiWaterHardness } from './state.js';
import { getGrinderLabel } from './grinder.js';

export function getBrewRecommendations(coffee) {
    const amount = coffee.customAmount || coffeeAmount;
    const grinder = preferredGrinder;

    const baseParams = getProcessingBaseParams(coffee.process);
    const altitudeAdjusted = adjustForAltitude(baseParams, coffee.altitude);
    const cultivarAdjusted = adjustForCultivar(altitudeAdjusted, coffee.cultivar);
    const originAdjusted = adjustForOrigin(cultivarAdjusted, coffee.origin);
    const finalParams = adjustForWaterHardness(originAdjusted);

    const grindSetting = getGrinderValue(finalParams.grindBase, grinder, coffee.grindOffset);
    const temperature = coffee.customTemp || formatTemp(finalParams.tempBase);
    const steps = generateBrewSteps(amount, finalParams.ratio, finalParams.brewStyle);
    const waterAmountMl = Math.round(amount * finalParams.ratio);

    return {
        grindSetting,
        grinderLabel: getGrinderLabel(grinder),
        temperature,
        ratio: `1:${finalParams.ratio} (${amount}g)`,
        ratioNumber: finalParams.ratio,
        waterAmountMl,
        steps,
        targetTime: finalParams.targetTime,
        notes: generateBrewNotes(coffee, finalParams)
    };
}

function getProcessingBaseParams(process) {
    const p = process.toLowerCase();

    if (p.includes('nitro') || p.includes('co2') || p.includes('co-infused')) {
        return { grindBase: { comandante: 18, fellow: 2.8 }, tempBase: { min: 90, max: 91 }, ratio: 15.5, brewStyle: 'slow', targetTime: '2:45-3:15', category: 'experimental-nitro' };
    }
    if (p.includes('anaerobic') && p.includes('natural')) {
        return { grindBase: { comandante: 20, fellow: 3.2 }, tempBase: { min: 91, max: 92 }, ratio: 16.5, brewStyle: 'controlled', targetTime: '2:30-3:00', category: 'anaerobic-natural' };
    }
    if (p.includes('anaerobic') && p.includes('washed')) {
        return { grindBase: { comandante: 19, fellow: 3.0 }, tempBase: { min: 91, max: 92 }, ratio: 16, brewStyle: 'controlled', targetTime: '2:30-3:00', category: 'anaerobic-washed' };
    }
    if (p.includes('carbonic')) {
        return { grindBase: { comandante: 20, fellow: 3.3 }, tempBase: { min: 90, max: 91 }, ratio: 16, brewStyle: 'slow', targetTime: '2:45-3:15', category: 'carbonic' };
    }
    if (p.includes('extended') || p.includes('long ferment')) {
        return { grindBase: { comandante: 21, fellow: 3.4 }, tempBase: { min: 91, max: 92 }, ratio: 16.2, brewStyle: 'controlled', targetTime: '2:30-3:00', category: 'extended-fermentation' };
    }
    if (p.includes('yeast')) {
        return { grindBase: { comandante: 23, fellow: 3.8 }, tempBase: { min: 92, max: 93 }, ratio: 16.5, brewStyle: 'standard', targetTime: '2:30-3:00', category: 'yeast' };
    }
    if (p.includes('honey')) {
        let grindBase, tempBase;
        if (p.includes('yellow')) {
            grindBase = { comandante: 23, fellow: 3.6 };
            tempBase = { min: 92, max: 93 };
        } else if (p.includes('black')) {
            grindBase = { comandante: 26, fellow: 4.2 };
            tempBase = { min: 93, max: 94 };
        } else {
            grindBase = { comandante: 24, fellow: 3.9 };
            tempBase = { min: 93, max: 94 };
        }
        return { grindBase, tempBase, ratio: 16.7, brewStyle: 'fruity', targetTime: '2:45-3:15', category: 'honey' };
    }
    if (p.includes('natural')) {
        return { grindBase: { comandante: 25, fellow: 4.1 }, tempBase: { min: 93, max: 94 }, ratio: 16.7, brewStyle: 'fruity', targetTime: '2:45-3:15', category: 'natural' };
    }
    // Default: washed
    return { grindBase: { comandante: 22, fellow: 3.5 }, tempBase: { min: 92, max: 93 }, ratio: 16, brewStyle: 'standard', targetTime: '2:30-3:00', category: 'washed' };
}

function adjustForAltitude(params, altitudeStr) {
    const altitude = parseInt(altitudeStr) || 1500;
    let grindAdjust = 0, tempAdjust = 0;

    if (altitude < 1200)       { grindAdjust = +2; tempAdjust = -1; }
    else if (altitude < 1400)  { grindAdjust = +1; }
    else if (altitude >= 1800) { grindAdjust = -2; tempAdjust = +1; }
    else if (altitude >= 1600) { grindAdjust = -1; }

    return {
        ...params,
        grindBase: { comandante: params.grindBase.comandante + grindAdjust, fellow: params.grindBase.fellow + (grindAdjust * 0.25) },
        tempBase: { min: params.tempBase.min + tempAdjust, max: params.tempBase.max + tempAdjust },
        altitudeAdjustment: { grindAdjust, tempAdjust, altitude }
    };
}

function adjustForCultivar(params, cultivarStr) {
    const cultivar = cultivarStr.toLowerCase();
    let grindAdjust = 0, tempAdjust = 0, category = 'balanced';

    if (cultivar.includes('gesha') || cultivar.includes('geisha') ||
        cultivar.includes('sl28') || cultivar.includes('sl34') ||
        cultivar.includes('bourbon') || cultivar.includes('typica')) {
        grindAdjust = -1; tempAdjust = -1; category = 'delicate';
    } else if (cultivar.includes('pacamara') || cultivar.includes('maragogype') ||
               cultivar.includes('catimor') || cultivar.includes('sarchimor') ||
               cultivar.includes('robusta')) {
        grindAdjust = +1; tempAdjust = +1; category = 'robust';
    }

    return {
        ...params,
        grindBase: { comandante: params.grindBase.comandante + grindAdjust, fellow: params.grindBase.fellow + (grindAdjust * 0.25) },
        tempBase: { min: params.tempBase.min + tempAdjust, max: params.tempBase.max + tempAdjust },
        cultivarAdjustment: { grindAdjust, tempAdjust, category }
    };
}

function adjustForOrigin(params, originStr) {
    const origin = originStr.toLowerCase();
    let grindAdjust = 0, tempAdjust = 0, region = 'latin-america';

    if (origin.includes('ethiopia') || origin.includes('kenya') ||
        origin.includes('rwanda') || origin.includes('burundi') ||
        origin.includes('tanzania')) {
        grindAdjust = -1; region = 'africa';
    } else if (origin.includes('indonesia') || origin.includes('sumatra') ||
               origin.includes('java') || origin.includes('india') ||
               origin.includes('vietnam') || origin.includes('papua')) {
        grindAdjust = +1; tempAdjust = +1; region = 'asia';
    }

    return {
        ...params,
        grindBase: { comandante: params.grindBase.comandante + grindAdjust, fellow: params.grindBase.fellow + (grindAdjust * 0.25) },
        tempBase: { min: params.tempBase.min + tempAdjust, max: params.tempBase.max + tempAdjust },
        originAdjustment: { grindAdjust, tempAdjust, region }
    };
}

function adjustForWaterHardness(params) {
    const activeHardness = getActiveWaterHardness();
    if (!activeHardness) return params;

    let grindAdjust = 0, tempAdjust = 0;
    const category = activeHardness.category || getWaterHardnessCategory(activeHardness.value);

    if (category === 'very_soft' || category === 'soft') {
        grindAdjust = -2; tempAdjust = +1;
    } else if (category === 'hard' || category === 'very_hard') {
        grindAdjust = +2; tempAdjust = -1;
    }

    return {
        ...params,
        grindBase: { comandante: params.grindBase.comandante + grindAdjust, fellow: params.grindBase.fellow + (grindAdjust * 0.5) },
        tempBase: { min: params.tempBase.min + tempAdjust, max: params.tempBase.max + tempAdjust },
        waterAdjustment: { grindAdjust, tempAdjust }
    };
}

// Conversion Table Reference:
// | Grinder            | µm/Step | V60     | Chemex  | AeroPress | French Press |
// |--------------------|---------|---------|---------|-----------|--------------|
// | Comandante MK3/MK4 | ~30     | 22-28   | 28-32   | 18-24     | 30-34        |
// | Fellow Ode Gen 2   | ~25     | 3.0-5.0 | 5.0-7.0 | 1.5-3.0   | 6.0-9.0      |
// | Fellow Ode Gen 1   | ~50     | 2.0-3.5 | 4.0-5.5 | 1.0-1.5   | 5.0-7.0      |
// | Timemore S3        | ~15     | 50-70   | 68-80   | 40-55     | 80-90        |
// | Timemore C2        | ~80     | 16-20   | 21-23   | 11-15     | 24-28        |
// | 1Zpresso JX        | ~25     | 1.4-2.5 | 2.0-2.8 | 1.0-1.4   | 2.5-3.5      |
// | Baratza Encore     | ~25     | 15-20   | 20-25   | 10-15     | 25-30        |

function getGrinderValue(grindBase, grinder, offset) {
    const o = offset || 0;
    const base = grindBase.comandante; // All conversions anchor to Comandante clicks

    switch (grinder) {

        // ── Comandante C40 MK3 & MK4 ──
        // Identical Nitro Blade burrs, ~30µm/click, 40 clicks total
        // MK4 may need 1-2 clicks finer (polymer jar static), but same scale
        case 'comandante_mk4':
        case 'comandante_mk3':
            return `${Math.max(1, Math.round(base + o))} clicks`;

        // ── Fellow Ode Gen 2 ──
        // 64mm flat Brew Burrs, min ~250µm, ~25µm/step
        // Conversion: Fellow = (Comandante - 22) × 0.25 + 3.5
        // Offset: ±0.1 per unit
        case 'fellow_gen2': {
            const val = grindBase.fellow + o * 0.1;
            return Math.max(0.1, val).toFixed(1);
        }

        // ── Fellow Ode Gen 1 ──
        // Standard Brew Burrs, min ~500µm, ~50µm/step
        // ~1.5 settings lower than Gen 2 across the board
        // Offset: ±0.1 per unit
        case 'fellow_gen1': {
            const val = (grindBase.fellow - 1.5) + o * 0.1;
            return Math.max(0.1, val).toFixed(1);
        }

        // ── Timemore Chestnut S3 ──
        // 40mm S2C890 conical, external adj, 90 clicks, ~15µm/click
        // Conversion factor: 2.4 (Comandante 25 ≈ S3 60)
        // Offset: ±2.4 clicks per unit
        case 'timemore_s3': {
            const val = Math.round(base * 2.4 + o * 2.4);
            return `${Math.max(1, val)} clicks`;
        }

        // ── Timemore Chestnut C2 ──
        // 38mm steel conical, internal adj, 36 clicks, ~80µm/click
        // Conversion factor: 0.72 (Comandante 25 ≈ C2 18)
        // Offset: ±0.72 clicks per unit
        case 'timemore_c2': {
            const val = Math.round(base * 0.72 + o * 0.72);
            return `${Math.max(1, val)} clicks`;
        }

        // ── 1Zpresso JX ──
        // Internal adjustment, 30 clicks/rotation, ~25µm/click
        // Expressed as rotations (e.g. "2.5 rot")
        // Conversion: rotations = Comandante / 30 × 1.1
        // Offset: ± (1.1/30) rotations per unit
        case '1zpresso': {
            const rotations = base / 30 * 1.1 + o * (1.1 / 30);
            return `${Math.max(0.1, rotations).toFixed(1)} rot`;
        }

        // ── Baratza Encore ──
        // Stepped conical, 40 settings, ~25µm/step
        // Roughly 1:1 with Comandante for pourover range
        // Offset: ±1 per unit
        case 'baratza': {
            const val = Math.round(base * 0.8 + o);
            return `${Math.max(1, Math.min(40, val))}`;
        }

        // ── Fallback: Fellow Gen 2 ──
        default: {
            const val = grindBase.fellow + o * 0.1;
            return Math.max(0.1, val).toFixed(1);
        }
    }
}

function formatTemp(tempBase) {
    return `${tempBase.min}-${tempBase.max}°C`;
}

function generateBrewSteps(amount, ratio, brewStyle) {
    const waterAmount = Math.round(amount * ratio);
    const bloom = Math.round(amount * (brewStyle === 'slow' ? 3.5 : 3));

    if (brewStyle === 'slow') {
        return [
            { time: '0:00', action: `Bloom: ${bloom}g water, wait 45 sec` },
            { time: '0:45', action: `To ${Math.round(waterAmount * 0.45)}g: Very slow circular pour` },
            { time: '1:30', action: `To ${Math.round(waterAmount * 0.75)}g: Continue slowly` },
            { time: '2:15', action: `To ${waterAmount}g: Final pour` }
        ];
    }
    if (brewStyle === 'fruity') {
        return [
            { time: '0:00', action: `Bloom: ${bloom}g, create crater, 45 sec` },
            { time: '0:45', action: `To ${Math.round(waterAmount * 0.52)}g: Pour slowly` },
            { time: '1:20', action: `To ${Math.round(waterAmount * 0.84)}g: Concentric circles` },
            { time: '1:50', action: `To ${waterAmount}g: Final pour` }
        ];
    }
    // Standard & controlled
    return [
        { time: '0:00', action: `Bloom: ${bloom}g water, 30-40 sec` },
        { time: '0:40', action: `To ${Math.round(waterAmount * 0.5)}g: Pour evenly` },
        { time: '1:15', action: `To ${Math.round(waterAmount * 0.83)}g: Concentric circles` },
        { time: '1:45', action: `To ${waterAmount}g: Final pour` }
    ];
}

function generateBrewNotes(coffee, params) {
    const notes = [];
    const categoryNotes = {
        'experimental-nitro': 'Nitro process - very delicate, preserve volatile compounds',
        'anaerobic-natural': 'Anaerobic natural - funky & fruity, control extraction',
        'anaerobic-washed': 'Anaerobic washed - clean but complex, cooler temp',
        'carbonic': 'Carbonic maceration - wine-like characteristics, slow extraction',
        'extended-fermentation': 'Extended fermentation - intense flavors, careful extraction',
        'yeast': 'Yeast inoculated - unique fermentation notes, standard approach',
        'honey': 'Honey process - sweet & fruity, balanced extraction',
        'natural': 'Natural process - full fruit body, coarser grind',
        'washed': 'Washed process - clean & bright, standard parameters'
    };
    notes.push(categoryNotes[params.category] || 'Standard brewing approach');

    if (params.altitudeAdjustment) {
        if (params.altitudeAdjustment.altitude >= 1800) notes.push('High altitude beans - very dense, ground finer');
        else if (params.altitudeAdjustment.altitude < 1200) notes.push('Low altitude beans - softer, ground coarser');
    }
    if (params.cultivarAdjustment) {
        if (params.cultivarAdjustment.category === 'delicate') notes.push('Delicate cultivar - gentle extraction, lower temp');
        else if (params.cultivarAdjustment.category === 'robust') notes.push('Robust cultivar - can handle higher temps & coarser grind');
    }
    if (params.originAdjustment) {
        if (params.originAdjustment.region === 'africa') notes.push('African origin - floral notes, finer grind');
        else if (params.originAdjustment.region === 'asia') notes.push('Asian origin - earthy body, coarser grind');
    }
    
    const activeHardness = getActiveWaterHardness();
    if (activeHardness) {
        const category = activeHardness.category || getWaterHardnessCategory(activeHardness.value);
        if (category === 'very_soft' || category === 'soft') notes.push('Soft water - ground finer, higher temp');
        else if (category === 'hard' || category === 'very_hard') notes.push('Hard water - ground coarser, consider filtering');
    }

    return notes.join('. ');
}

export function boldWeights(text) {
    return text.replace(/(\d+g)/g, '<strong>$1</strong>');
}

// Water hardness helper functions
function getActiveWaterHardness() {
    return manualWaterHardness || apiWaterHardness;
}

function getWaterHardnessCategory(value) {
    if (value < 7) return 'very_soft';
    if (value < 14) return 'soft';
    if (value < 21) return 'medium';
    if (value < 28) return 'hard';
    return 'very_hard';
}

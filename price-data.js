// Alan Vargas Jewelry LLC - 2026 Price List
// Based on Geller Blue Book Ver.5 Release 6.60 adjusted for gold at $4,000/oz

const PRICE_DATA = {
    // Ring Sizing: 10kt / 14kt
    ringSizing: {
        '10kt-14kt': {
            thin: { // Less than 3.0mm
                yellow: {
                    '0-4': { smaller: 29, oneUp: 55, addtUp: 27 },
                    '5-20': { smaller: 35, oneUp: 61, addtUp: 27 }
                },
                'white-rose': {
                    '0-4': { smaller: 41, oneUp: 68, addtUp: 27 },
                    '5-20': { smaller: 47, oneUp: 74, addtUp: 27 }
                }
            },
            medium: { // 3.01 to 5.0mm
                yellow: {
                    '0-4': { smaller: 34, oneUp: 61, addtUp: 40 },
                    '5-20': { smaller: 40, oneUp: 67, addtUp: 40 }
                },
                'white-rose': {
                    '0-4': { smaller: 47, oneUp: 74, addtUp: 40 },
                    '5-20': { smaller: 53, oneUp: 79, addtUp: 40 }
                }
            },
            wide: { // 5.01mm to 8.0mm
                yellow: {
                    '0-4': { smaller: 40, oneUp: 67, addtUp: 53 },
                    '5-20': { smaller: 46, oneUp: 73, addtUp: 53 }
                },
                'white-rose': {
                    '0-4': { smaller: 53, oneUp: 79, addtUp: 53 },
                    '5-20': { smaller: 58, oneUp: 85, addtUp: 53 }
                }
            }
        },
        '18kt': {
            thin: {
                yellow: {
                    '0-4': { smaller: 34, oneUp: 61, addtUp: 40 },
                    '5-20': { smaller: 40, oneUp: 67, addtUp: 40 }
                },
                'white-rose': {
                    '0-4': { smaller: 47, oneUp: 74, addtUp: 40 },
                    '5-20': { smaller: 53, oneUp: 79, addtUp: 40 }
                }
            },
            medium: {
                yellow: {
                    '0-4': { smaller: 40, oneUp: 67, addtUp: 53 },
                    '5-20': { smaller: 46, oneUp: 73, addtUp: 53 }
                },
                'white-rose': {
                    '0-4': { smaller: 53, oneUp: 79, addtUp: 53 },
                    '5-20': { smaller: 58, oneUp: 85, addtUp: 53 }
                }
            },
            wide: {
                yellow: {
                    '0-4': { smaller: 46, oneUp: 73, addtUp: 67 },
                    '5-20': { smaller: 52, oneUp: 78, addtUp: 67 }
                },
                'white-rose': {
                    '0-4': { smaller: 58, oneUp: 85, addtUp: 67 },
                    '5-20': { smaller: 64, oneUp: 91, addtUp: 67 }
                }
            }
        },
        'platinum': {
            thin: {
                '0-4': { smaller: 40, oneUp: 75, addtUp: 35 },
                '5-20': { smaller: 50, oneUp: 90, addtUp: 35 }
            },
            medium: {
                '0-4': { smaller: 45, oneUp: 120, addtUp: 65 },
                '5-20': { smaller: 60, oneUp: 130, addtUp: 65 }
            },
            wide: {
                '0-4': { smaller: 50, oneUp: 150, addtUp: 80 },
                '5-20': { smaller: 65, oneUp: 165, addtUp: 80 }
            }
        },
        'silver': {
            thin: {
                without: { smaller: 17, oneUp: 29, addtUp: 12 },
                with: { smaller: 25, oneUp: 35, addtUp: 12 }
            },
            medium: {
                without: { smaller: 23, oneUp: 35, addtUp: 17 },
                with: { smaller: 30, oneUp: 41, addtUp: 17 }
            }
            // Note: Silver doesn't have wide (5.01-8.0mm) in the price list
        }
    },

    // Stone Setting: Round
    stoneSettingRound: {
        '0.01-0.07': { prong: 10, channel: 17, bezel: 14 },  // .005 to 2.6mm
        '0.08-0.15': { prong: 14, channel: 23, bezel: 17 },  // 2.7 to 3.3mm
        '0.16-0.50': { prong: 18, channel: 31, bezel: 25 },  // 3.4 to 5.2mm
        '0.51-0.75': { prong: 20, channel: 41, bezel: 30 },  // 5.2 to 5.8mm
        '0.76-1.00': { prong: 36, channel: 54, bezel: 38 },  // 5.8 to 6.5mm
        '1.01-1.50': { prong: 40, channel: 62, bezel: 45 },  // 6.5 to 7.4mm
        '1.51-2.00': { prong: 47, channel: 71, bezel: 53 },  // 7.4 to 8.2mm
        '2.01-3.00': { prong: 54, channel: 97, bezel: 60 },  // 8.2 to 9.4mm
        '3.01-4.00': { prong: 62, channel: 115, bezel: 69 }, // 9.4 to 10.4mm
        '4.01-5.00': { prong: 69, channel: 128, bezel: 72 }, // 10.4 to 11.2mm
        '5.01+': { prong: 110, channel: 133, bezel: 76 }     // 11.2mm and up
    },

    // Stone Setting: Other Shapes
    stoneSettingOther: {
        '0.01-0.07': { 'oval-pear-heart': 15, 'marquise-emerald': 17, princess: 18 },
        '0.08-0.15': { 'oval-pear-heart': 20, 'marquise-emerald': 25, princess: 25 },
        '0.16-0.50': { 'oval-pear-heart': 30, 'marquise-emerald': 32, princess: 37 },
        '0.51-0.75': { 'oval-pear-heart': 31, 'marquise-emerald': 36, princess: 40 },
        '0.76-1.00': { 'oval-pear-heart': 55, 'marquise-emerald': 65, princess: 72 },
        '1.01-1.50': { 'oval-pear-heart': 62, 'marquise-emerald': 71, princess: 81 },
        '1.51-2.00': { 'oval-pear-heart': 72, 'marquise-emerald': 85, princess: 95 },
        '2.01-3.00': { 'oval-pear-heart': 85, 'marquise-emerald': 95, princess: 108 },
        '3.01-4.00': { 'oval-pear-heart': 95, 'marquise-emerald': 108, princess: 125 },
        '4.01-5.00': { 'oval-pear-heart': 107, 'marquise-emerald': 121, princess: 140 },
        '5.01+': { 'oval-pear-heart': 115, 'marquise-emerald': 127, princess: 155 }
    },

    // Tips and Prongs
    tipsAndProngs: {
        '14kt-silver': {
            first: { tip: 15, prong: 17, 'full-prong': 25, 'v-prong': 35 },
            additional: { tip: 10, prong: 12, 'full-prong': 15, 'v-prong': 25 }
        },
        '18kt': {
            first: { tip: 18, prong: 25, 'full-prong': 30, 'v-prong': 40 },
            additional: { tip: 12, prong: 15, 'full-prong': 21, 'v-prong': 30 }
        }
    },

    // Chains
    chains: {
        'solder': 12,
        'solder-hollow': 17,
        'rivet': 17,
        'tube': 17,
        'figure8': 12,     // SS
        'safety': 12,      // SS
        'jumpring': 12,    // SS
        'tighten': 12
    },

    // Miscellaneous Services
    miscellaneous: {
        'clean-polish-rhodium': 25,
        'reshape': 17,
        'remove-stone': 6,
        'pearl-epoxy': 6,
        'sizing-bumps': 35,
        'unsolder': 46,
        'unsolder-addt': 23,
        'straighten-head': 23,
        'pearl-restring': 2,  // per inch
        'satin-finish': 12,
        'black-enamel': 17,
        'stone-tightening-addt': 6  // ea addt'l over 10
    },

    // Metal purity multipliers for material calculations
    metalPurity: {
        'gold-24k': 1.000,
        'gold-22k': 0.916,
        'gold-18k': 0.750,
        'gold-14k': 0.585,
        'gold-10k': 0.417,
        'silver': 0.925,    // Sterling
        'platinum': 0.950,
        'palladium': 0.950
    },

    // Unit conversions (to troy ounces)
    unitConversions: {
        'oz': 1,
        'dwt': 0.05,        // 1 dwt = 0.05 troy oz (20 dwt per troy oz)
        'grams': 0.03215    // 1 gram = 0.03215 troy oz (31.1 grams per troy oz)
    }
};

// Service descriptions for display
const SERVICE_DESCRIPTIONS = {
    ringSizing: {
        smaller: 'Size Down (Up to 3 sizes)',
        '1-up': 'Size Up (1 size)',
        'addt-up': 'Additional Size Up'
    },
    settingTypes: {
        prong: 'Prong (Low Base)',
        channel: 'Channel / Tiffany',
        bezel: 'Bezel'
    },
    metalNames: {
        '10kt-14kt': '10kt/14kt Gold',
        '18kt': '18kt Gold',
        'platinum': 'Platinum',
        'silver': 'Sterling Silver'
    },
    widthNames: {
        thin: 'Less than 3.0mm',
        medium: '3.01 to 5.0mm',
        wide: '5.01 to 8.0mm'
    },
    chainServices: {
        'solder': 'Chain Solder',
        'solder-hollow': 'Chain Solder (Hollow)',
        'rivet': 'Rivet',
        'tube': 'Tube',
        'figure8': 'Figure 8 (SS)',
        'safety': 'Safety Chain (SS)',
        'jumpring': 'Jump Ring + Solder (SS)',
        'tighten': 'Tighten Clasp'
    },
    miscServices: {
        'clean-polish-rhodium': 'Clean/Polish/Rhodium',
        'reshape': 'Reshape Ring',
        'remove-stone': 'Remove Stone',
        'pearl-epoxy': 'Pearl Post Epoxy',
        'sizing-bumps': 'Sizing Bumps',
        'unsolder': 'Unsolder Two Rings',
        'unsolder-addt': 'Unsolder Each Additional',
        'straighten-head': 'Straighten Head',
        'pearl-restring': 'Pearl Re-Stringing (per inch)',
        'satin-finish': 'Satin Finish',
        'black-enamel': 'Black Enameling',
        'stone-tightening-addt': 'Stone Tightening (ea. addt\'l over 10)'
    },
    prongTypes: {
        'tip': 'Tip',
        'prong': 'Prong',
        'full-prong': 'Full Prong',
        'v-prong': 'V Prong'
    },
    stoneShapes: {
        'round': 'Round',
        'oval-pear-heart': 'Oval/Pear/Heart',
        'marquise-emerald': 'Marquise/Emerald Cut',
        'princess': 'Princess'
    },
    materialMetals: {
        'gold-24k': '24kt Gold',
        'gold-22k': '22kt Gold',
        'gold-18k': '18kt Gold',
        'gold-14k': '14kt Gold',
        'gold-10k': '10kt Gold',
        'silver': 'Sterling Silver',
        'platinum': 'Platinum',
        'palladium': 'Palladium'
    }
};

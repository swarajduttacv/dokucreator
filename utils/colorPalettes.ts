export interface ColorPalette {
    name: string;
    displayName: string;
    background: string;
    text: string;
    colors: string[];
}

export const colorPalettes: { [key: string]: ColorPalette } = {
    default: {
        name: 'default',
        displayName: 'DokuCreator Default',
        background: '#F5F2E9',
        text: '#3E2723',
        colors: ['#8d6e63', '#a1887f', '#bcaaa4', '#d7ccc8', '#795548', '#5d4037'],
    },
    corporate: {
        name: 'corporate',
        displayName: 'Corporate Blue',
        background: '#FFFFFF',
        text: '#0D47A1',
        colors: ['#1976D2', '#2196F3', '#64B5F6', '#90CAF9', '#BBDEFB', '#42A5F5'],
    },
    ocean: {
        name: 'ocean',
        displayName: 'Ocean Breeze',
        background: '#E0F7FA',
        text: '#004D40',
        colors: ['#00796B', '#0097A7', '#26C6DA', '#4DD0E1', '#80DEEA', '#B2EBF2'],
    },
    sereneSage: {
        name: 'sereneSage',
        displayName: 'Serene Sage',
        background: '#F1F8E9',
        text: '#2E7D32',
        colors: ['#558B2F', '#7CB342', '#9CCC65', '#AED581', '#C5E1A5', '#DCEDC8'],
    },
    goldenHour: {
        name: 'goldenHour',
        displayName: 'Golden Hour',
        background: '#FFF8E1',
        text: '#E65100',
        colors: ['#FF8F00', '#FFA000', '#FFB300', '#FFC107', '#FFCA28', '#FFD54F'],
    },
    violetDelight: {
        name: 'violetDelight',
        displayName: 'Violet Delight',
        background: '#F3E5F5',
        text: '#4A148C',
        colors: ['#6A1B9A', '#7B1FA2', '#8E24AA', '#9C27B0', '#AB47BC', '#BA68C8'],
    },
    freshMeadow: {
        name: 'freshMeadow',
        displayName: 'Fresh Meadow',
        background: '#E8F5E9',
        text: '#1B5E20',
        colors: ['#2E7D32', '#388E3C', '#43A047', '#4CAF50', '#66BB6A', '#81C784'],
    },
    softBlush: {
        name: 'softBlush',
        displayName: 'Soft Blush',
        background: '#FCE4EC',
        text: '#880E4F',
        colors: ['#AD1457', '#C2185B', '#D81B60', '#E91E63', '#EC407A', '#F06292'],
    },
    warmNeutral: {
        name: 'warmNeutral',
        displayName: 'Warm Neutral',
        background: '#EFEBE9',
        text: '#3E2723',
        colors: ['#6D4C41', '#795548', '#8D6E63', '#A1887F', '#BCAAA4', '#D7CCC8'],
    },
    dark: {
        name: 'dark',
        displayName: 'Dark Mode',
        background: '#212121',
        text: '#E0E0E0',
        colors: ['#757575', '#9E9E9E', '#BDBDBD', '#616161', '#424242', '#B0BEC5'],
    },
    // --- New Professional Palettes ---
    mckinseyBlue: {
        name: 'mckinseyBlue',
        displayName: 'McKinsey Blue',
        background: '#FAFBFD',
        text: '#0A2540',
        colors: ['#003A70', '#0061A8', '#0084D4', '#4DA3E2', '#8CC5F0', '#B8DCF8'],
    },
    financialTimes: {
        name: 'financialTimes',
        displayName: 'Financial Times',
        background: '#FFF1E5',
        text: '#33302B',
        colors: ['#990F3D', '#FF7FAA', '#0D7680', '#00B2A9', '#FF8833', '#593380'],
    },
    techModern: {
        name: 'techModern',
        displayName: 'Tech Modern',
        background: '#0F0F23',
        text: '#E8E8F0',
        colors: ['#6366F1', '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B', '#06B6D4'],
    },
    monochromePro: {
        name: 'monochromePro',
        displayName: 'Monochrome Pro',
        background: '#FFFFFF',
        text: '#1A1A1A',
        colors: ['#1A1A1A', '#404040', '#666666', '#8C8C8C', '#B3B3B3', '#D9D9D9'],
    },
    colorblindSafe: {
        name: 'colorblindSafe',
        displayName: 'Colorblind Safe',
        background: '#FFFFFF',
        text: '#2C2C2C',
        colors: ['#E69F00', '#56B4E9', '#009E73', '#F0E442', '#0072B2', '#D55E00'],
    },
};

export const getPalette = (name?: string, custom?: { background: string; colors: string[] }): ColorPalette => {
    if (custom) {
        const r = parseInt(custom.background.slice(1, 3), 16);
        const g = parseInt(custom.background.slice(3, 5), 16);
        const b = parseInt(custom.background.slice(5, 7), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        const textColor = brightness > 125 ? '#000000' : '#FFFFFF';

        return {
            name: 'custom',
            displayName: 'Custom',
            background: custom.background,
            text: textColor,
            colors: custom.colors,
        };
    }
    return colorPalettes[name || 'default'] || colorPalettes.default;
};
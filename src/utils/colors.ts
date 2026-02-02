// Predefined palette of 20 distinct, aesthetically pleasing colors
// Using a mix of pastels and soft vibrant colors that work well with dark text
export const CATEGORY_COLORS = [
    '#FFADAD', // Light Red
    '#FFD6A5', // Apricot
    '#FDFFB6', // Light Yellow
    '#CAFFBF', // Light Green
    '#9BF6FF', // Light Cyan
    '#A0C4FF', // Light Blue
    '#BDB2FF', // Light Purple
    '#FFC6FF', // Light Pink
    '#F08080', // Light Coral
    '#48D1CC', // Medium Turquoise
    '#87CEFA', // Light Sky Blue
    '#DDA0DD', // Plum
    '#F0E68C', // Khaki
    '#98FB98', // Pale Green
    '#AFEEEE', // Pale Turquoise
    '#DB7093', // Pale Violet Red
    '#FFFACD', // Lemon Chiffon
    '#E0FFFF', // Light Cyan
    '#FFDAB9', // Peach Puff
    '#E6E6FA', // Lavender
];

/**
 * Deterministically picks a color from the predefined palette based on the input string (e.g., ID).
 * This ensures the same ID always gets the same color.
 * @param id The string identifier (e.g., category ID)
 * @returns A hex color string
 */
export const getRandomColor = (id: string): string => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Use the absolute value of the hash to pick an index
    const index = Math.abs(hash) % CATEGORY_COLORS.length;
    return CATEGORY_COLORS[index];
};

/**
 * Calculates a legible text color (black or white) based on the background color.
 * Simple algorithm checking brightness properly.
 * @param hexColor The background hex color
 * @returns '#000000' or '#FFFFFF'
 */
export const getContrastTextColor = (hexColor: string): string => {
    // Remove hash if present
    const hex = hexColor.replace('#', '');

    // Parse RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Calculate relative luminance (perceived brightness)
    // Formula: L = 0.2126 * R + 0.7152 * G + 0.0722 * B
    // Standard threshold is 128 for 0-255 range, but adjusted for better readability
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    // Return black for bright colors, white for dark colors
    // Since our palette is mostly light/pastel, we mostly want dark text
    // Threshold > 128 means bright background -> dark text
    return brightness > 128 ? '#1F2937' : '#FFFFFF'; // Using gray-800 instead of pure black for softer look
};

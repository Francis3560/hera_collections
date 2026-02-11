const colorPalettes = [
  // Primary & Basic Colors
  { name: 'Red', value: '#EF4444' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#22C55E' },
  { name: 'Yellow', value: '#EAB308' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Purple', value: '#A855F7' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Black', value: '#000000' },
  { name: 'White', value: '#FFFFFF' },
  { name: 'Gray', value: '#6B7280' },
  
  // Neutral Shades
  { name: 'Slate', value: '#64748B' },
  { name: 'Zinc', value: '#71717A' },
  { name: 'Neutral', value: '#737373' },
  { name: 'Stone', value: '#78716C' },

  // Red Shades
  { name: 'Light Red', value: '#FCA5A5' },
  { name: 'Dark Red', value: '#991B1B' },
  { name: 'Rose', value: '#F43F5E' },
  { name: 'Crimson', value: '#DC143C' },
  { name: 'Maroon', value: '#800000' },
  { name: 'Ruby', value: '#E0115F' },

  // Blue Shades
  { name: 'Light Blue', value: '#BAE6FD' },
  { name: 'Dark Blue', value: '#1E3A8A' },
  { name: 'Sky Blue', value: '#87CEEB' },
  { name: 'Navy', value: '#000080' },
  { name: 'Royal Blue', value: '#4169E1' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Azure', value: '#007FFF' },

  // Green Shades
  { name: 'Light Green', value: '#BBF7D0' },
  { name: 'Dark Green', value: '#14532D' },
  { name: 'Emerald', value: '#10B981' },
  { name: 'Lime', value: '#84CC16' },
  { name: 'Forest Green', value: '#228B22' },
  { name: 'Olive', value: '#808000' },
  { name: 'Mint', value: '#98FF98' },
  { name: 'Sea Green', value: '#2E8B57' },

  // Yellow & Orange Shades
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Gold', value: '#FFD700' },
  { name: 'Lemon', value: '#FFF700' },
  { name: 'Coral', value: '#FF7F50' },
  { name: 'Peach', value: '#FFDAB9' },
  { name: 'Copper', value: '#B87333' },
  { name: 'Bronze', value: '#CD7F32' },

  // Purple & Pink Shades
  { name: 'Violet', value: '#8B5CF6' },
  { name: 'Fuchsia', value: '#D946EF' },
  { name: 'Magenta', value: '#FF00FF' },
  { name: 'Lavender', value: '#E6E6FA' },
  { name: 'Plum', value: '#DDA0DD' },
  { name: 'Orchid', value: '#DA70D6' },
  { name: 'Hot Pink', value: '#FF69B4' },

  // Brown Shades
  { name: 'Brown', value: '#78350F' },
  { name: 'Chocolate', value: '#D2691E' },
  { name: 'Tan', value: '#D2B48C' },
  { name: 'Beige', value: '#F5F5DC' },
  { name: 'Khaki', value: '#F0E68C' },
  { name: 'Wheat', value: '#F5DEB3' },
  { name: 'Coffee', value: '#6F4E37' },
  { name: 'Burgundy', value: '#800020' },

  // Luxury / Leather / Metallic
  { name: 'Gold Metallic', value: '#D4AF37' },
  { name: 'Silver', value: '#C0C0C0' },
  { name: 'Platinum', value: '#E5E4E2' },
  { name: 'Champagne', value: '#F7E7CE' },
  { name: 'Jet Black', value: '#343434' },
  { name: 'Charcoal', value: '#36454F' },
  { name: 'Ivory', value: '#FFFFF0' },
  { name: 'Cream', value: '#FFFDD0' },
  { name: 'Camel', value: '#C19A6B' },
  { name: 'Cognac', value: '#9A463D' },
  { name: 'Terracotta', value: '#E2725B' },
  { name: 'Turquoise', value: '#40E0D0' },
  { name: 'Aqua', value: '#00FFFF' },
];

/**
 * Returns the hex color value for a given color name.
 * If the color name includes keywords like 'Light' or 'Dark', it tries to match them.
 * If no match is found, it returns the input string (assumes it might be a hex code).
 */
export const getColorValue = (colorName: string) => {
  if (!colorName) return '#CCCCCC';
  
  const normalizedSearch = colorName.toLowerCase().trim();
  
  // Exact match
  const exactMatch = colorPalettes.find(
    (c) => c.name.toLowerCase() === normalizedSearch
  );
  if (exactMatch) return exactMatch.value;

  // Partial match for shades if user provides strings like "Dark Blue" or "Light Red"
  const partialMatch = colorPalettes.find(
    (c) => normalizedSearch.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(normalizedSearch)
  );
  
  if (partialMatch) return partialMatch.value;

  // Fallback to basic color detection if the string is complex (e.g., "Deep Ocean Blue")
  if (normalizedSearch.includes('red')) return '#EF4444';
  if (normalizedSearch.includes('blue')) return '#3B82F6';
  if (normalizedSearch.includes('green')) return '#22C55E';
  if (normalizedSearch.includes('yellow')) return '#EAB308';
  if (normalizedSearch.includes('orange')) return '#F97316';
  if (normalizedSearch.includes('purple')) return '#A855F7';
  if (normalizedSearch.includes('pink')) return '#EC4899';
  if (normalizedSearch.includes('brown')) return '#78350F';
  if (normalizedSearch.includes('black')) return '#000000';
  if (normalizedSearch.includes('white')) return '#FFFFFF';
  if (normalizedSearch.includes('gold')) return '#FFD700';
  if (normalizedSearch.includes('silver')) return '#C0C0C0';
  if (normalizedSearch.includes('copper') || normalizedSearch.includes('bronze')) return '#CD7F32';

  return colorName; // Return as-is (might be hex)
};

export default colorPalettes;

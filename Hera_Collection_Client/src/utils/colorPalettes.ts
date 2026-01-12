const colorPalettes = [
  { name: 'Red', value: '#FF0000' },
  { name: 'Blue', value: '#0000FF' },
  { name: 'Green', value: '#00FF00' },
  { name: 'Yellow', value: '#FFFF00' },
  { name: 'Orange', value: '#FFA500' },
  { name: 'Purple', value: '#800080' },
  { name: 'Pink', value: '#FFC0CB' },
  { name: 'Brown', value: '#A52A2A' },
  { name: 'Black', value: '#000000' },
  { name: 'White', value: '#FFFFFF' },
  { name: 'Gray', value: '#808080' },
  { name: 'Cyan', value: '#00FFFF' },
  { name: 'Magenta', value: '#FF00FF' },
  { name: 'Lime', value: '#32CD32' },
  { name: 'Maroon', value: '#800000' },
  { name: 'Navy', value: '#000080' },
  { name: 'Olive', value: '#808000' },
  { name: 'Teal', value: '#008080' },
  { name: 'Silver', value: '#C0C0C0' },
  { name: 'Gold', value: '#FFD700' },
  { name: 'Coral', value: '#FF7F50' },
  { name: 'Turquoise', value: '#40E0D0' },
  { name: 'Indigo', value: '#4B0082' },
  { name: 'Beige', value: '#F5F5DC' },
  { name: 'Salmon', value: '#FA8072' },
  { name: 'Mint', value: '#98FF98' },
  { name: 'Lavender', value: '#E6E6FA' },
  { name: 'Plum', value: '#DDA0DD' },
  { name: 'Orchid', value: '#DA70D6' },
  { name: 'Chocolate', value: '#D2691E' },
  { name: 'Tomato', value: '#FF6347' },
  { name: 'Sky Blue', value: '#87CEEB' },
  { name: 'Sea Green', value: '#2E8B57' },
  { name: 'Royal Blue', value: '#4169E1' },
  { name: 'Crimson', value: '#DC143C' },
  { name: 'Khaki', value: '#F0E68C' },
  { name: 'Dark Green', value: '#006400' },
  { name: 'Dark Red', value: '#8B0000' },
  { name: 'Light Blue', value: '#ADD8E6' },
  { name: 'Slate Gray', value: '#708090' },
  { name: 'Peru', value: '#CD853F' },
  { name: 'Wheat', value: '#F5DEB3' },
  { name: 'Aqua', value: '#00FFFF' },
  { name: 'Azure', value: '#F0FFFF' },
  { name: 'Ivory', value: '#FFFFF0' },
  { name: 'Honeydew', value: '#F0FFF0' }
];

export const getColorValue = (colorName: string) => {
  const palette = colorPalettes.find(
    (c) => c.name.toLowerCase() === colorName.toLowerCase()
  );
  return palette ? palette.value : colorName;
};

export default colorPalettes;

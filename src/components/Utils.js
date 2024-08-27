export const removeDuplicates = (arr) => {
    const seen = new Set();
    return arr.filter((item) => {
      const duplicate = seen.has(item.id);
      seen.add(item.id);
      return !duplicate;
    });
  };
  
  export const generateUniqueId = () => {
    return `view-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };


  export const colorSchemes = [
    { bg: '#0B3D91', textColor: '#FFFFFF' }, // Deep Blue with white text
    { bg: '#BF360C', textColor: '#FFFFFF' }, // Rust with white text
    { bg: '#004D40', textColor: '#FFFFFF' }, // Dark Teal with white text
    { bg: '#4A235A', textColor: '#FFFFFF' }, // Deep Purple with white text
    { bg: '#1C2833', textColor: '#FFFFFF' }, // Charcoal with white text
    { bg: '#512E5F', textColor: '#FFFFFF' }, // Grape with white text
    { bg: '#1B2631', textColor: '#FFFFFF' }, // Midnight with white text
    { bg: '#283747', textColor: '#FFFFFF' }, // Steel with white text
    { bg: '#3D3D3D', textColor: '#FFFFFF' }, // Graphite with white text
    { bg: '#A93226', textColor: '#FFFFFF' }, // Dark Red with white text
    { bg: '#4D5656', textColor: '#FFFFFF' }, // Slate with white text
    { bg: '#873600', textColor: '#FFFFFF' }, // Dark Orange with white text
    { bg: '#0B5345', textColor: '#FFFFFF' }, // Dark Emerald with white text
    { bg: '#6E2C00', textColor: '#FFFFFF' }, // Burnt Umber with white text
    { bg: '#1B4F72', textColor: '#FFFFFF' }, // Dark Azure with white text
    { bg: '#4A235A', textColor: '#FFFFFF' }, // Royal Purple with white text
    { bg: '#512E5F', textColor: '#FFFFFF' }, // Dark Violet with white text
    { bg: '#154360', textColor: '#FFFFFF' }, // Navy Blue with white text
    { bg: '#4A235A', textColor: '#FFFFFF' }, // Deep Violet with white text
    { bg: '#1A5276', textColor: '#FFFFFF' }, // Ocean Blue with white text
    { bg: '#186A3B', textColor: '#FFFFFF' }, // Forest Green with white text
    { bg: '#4D5656', textColor: '#FFFFFF' }, // Granite with white text
    { bg: '#424949', textColor: '#FFFFFF' }, // Dark Grey with white text
    { bg: '#512E5F', textColor: '#FFFFFF' }, // Dark Indigo with white text
    { bg: '#1C2833', textColor: '#FFFFFF' }, // Deep Charcoal with white text
    { bg: '#873600', textColor: '#FFFFFF' }, // Mahogany with white text
    { bg: '#0E6251', textColor: '#FFFFFF' }, // Dark Teal with white text
    { bg: '#154360', textColor: '#FFFFFF' }, // Dark Sapphire with white text
    { bg: '#641E16', textColor: '#FFFFFF' }, // Maroon with white text
    { bg: '#1B2631', textColor: '#FFFFFF' }, // Black Pearl with white text
];

  

  
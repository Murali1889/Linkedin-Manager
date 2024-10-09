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
    { bg: 'rgba(11, 61, 145, 0.1)', textColor: '#0B3D91' }, // Deep Blue with white text
    { bg: 'rgba(191, 54, 12, 0.1)', textColor: '#BF360C' }, // Rust with white text
    { bg: 'rgba(0, 77, 64, 0.1)', textColor: '#004D40' }, // Dark Teal with white text
    { bg: 'rgba(74, 35, 90, 0.1)', textColor: '#4A235A' }, // Deep Purple with white text
    { bg: 'rgba(28, 40, 51, 0.1)', textColor: '#1C2833' }, // Charcoal with white text
    { bg: 'rgba(81, 46, 95, 0.1)', textColor: '#512E5F' }, // Grape with white text
    { bg: 'rgba(27, 38, 49, 0.1)', textColor: '#1B2631' }, // Midnight with white text
    { bg: 'rgba(40, 55, 71, 0.1)', textColor: '#283747' }, // Steel with white text
    { bg: 'rgba(61, 61, 61, 0.1)', textColor: '#3D3D3D' }, // Graphite with white text
    { bg: 'rgba(169, 50, 38, 0.1)', textColor: '#A93226' }, // Dark Red with white text
    { bg: 'rgba(77, 86, 86, 0.1)', textColor: '#4D5656' }, // Slate with white text
    { bg: 'rgba(135, 54, 0, 0.1)', textColor: '#873600' }, // Dark Orange with white text
    { bg: 'rgba(11, 83, 69, 0.1)', textColor: '#0B5345' }, // Dark Emerald with white text
    { bg: 'rgba(110, 44, 0, 0.1)', textColor: '#6E2C00' }, // Burnt Umber with white text
    { bg: 'rgba(27, 79, 114, 0.1)', textColor: '#1B4F72' }, // Dark Azure with white text
    { bg: 'rgba(74, 35, 90, 0.1)', textColor: '#4A235A' }, // Royal Purple with white text
    { bg: 'rgba(81, 46, 95, 0.1)', textColor: '#512E5F' }, // Dark Violet with white text
    { bg: 'rgba(21, 67, 96, 0.1)', textColor: '#154360' }, // Navy Blue with white text
    { bg: 'rgba(74, 35, 90, 0.1)', textColor: '#4A235A' }, // Deep Violet with white text
    { bg: 'rgba(26, 82, 118, 0.1)', textColor: '#1A5276' }, // Ocean Blue with white text
    { bg: 'rgba(24, 106, 59, 0.1)', textColor: '#186A3B' }, // Forest Green with white text
    { bg: 'rgba(77, 86, 86, 0.1)', textColor: '#4D5656' }, // Granite with white text
    { bg: 'rgba(66, 73, 73, 0.1)', textColor: '#424949' }, // Dark Grey with white text
    { bg: 'rgba(81, 46, 95, 0.1)', textColor: '#512E5F' }, // Dark Indigo with white text
    { bg: 'rgba(28, 40, 51, 0.1)', textColor: '#1C2833' }, // Deep Charcoal with white text
    { bg: 'rgba(135, 54, 0, 0.1)', textColor: '#873600' }, // Mahogany with white text
    { bg: 'rgba(14, 98, 81, 0.1)', textColor: '#0E6251' }, // Dark Teal with white text
    { bg: 'rgba(21, 67, 96, 0.1)', textColor: '#154360' }, // Dark Sapphire with white text
    { bg: 'rgba(100, 30, 22, 0.1)', textColor: '#641E16' }, // Maroon with white text
    { bg: 'rgba(27, 38, 49, 0.1)', textColor: '#1B2631' }  // Black Pearl with white text
  ];
  

  

  
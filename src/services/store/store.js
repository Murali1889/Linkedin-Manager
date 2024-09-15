import { configureStore } from '@reduxjs/toolkit';
import sheetsReducer from './sheetsSlice'; // Import the sheets slice
import profilesReducer from './profileSlice'; // Import the profiles slice
import labelsReducer from './labelSlice'; // Import the labels slice
import shortcutsReducer from './shortcutSlice'; // Import the shortcuts slice

const store = configureStore({
  reducer: {
    sheets: sheetsReducer, // Register the sheets reducer
    profiles: profilesReducer, // Register the profiles reducer
    labels: labelsReducer, // Register the labels reducer
    shortcuts: shortcutsReducer, // Register the shortcuts reducer
  },
});

export default store;
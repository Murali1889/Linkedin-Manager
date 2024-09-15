// shortcutsSlice.js
import { createSlice } from '@reduxjs/toolkit';
import { database } from "./firebaseConfig";
import { ref, onValue } from "firebase/database";

// Initial state
const initialState = {
  shortcuts: {},
  loading: false,
  error: null
};

// Create the slice
const shortcutsSlice = createSlice({
  name: 'shortcuts',
  initialState,
  reducers: {
    setShortcuts: (state, action) => {
      state.shortcuts = action.payload;
      state.loading = false;
    },
    setLoading: (state) => {
      state.loading = true;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    }
  }
});

// Export actions
export const { setShortcuts, setLoading, setError } = shortcutsSlice.actions;

// Thunk to fetch shortcuts from Firebase
export const fetchShortcuts = () => (dispatch) => {
  dispatch(setLoading());
  const sheetsRef = ref(database, 'shortcuts');
  
  onValue(
    sheetsRef,
    (snapshot) => {
      const data = snapshot.val();
      if (data) {
        dispatch(setShortcuts(data));
        console.log("Sheets data loaded and real-time update:", data);
      } else {
        console.log("No sheets data available");
      }
    },
    (error) => {
      dispatch(setError("Error fetching sheets data: " + error.message));
      console.error("Error fetching sheets data: ", error);
    }
  );
};

// Export the reducer
export default shortcutsSlice.reducer;
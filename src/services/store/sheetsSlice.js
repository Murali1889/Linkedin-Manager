// sheetsSlice.js
import { createSlice } from '@reduxjs/toolkit';
import { ref, onValue } from 'firebase/database';
import { database } from './firebaseConfig'; // Adjust based on your project structure

// Initial state
const initialState = {
  sheets: {},
  sheetData: [],
  loading: false,
  error: null,
};

// Create the slice
const sheetsSlice = createSlice({
  name: 'sheets',
  initialState,
  reducers: {
    setSheets: (state, action) => {
      state.sheets = action.payload.sheets;
      state.sheetData = action.payload.sheetData;
      state.loading = false;
    },
    setLoading: (state) => {
      state.loading = true;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

// Export actions
export const { setSheets, setLoading, setError } = sheetsSlice.actions;

// Thunk to fetch sheets data from Firebase
export const fetchSheets = () => (dispatch) => {
  dispatch(setLoading());

  const sheetsRef = ref(database, 'sheets');
  onValue(
    sheetsRef,
    (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const sheetsArray = Object.keys(data).map((sheetId) => ({
          id: sheetId,
          name: data[sheetId].name ? data[sheetId].name.replace(/\n/g, '') : '',
        }));

        dispatch(setSheets({ sheets: data, sheetData: sheetsArray }));
      } else {
        dispatch(setSheets({ sheets: {}, sheetData: [] }));
      }
    },
    (error) => {
      dispatch(setError('Error fetching sheets data.'));
    }
  );
};

// Export the reducer
export default sheetsSlice.reducer;
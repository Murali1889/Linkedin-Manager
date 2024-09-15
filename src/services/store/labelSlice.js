// labelsSlice.js
import { createSlice } from '@reduxjs/toolkit';
import { ref, onValue, get, update } from 'firebase/database';
import { database } from './firebaseConfig'; 

// Initial state
const initialState = {
  labels: [],
  headerLabels: [],
  loading: false,
  error: null,
};

// Create the slice
const labelsSlice = createSlice({
  name: 'labels',
  initialState,
  reducers: {
    setLabels: (state, action) => {
      state.labels = action.payload.labels;
      state.headerLabels = action.payload.headerLabels;
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
export const { setLabels, setLoading, setError } = labelsSlice.actions;

// Thunk to fetch labels from Firebase
export const fetchLabels = () => (dispatch) => {
  dispatch(setLoading());

  const labelsRef = ref(database, 'labels');

  onValue(
    labelsRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const codeMap = {};
        const headerLabelsMap = new Map();

        Object.keys(data).forEach((labelName) => {
          const color = data[labelName].color;
          const codes = data[labelName].codes ? Object.values(data[labelName].codes) : [];

          codes.forEach((item) => {
            const { code, name } = item;

            if (!codeMap[code]) {
              codeMap[code] = { code, labels: [], codeName: name };
            }

            if (!codeMap[code].labels.some((label) => label.name === labelName && label.color === color)) {
              codeMap[code].labels.push({ name: labelName, color });
            }
          });

          if (!headerLabelsMap.has(labelName)) {
            headerLabelsMap.set(labelName, { name: labelName, color });
          }
        });

        const formattedLabels = Object.values(codeMap);
        const formattedHeaderLabels = Array.from(headerLabelsMap.values());

        dispatch(setLabels({ labels: formattedLabels, headerLabels: formattedHeaderLabels }));
      } else {
        dispatch(setLabels({ labels: [], headerLabels: [] }));
      }
    },
    (error) => {
      dispatch(setError('Failed to fetch labels. Please try again later.'));
    }
  );
};

// Thunk to remove a label
export const removeLabel = (labelName, code, name) => async (dispatch) => {
  const labelRef = ref(database, `labels/${labelName}/codes`);

  try {
    const snapshot = await get(labelRef);

    if (snapshot.exists()) {
      const codes = snapshot.val();
      const codeKey = Object.keys(codes).find((key) => codes[key].code === code && codes[key].name === name);

      if (codeKey) {
        const updates = {};
        updates[`labels/${labelName}/codes/${codeKey}`] = null;

        await update(ref(database), updates);

        console.log(`Removed code ${code} from label ${labelName}`);
      } else {
        console.log(`Code ${code} not found in label ${labelName}`);
      }
    } else {
      console.log(`Label ${labelName} does not exist.`);
    }
  } catch (error) {
    console.error('Error removing label:', error);
  }
};

// Export the reducer
export default labelsSlice.reducer;
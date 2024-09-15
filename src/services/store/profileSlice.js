// profilesSlice.js
import { createSlice } from '@reduxjs/toolkit';
import { ref, onValue } from 'firebase/database';
import { database } from './firebaseConfig'; // Adjust based on your project structure
import { colorSchemes } from '../components/Utils'; // Adjust the path if needed

// Initial state
const initialState = {
  profiles: {},
  checkedItems: [],
  selectedProfiles: [],
  loading: false,
  error: null,
};

// Create the slice
const profilesSlice = createSlice({
  name: 'profiles',
  initialState,
  reducers: {
    setProfiles: (state, action) => {
      state.profiles = action.payload.profiles;
      state.selectedProfiles = action.payload.selectedProfiles;
      state.loading = false;
    },
    setCheckedItems: (state, action) => {
      state.checkedItems = action.payload;
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
export const { setProfiles, setCheckedItems, setLoading, setError } = profilesSlice.actions;

// Thunk to fetch profiles from Firebase
export const fetchProfiles = () => (dispatch) => {
  dispatch(setLoading());

  const profilesRef = ref(database, 'roles');
  onValue(
    profilesRef,
    (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const allRoles = Object.keys(data);
        const selectedNames = [];

        allRoles.forEach((roleName, index) => {
          const roleDataItem = data[roleName];
          if (Array.isArray(roleDataItem.profiles)) {
            roleDataItem.profiles.forEach((profile) => {
              selectedNames.push({
                name: profile.name ? profile.name.replace(/\n/g, '') : '',
                role: roleDataItem.role ? roleDataItem.role.replace(/\n/g, '') : '',
                bg: colorSchemes[index]?.bg || '#ffffff',
                textColor: colorSchemes[index]?.textColor || '#000000',
                profile_url: profile.profile_url ? profile.profile_url.replace(/\n/g, '') : '',
                username: profile.username ? profile.username.replace(/\n/g, '') : '',
                profile_pic_url: profile.profile_pic_url ? profile.profile_pic_url.replace(/\n/g, '') : '',
                id: profile.id ? profile.id.replace(/\n/g, '') : '',
                code: profile.code ? profile.code.replace(/\n/g, '') : '',
                roleId: roleDataItem.id,
              });
            });
          }
        });

        dispatch(setProfiles({ profiles: data, selectedProfiles: selectedNames }));
      } else {
        dispatch(setProfiles({ profiles: {}, selectedProfiles: [] }));
      }
    },
    (error) => {
      dispatch(setError('Error fetching profiles.'));
    }
  );
};

// Export the reducer
export default profilesSlice.reducer;
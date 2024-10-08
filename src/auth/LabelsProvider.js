import { createContext, useContext, useState, useEffect } from 'react';
import { ref, onValue, get, update } from 'firebase/database'; // Import required Firebase functions
import { database } from './firebaseConfig'; // Ensure the correct path to your Firebase config

// Create context
const LabelsContext = createContext();

// Custom hook to use the Labels context
export const useLabels = () => useContext(LabelsContext);

// Labels Provider component
export const LabelsProvider = ({ children }) => {
  const [labels, setLabels] = useState([]);
  const [headerLabels, setHeaderLabels] = useState([]); // State for header labels
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  console.log(headerLabels);

  // Function to fetch labels with real-time updates
  useEffect(() => {
    // Reference to the 'labels' node in the database
    const labelsRef = ref(database, 'labels');

    // Listen for changes in the labels data
    const unsubscribe = onValue(
      labelsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const codeMap = {};
          const headerLabelsMap = new Map(); // Use Map to ensure unique names

          // Combine names and colors for codes found in multiple labels
          Object.keys(data).forEach((labelName) => {
            const color = data[labelName].color;
            const codes = data[labelName].codes ? Object.values(data[labelName].codes) : [];

            codes.forEach((item) => {
              const { code, name } = item; // Destructure code and name from each item

              if (!codeMap[code]) {
                // Initialize a new entry for this code
                codeMap[code] = { code, labels: [], codeName: name };
              }

              // Add the current label (name and color) to the labels array, avoiding duplicates
              if (!codeMap[code].labels.some((label) => label.name === labelName && label.color === color)) {
                codeMap[code].labels.push({ name: labelName, color });

                // Check if the header label name is already in the map; add only if it's unique
              }
            });
            if (!headerLabelsMap.has(labelName)) {
              headerLabelsMap.set(labelName, { name: labelName, color });
            }
          });

          // Convert the codeMap back to an array format for state
          const formattedLabels = Object.values(codeMap);

          // Convert headerLabelsMap back to an array format
          const formattedHeaderLabels = Array.from(headerLabelsMap.values());

          console.log(formattedLabels);
          setLabels(formattedLabels);
          setHeaderLabels(formattedHeaderLabels);
        } else {
          console.log('No labels found');
          setLabels([]);
          setHeaderLabels([]);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching labels:', error);
        setError('Failed to fetch labels. Please try again later.');
        setLoading(false);
      }
    );

    // Cleanup listener on component unmount
    return () => unsubscribe();
  }, []);

  // Function to handle label removal
  useEffect(() => {
    window.electron.onRemoveLable(async (data) => {
      const { labelName, code, name } = data;

      // Reference to the specific label in the database
      const labelRef = ref(database, `labels/${labelName}/codes`);
      
      try {
        // Fetch the current data of the label to check if the code exists
        const snapshot = await get(labelRef);

        if (snapshot.exists()) {
          const codes = snapshot.val();
          const codeKey = Object.keys(codes).find(
            (key) => codes[key].code === code && codes[key].name === name
          );

          if (codeKey) {
            // If the label exists, remove the specific code
            const updates = {};
            updates[`labels/${labelName}/codes/${codeKey}`] = null;

            await update(ref(database), updates);

            console.log(`Removed code ${code} from label ${labelName}`);
          } else {
            console.log(`Code ${code} not found in label ${labelName}`);
          }
        } else {
          console.log(`Label ${labelName} does not exist in the database.`);
        }
      } catch (error) {
        console.error('Error removing label:', error);
      }
    });
  }, []);

  return (
    <LabelsContext.Provider value={{ labels, headerLabels, loading, error }}>
      {children}
    </LabelsContext.Provider>
  );
};
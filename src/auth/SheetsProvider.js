import { createContext, useState, useEffect } from 'react';
import { database } from "./firebaseConfig";
import { ref, onValue } from "firebase/database";

// Create a context
export const SheetsContext = createContext();

// Create a provider component
export const SheetsProvider = ({ children }) => {
  const [sheets, setSheets] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sheetData, setSheetData] = useState([]);

  useEffect(() => {
    setLoading(true);
    const sheetsRef = ref(database, 'sheets');
    const unsubscribe = onValue(
      sheetsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setSheets(data);
          console.log("Sheets data loaded and real-time update:", data);
          const sheetsArray = Object.keys(data).map((sheetId) => ({
            id: sheetId,
            name: data[sheetId].name ? data[sheetId].name.replace(/\n/g, "") : "",
          }));

          console.log(sheetsArray);
          setSheetData(sheetsArray);
        } else {
          console.log("No sheets data available");
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching sheets data: ", error);
        setError("Error fetching sheets data.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <SheetsContext.Provider value={{ sheets, sheetData, loading, error }}>
      {children}
    </SheetsContext.Provider>
  );
};

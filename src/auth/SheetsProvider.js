import { createContext, useState, useEffect, useContext } from 'react';
import { database } from "./firebaseConfig";
import { ref, onValue } from "firebase/database";

// Create a context
export const SheetsContext = createContext();

// Custom hook to use SheetsContext
export const useSheets = () => {
  const context = useContext(SheetsContext);
  if (!context) {
    throw new Error("useSheets must be used within a SheetsProvider");
  }
  return context;
};

// Create a provider component
export const SheetsProvider = ({ children }) => {
  const [sheets, setSheets] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSheets, setSelectedSheets] = useState([])
  const [sheetData, setSheetData] = useState([]);
  const [activeSheet, setActiveSheet] = useState(null); // To manage the active sheet

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
            url: `https://docs.google.com/spreadsheets/d/${sheetId}/edit`, // Assuming URL format
          }));

          console.log(sheetsArray);
          setSheetData(sheetsArray);
          // Set the first sheet as active if none is active yet
          if (!activeSheet && sheetsArray.length > 0) {
            setActiveSheet(sheetsArray[0]);
          }
        } else {
          console.log("No sheets data available");
          setSheetData([]); // Clear sheet data when no data is available
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
  }, [activeSheet]);

  // Function to switch the active sheet by ID
  const switchSheet = (sheetId) => {
    const sheet = sheetData.find((s) => s.id === sheetId);
    if (sheet) {
      setActiveSheet(sheet);
    } else {
      console.warn(`Sheet with ID ${sheetId} not found.`);
    }
  };

  // Function to set the sheet name and URL when navigating
  const setSheetName = (id, name, url) => {
    const updatedSheets = sheetData.map(sheet =>
      sheet.id === id ? { ...sheet, name: name || sheet.name, url } : sheet
    );
    setSheetData(updatedSheets);
  };

  return (
    <SheetsContext.Provider
      value={{ sheets, sheetData, loading, error, activeSheet, switchSheet, setSheetName, selectedSheets, setSelectedSheets }}
    >
      {children}
    </SheetsContext.Provider>
  );
};

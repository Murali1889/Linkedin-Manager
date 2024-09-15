import { createContext, useState, useContext, useEffect } from 'react';
import { database } from "./firebaseConfig";
import { ref, onValue } from "firebase/database";

// Create a context
export const ShortcutContext = createContext();

export const useShortcuts = () => useContext(ShortcutContext);

// Create a provider component
export const ShortcutProvider = ({ children }) => {
const [shortcuts, setShortcuts] = useState({})
console.log(shortcuts)

  useEffect(() => {
    // setLoading(true);
    const sheetsRef = ref(database, 'shortcuts');
    const unsubscribe = onValue(
      sheetsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          console.log("Sheets data loaded and real-time update:", data);
        } else {
          console.log("No sheets data available");
        }
        setShortcuts(data)
        // setLoading(false);
      },
      (error) => {
        console.error("Error fetching sheets data: ", error);
        // setError("Error fetching sheets data.");
        // setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <ShortcutContext.Provider value={shortcuts}>
      {children}
    </ShortcutContext.Provider>
  );
};

// ShortcutProvider.js
import { createContext, useState, useContext, useEffect } from 'react';
import { database } from "./firebaseConfig";
import { ref, onValue, remove, set, update } from "firebase/database";

// Create a context
export const ShortcutContext = createContext(null); // Ensure default value is set to null

export const useShortcuts = () => {
  const context = useContext(ShortcutContext);

  // Add a check to handle undefined context
  if (!context) {
    throw new Error("useShortcuts must be used within a ShortcutProvider");
  }

  return context;
};

// Create a provider component
export const ShortcutProvider = ({ children }) => {
  const [shortcuts, setShortcuts] = useState([]);
  const [isOpenListDialog, setIsOpenListDialog] = useState(false);
  

  // Fetch shortcuts from Firebase on component mount
  useEffect(() => {
    const sheetsRef = ref(database, 'shortcuts');
    const unsubscribe = onValue(
      sheetsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          // Convert data from Firebase to an array format with ids
          const shortcutsArray = Object.entries(data).map(([id, value]) => ({
            id,
            ...value,
          }));
          setShortcuts(shortcutsArray);
        } else {
          setShortcuts([]);
        }
      },
      (error) => {
        console.error("Error fetching sheets data: ", error);
      }
    );

    return () => unsubscribe();
  }, []);

  // Generate a unique ID for new commands
  const generateId = () => `command-${Date.now()}`;

  // Add a new command to Firebase
  const addCommand = (title, content) => {
    const id = generateId();
    const newCommand = { title, content };
    const newCommandRef = ref(database, `shortcuts/${id}`);
    set(newCommandRef, newCommand)
      .then(() => {
        console.log("Command added successfully:", newCommand);
      })
      .catch((error) => {
        console.error("Error adding command:", error);
      });
  };


  const editCommand = (id, newTitle, newContent) => {
    const commandRef = ref(database, `shortcuts/${id}`);
    update(commandRef, { title: newTitle, content: newContent })
      .then(() => {
        console.log("Command updated successfully:", { id, title: newTitle, content: newContent });
      })
      .catch((error) => {
        console.error("Error updating command:", error);
      });
  };

  // Delete a command from Firebase based on the ID
  const deleteCommand = (id) => {
    const commandRef = ref(database, `shortcuts/${id}`);
    remove(commandRef)
      .then(() => {
        console.log("Command deleted successfully:", id);
      })
      .catch((error) => {
        console.error("Error deleting command:", error);
      });
  };

  return (
    <ShortcutContext.Provider value={{ shortcuts, addCommand, editCommand, deleteCommand, isOpenListDialog, setIsOpenListDialog }}>
      {children}
    </ShortcutContext.Provider>
  );
};

import { createContext, useState, useEffect } from 'react';
import { database } from "./firebaseConfig";
import { ref, onValue } from "firebase/database";
import { colorSchemes } from '../components/Utils';

// Create a context
export const ProfileContext = createContext();

// Create a provider component
export const ProfileProvider = ({ children }) => {
  const [profiles, setProfiles] = useState({});
  const [checkedItems, setCheckedItems] = useState([]);
  const [selectedProfiles, setSelectedProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    setLoading(true);
    const profilesRef = ref(database, 'roles');
    const unsubscribe = onValue(profilesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setProfiles(data);
        console.log("Data loaded and real-time update:", data);

        // Automatically select all roles when data is loaded
        const allRoles = Object.keys(data);
        setCheckedItems(allRoles);

        // Set the initial selected profiles based on all roles
        const selectedNames = [];
        allRoles.forEach((checkedItem) => {
          const roleDataItem = data[checkedItem];
          const index = allRoles.indexOf(checkedItem);
          if (Array.isArray(roleDataItem.profiles)) {
            roleDataItem.profiles.forEach((profile) => {
              selectedNames.push({
                name: profile.name ? profile.name.replace(/\n/g, "") : "",
                role: roleDataItem.role ? roleDataItem.role.replace(/\n/g, "") : "",
                bg: colorSchemes[index]?.bg || "#ffffff",
                textColor: colorSchemes[index]?.textColor || "#000000",
                profile_url: profile.profile_url ? profile.profile_url.replace(/\n/g, "") : "",
                username: profile.username ? profile.username.replace(/\n/g, "") : "",
                profile_pic_url: profile.profile_pic_url ? profile.profile_pic_url.replace(/\n/g, "") : "",
                id: profile.id ? profile.id.replace(/\n/g, "") : "",
                code: profile.code ? profile.code.replace(/\n/g, "") : "",
                roleId: roleDataItem.id,
              });
            });
          }
        });
        setSelectedProfiles(selectedNames);
      } else {
        console.log("No data available");
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching data: ", error);
      setError("Error fetching data.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <ProfileContext.Provider value={{ profiles, checkedItems, setCheckedItems, selectedProfiles, loading }}>
      {children}
    </ProfileContext.Provider>
  );
};

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
  
 console.log(selectedProfiles)
 console.log(error)
  useEffect(() => {
    setLoading(true);
    const profilesRef = ref(database, 'roles');
    const unsubscribe = onValue(profilesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setProfiles(data);
        console.log("Data loaded and real-time update:", data);
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

  useEffect(() => {
    if (Object.keys(profiles).length > 0) {
      const selectedNames = [];
      checkedItems.forEach((checkedItem) => {
        if (profiles[checkedItem]) {
          const roleDataItem = profiles[checkedItem];
          const index = Object.keys(profiles).indexOf(checkedItem);
          console.log(roleDataItem.profiles)
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
                code: profile.code ? profile.code.replace(/\n/g, "") : ""
              });
            });
          }
        }
      });
      console.log(selectedNames)
      setSelectedProfiles(selectedNames);
    }
  }, [checkedItems, profiles]);
  

  return (
    <ProfileContext.Provider value={{ profiles, checkedItems, setCheckedItems, selectedProfiles, loading }}>
      {children}
    </ProfileContext.Provider>
  );
};

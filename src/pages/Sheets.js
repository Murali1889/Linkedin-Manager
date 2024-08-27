import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Typography } from "@mui/material";

import { database } from "../auth/firebaseConfig";
import { ref, get, onValue } from "firebase/database";
const Sheets = ({ setRoleData }) => {
  const [rolesLoading, setRolesLoading] = useState(false);
  const [error, setError] = useState(null);


  const getFirebasedata = async ()=>{
    setRolesLoading(true)
    try {
        const dbRef = ref(database, 'roles');
        const snapshot = await get(dbRef);
        console.log(snapshot)
        if (snapshot.exists()) {
          console.log(snapshot.val())
        } else {
          console.log("No data available");
        }
      } catch (error) {
        console.error("Error fetching data: ", error);
      }
    setRolesLoading(false)
  }
  useEffect(() => {
    const profilesRef = ref(database, 'roles');
    const unsubscribe = onValue(profilesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        console.log(data)
      } 
    });
    return () => unsubscribe();
  }, []);
  return (
    <div>
      <div style={{ marginTop: "10px" }}>
        <Button
          variant="default"
          size="default"
          fullWidth
          onClick={getFirebasedata}
          disabled={rolesLoading}
        >
          Load Roles
        </Button>
      </div>
      {error && <Typography color="error">{error}</Typography>}
    </div>
  );
};

export default Sheets;

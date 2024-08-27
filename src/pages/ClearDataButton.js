import React from 'react';
import { Button } from '@mui/material';

const ClearDataButton = () => {
  const handleClearData = async () => {
    const result = await window.electron.invoke('clear-app-data');
    if (result.success) {
      console.log('App data cleared successfully');
    } else {
      console.error('Failed to clear app data:', result.error);
    }
  };

  return (
    <Button variant="contained" color="secondary" onClick={handleClearData}>
      Clear App Data
    </Button>
  );
};

export default ClearDataButton;

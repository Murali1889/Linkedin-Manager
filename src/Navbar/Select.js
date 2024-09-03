import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import LinkedInIcon from '@mui/icons-material/LinkedIn'; // LinkedIn Icon
import DescriptionIcon from '@mui/icons-material/Description'; // Google Sheets Icon
import { useAccounts } from '../Linkedin/AccountsProvider';

const Select = () => {
  const { setSwitchNav, switchNav } = useAccounts();

  const handleNavClick = (value)=>{
    setSwitchNav(value)
  }

  return (
    <div className="space-y-4 w-[80%] flex flex-col gap-[5px] mx-auto mt-auto mb-0">
      <Button
        variant="outline"
        className={`flex items-center space-x-2 w-full ${
          switchNav === 'linkedin' ? 'bg-blue-100' : 'bg-white'
        }`} 
        onClick={() => handleNavClick('linkedin')} 
      >
        <LinkedInIcon style={{ color: '#0A66C2' }} className="w-5 h-5" />
        <span>LinkedIn</span>
      </Button>
      <Button
        variant="outline"
        className={`flex items-center space-x-2 w-full ${
          switchNav === 'sheets' ? 'bg-blue-100' : 'bg-white'
        }`} 
        onClick={() => handleNavClick('sheets')} 
      >
        <DescriptionIcon style={{ color: '#34A853' }} className="w-5 h-5" /> 
        <span>Sheets</span>
      </Button>
    </div>
  );
};

export default Select;
// App.jsx
import React, { useContext } from 'react';
import { NavbarProvider, NavbarContext } from './Navbar/NavProvider';
import Navbar from './Navbar/Index'; // Your Navbar Component
import LinkedinManager from './Linkedin/LinkedinWebviews'; // Import your components
import GoogleSheets from './Sheets/GoogleSheets';

const AppContent = () => {
  const { activeTab } = useContext(NavbarContext);

  // Extract the header and item from activeTab
  const { header, item } = activeTab || {};

  return (
    <div className="relative h-full w-full">
      <div
        className={`absolute w-full h-full transition-all duration-300 ease-in-out`}
        style={{ zIndex: 30 }}
      >
        <LinkedinManager  />
        <GoogleSheets/>
      </div>
    </div>
  );
};

const Main = () => {
  return (
    <NavbarProvider>
      <Navbar /> 
      <AppContent />
    </NavbarProvider>
  );
};

export default Main;
// App.jsx
import React, { useContext } from 'react';
import { NavbarProvider, NavbarContext } from './Navbar/NavProvider';
import Navbar from './Navbar/Index'; // Your Navbar Component
import LinkedinManager from './Linkedin/LinkedinWebviews'; // Import your components
import GoogleSheets from './Sheets/GoogleSheets';
import AddLabel from './Labels/AddLabel';
const AppContent = () => {
  const { activeTab } = useContext(NavbarContext);
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
      <AddLabel/>
    </NavbarProvider>
  );
};

export default Main;
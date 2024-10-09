// App.jsx
import React, { useContext, useState } from 'react';
import { NavbarProvider, NavbarContext } from './Navbar/NavProvider';
import Navbar from './Navbar/Index'; // Your Navbar Component
import LinkedinManager from './Linkedin/LinkedinWebviews'; // Import your components
import GoogleSheets from './Sheets/GoogleSheets';
// import Data from './Data';
import Select from './Navbar/Select'
import AddLabel from './Labels/AddLabel';
import LinkedinProfileView from './Linkedin/LinkedinProfileView';
import { AnimatePresence } from 'framer-motion';
const AppContent = () => {
  const { activeTab } = useContext(NavbarContext);

  const { header, item } = activeTab || {};


  return (
    <div className="relative h-full w-full">
      <div
        className={`absolute w-full h-full transition-all duration-300 ease-in-out`}
        style={{ zIndex: 30 }}
      >
        <LinkedinManager />
        <GoogleSheets />
        <AnimatePresence>
          <LinkedinProfileView />

        </AnimatePresence>
      </div>
    </div>
  );
};

const Main = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  return (
    <NavbarProvider>
      <div className="w-full"> <Select setIsExpanded={setIsExpanded} isExpanded={isExpanded} /></div>
      <div className="flex w-full h-full">
        <Navbar setIsExpanded={setIsExpanded} isExpanded={isExpanded} />
        <AppContent />
      </div>
      <AddLabel />
    </NavbarProvider>
  );
};

export default Main;
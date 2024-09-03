// ContextProvider.jsx
import React, { createContext, useState, useEffect } from 'react';

export const NavbarContext = createContext();

export const NavbarProvider = ({ children }) => {
  const [expanded, setExpanded] = useState(true);
  const [dropdownData, setDropdownData] = useState({
    "Linkedin Manager": [],
    "Google Sheets": [],
    "Google Docs": [],
    "Google Forms": [],
  });

  const [tabs, setTabs] = useState([]); // State to manage all tabs
  const [activeTab, setActiveTab] = useState({}); // State to store the active tab for each component

  // Load data from Electron on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await window.electron.loadData(); // Call to load data from main process
        if (data) {
          // Update state based on loaded data
          setDropdownData(data.dropdownData || {});
          setTabs(data.tabs || []);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  const toggleExpand = () => setExpanded(!expanded);

  const addNewItem = (header) => {
    // Initialize the header in dropdownData if it doesn't exist
    if (!dropdownData[header]) {
      setDropdownData((prevData) => ({
        ...prevData,
        [header]: [],
      }));
    }

    const newItem = {
      id: `${header}-${Date.now()}`, // Unique ID based on timestamp
      name: header === 'Linkedin Manager' ? `Account ${dropdownData[header]?.length + 1 || 1}` : `Tab ${dropdownData[header]?.length + 1 || 1}`,
      url: getUrlByHeader(header), // Helper function to get the URL based on the header
    };

    // Add the new item to the specific dropdown category and overall tabs list
    setDropdownData((prevData) => {
      const newData = { ...prevData };
      // Ensure the header exists as an array
      if (!newData[header]) {
        newData[header] = [];
      }
      newData[header].push(newItem);
      saveDataToElectron(newData, [...tabs, newItem]); // Save updated data to accounts.json
      return newData;
    });

    setTabs((prevTabs) => {
      const updatedTabs = [...prevTabs, newItem];
      saveDataToElectron(dropdownData, updatedTabs); // Save updated data to accounts.json
      return updatedTabs;
    });
  };

  // Helper function to get the URL based on the header
  const getUrlByHeader = (header) => {
    switch (header) {
      case 'Google Sheets':
        return 'https://docs.google.com/spreadsheets/u/0/';
      case 'Google Docs':
        return 'https://docs.google.com/document/u/0/';
      case 'Google Forms':
        return 'https://docs.google.com/forms/u/0/';
      case 'Linkedin Manager':
        return 'https://www.linkedin.com/messaging/';
      default:
        return '';
    }
  };

  // Function to save data to Electron (accounts.json)
  const saveDataToElectron = (dropdownData, tabs) => {
    try {
      window.electron.saveData({ dropdownData, tabs });
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const setActive = (header, item) => {
    console.log(`Activating the tab with header ${header} and value`, item);
    setActiveTab({ header, item });
  };

  return (
    <NavbarContext.Provider
      value={{
        expanded,
        toggleExpand,
        dropdownData,
        addNewItem,
        setActiveTab: setActive,
        activeTab,
        tabs, // Provide tabs state to be used across components
      }}
    >
      {children}
    </NavbarContext.Provider>
  );
};

export default NavbarProvider;
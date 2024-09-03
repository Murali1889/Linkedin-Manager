// SheetsProvider.js
import React, { createContext, useContext, useState, useEffect } from 'react';

// Create context
const SheetsContext = createContext();

// Custom hook to use the Sheets context
export const useSheets = () => useContext(SheetsContext);

// Sheets Provider component
export const SheetsProvider = ({ children }) => {
  const [accounts, setAccounts] = useState([]);
  const [activeAccount, setActiveAccount] = useState(null);

  // Fetch accounts from the main process
  const fetchAccounts = async () => {
    try {
      const savedAccounts = await window.electron.getSheetAccounts();
      setAccounts(savedAccounts);
      setActiveAccount(savedAccounts[0] || null); // Set the first account as active if available
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    }
  };

  // Add a new account with the home page of Google Sheets
  const addAccount = async () => {
    const newAccount = {
      id: `account-${Date.now()}`,
      name: `Sheet ${accounts.length + 1}`,
      url: 'https://docs.google.com/spreadsheets/', // Home page URL
    };
    const updatedAccounts = [...accounts, newAccount];
    setAccounts(updatedAccounts);
    setActiveAccount(newAccount);
    console.log('addaccount set')
    await window.electron.saveSheetsAccounts(updatedAccounts);
  };

  // Delete an account
  const deleteAccount = async (id) => {
    const updatedAccounts = accounts.filter((account) => account.id !== id);
    setAccounts(updatedAccounts);
    if (activeAccount?.id === id) {
      setActiveAccount(updatedAccounts.length > 0 ? updatedAccounts[0] : null);
    }
    console.log('delete sehet set')
    await window.electron.saveSheetsAccounts(updatedAccounts);
  };

  // Switch to a specific account
  const switchAccount = (id) => {
    const selectedAccount = accounts.find((account) => account.id === id);
    setActiveAccount(selectedAccount);
  };



  // Set sheet name and update the corresponding account
  const setSheetName = async (id, name, url) => {
    const updatedAccounts = accounts.map((account) =>
      account.id === id 
        ? { 
            ...account, 
            name: name || account.name, // Use the existing account name if `name` is null
            url 
          } 
        : account
    );
    setAccounts(updatedAccounts);
    if(name){
        await window.electron.saveSheetsAccounts(updatedAccounts);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  return (
    <SheetsContext.Provider
      value={{
        accounts,
        activeAccount,
        addAccount,
        deleteAccount,
        switchAccount,
        setSheetName, // Expose setSheetName function
      }}
    >
      {children}
    </SheetsContext.Provider>
  );
};
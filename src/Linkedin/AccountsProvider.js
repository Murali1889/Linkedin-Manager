// AccountsProvider.js
import React, { createContext, useState, useContext, useEffect } from 'react';

const AccountsContext = createContext();

export const useAccounts = () => useContext(AccountsContext);

export const AccountsProvider = ({ children }) => {
  const [accounts, setAccounts] = useState([]);
  const [activeAccount, setActiveAccount] = useState(null);
  const [switchNav, setSwitchNav] = useState('linkedin');
  const [profileActive, setProfileActive] = useState(false)

  const switchAccount = (id) => {
    const selectedAccount = accounts.find((account) => account.id === id);
    setActiveAccount(selectedAccount);
  };

  const saveAccounts = async (updatedAccounts) => {
    try {
      await window.electron.saveLinkedinAccounts(updatedAccounts);
      setAccounts(updatedAccounts);
    } catch (error) {
      console.error('Failed to save accounts:', error);
    }
  };

  const changeName = async ({ id, newName }) => {
    const updatedAccounts = accounts.map((account) =>
      account.id === id ? { ...account, name: newName } : account
    );
    await saveAccounts(updatedAccounts);

    if (activeAccount && activeAccount.id === id) {
      setActiveAccount({ ...activeAccount, name: newName });
    }
  };

  const deleteAccount = async (id) => {
    const updatedAccounts = accounts.filter((account) => account.id !== id);
    await saveAccounts(updatedAccounts);

    if (activeAccount && activeAccount.id === id) {
      setActiveAccount(updatedAccounts.length > 0 ? updatedAccounts[0] : null);
    }
  };

  const addAccount = async () => {
    try {
      const partition = `persist:account${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newAccount = {
        id: partition,
        name: `LinkedIn Account ${accounts.length + 1}`,
        partition,
      };
      const updatedAccounts = [...accounts, newAccount];
      await saveAccounts(updatedAccounts);
      setActiveAccount(newAccount); // Set the newly added account as active
    } catch (error) {
      console.error('Failed to add account:', error);
    }
  };

  const getLinkedinAccounts = async () => {
    try {
      const linkedinAccounts = await window.electron.getLinkedinAccounts();
      setAccounts(linkedinAccounts);
      setActiveAccount(linkedinAccounts[0] || null)
    } catch (error) {
      console.error('Failed to fetch LinkedIn accounts:', error);
    }
  };

  useEffect(() => {
    getLinkedinAccounts();
  }, []);

  return (
    <AccountsContext.Provider
      value={{
        accounts,
        setAccounts,
        activeAccount,
        switchAccount,
        changeName,
        deleteAccount,
        addAccount,
        setSwitchNav,
        switchNav,
        getLinkedinAccounts,
        profileActive,
        setProfileActive,
      }}
    >
      {children}
    </AccountsContext.Provider>
  );
};
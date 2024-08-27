import React, { useState, useCallback } from "react";

import RoleSelector from "./components/RoleSelector";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "./components/ui/select";
import { Button } from "./components/ui/button"; // Import the custom Button
import Settings from "./pages/Settings";

const Navbar = ({ setAccounts, setVisibleAccountId, currentViewIndex, accounts }) => {
  const [loading, setLoading] = useState(false);

  const generateUniqueId = () => {
    return `view-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const addAccount = useCallback(async () => {
    setLoading(true);
    try {
      const partition = await window.electron.addAccount();
      const id = generateUniqueId();
      const newAccount = { id, partition, name: `Account ${accounts.length + 1}` };
      const updatedAccounts = [...accounts, newAccount];
      setAccounts(updatedAccounts);
      await window.electron.saveAccounts(updatedAccounts);
      setVisibleAccountId(id);
    } catch (error) {
      console.error("Failed to add account:", error);
    }
    setLoading(false);
  }, [accounts, setAccounts, setVisibleAccountId]);

  const switchToAccount = useCallback((id) => {
    setVisibleAccountId(id);
  }, [setVisibleAccountId]);

  const deleteAccount = useCallback(async (id) => {
    setLoading(true);
    try {
      await window.electron.deleteAccount(id);
      const updatedAccounts = accounts.filter((account) => account.id !== id);
      setAccounts(updatedAccounts);
      await window.electron.saveAccounts(updatedAccounts);

      // Switch to the last account if any are left
      if (updatedAccounts.length > 0) {
        console.log(updatedAccounts[updatedAccounts.length - 1].id)
        setVisibleAccountId(updatedAccounts[updatedAccounts.length - 1].id);
      } else {
        setVisibleAccountId(null);
      }
    } catch (error) {
      console.error("Failed to delete account:", error);
    }
    setLoading(false);
  }, [accounts, setAccounts, setVisibleAccountId]);


  

  return (
    <div style={{ width: "300px", borderRight: "1px solid #ddd", height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: '10px' }}>
        <Select value={(currentViewIndex) || 'no-account'} onValueChange={switchToAccount} id="account-select">
          <SelectTrigger>
            <SelectValue placeholder="Select an account" />
          </SelectTrigger>
          <SelectContent>
            {accounts.length > 0 ? (
              accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="no-account" disabled>
                No accounts available
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        <div style={{ marginTop: '10px' }}>
          <Button
            variant="default" // Use your desired variant
            size="default" // Use your desired size
            fullWidth
            onClick={addAccount}
            disabled={loading}
          >
            Create Account
          </Button>
        </div>
        
      </div>
      <RoleSelector />
      <Settings setAccounts={setAccounts} accounts={accounts} deleteAccount={deleteAccount} />
    </div>
  );
};

export default Navbar;

import React, { useContext, useCallback, useState } from "react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "./components/ui/select";
import { Button } from "./components/ui/button"; // Import the custom Button
import Settings from "./pages/Settings";

const Navbar = ({ setAccounts, setVisibleAccountId, currentViewIndex, accounts, showBrowserViews, setShowBrowserViews }) => {
  const [loading, setLoading] = useState(false);
  const { tabs, activeTab, addTab, switchTab } = useContext(TabsContext); // Access tabs context

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

  const deleteAccount = useCallback(async (id) => {
    setLoading(true);
    try {
      await window.electron.deleteAccount(id);
      const updatedAccounts = accounts.filter((account) => account.id !== id);
      setAccounts(updatedAccounts);
      await window.electron.saveAccounts(updatedAccounts);

      // Switch to the last account if any are left
      if (updatedAccounts.length > 0) {
        setVisibleAccountId(updatedAccounts[updatedAccounts.length - 1].id);
      } else {
        setVisibleAccountId(null);
      }
    } catch (error) {
      console.error("Failed to delete account:", error);
    }
    setLoading(false);
  }, [accounts, setAccounts, setVisibleAccountId]);

  const toggleBrowserViews = () => {
    setShowBrowserViews(!showBrowserViews);
  };

  return (
    <div style={{ width: "300px", borderRight: "1px solid #ddd", height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: '10px' }}>
        {/* Account Selection and Management */}
        <Select value={currentViewIndex || 'no-account'} onValueChange={switchTab} id="account-select">
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
            variant="default"
            size="default"
            fullWidth
            onClick={addAccount}
            disabled={loading}
          >
            Create Account
          </Button>
        </div>
      </div>

      {/* Button to toggle LinkedIn Manager */}
      <div style={{ padding: '10px' }}>
        <Button
          variant="default"
          size="default"
          fullWidth
          onClick={toggleBrowserViews}
        >
          LinkedIn Manager
        </Button>
      </div>

      {/* Tab Management */}
      <div className="flex flex-col p-4">
        <button
          onClick={addTab}
          className="bg-blue-500 hover:bg-blue-700 text-black font-bold py-2 px-4 rounded mb-4"
        >
          +
        </button>
        <ul className="flex flex-col space-y-2">
          {tabs.map((tab) => (
            <li
              key={tab.id}
              className={`p-2 cursor-pointer rounded ${
                activeTab === tab.id
                  ? 'bg-blue-600'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
              onClick={() => switchTab(tab.id)}
            >
              {tab.title}
            </li>
          ))}
        </ul>
      </div>

      {/* RoleSelector is commented out */}
      {/* <RoleSelector /> */}
      <Settings setAccounts={setAccounts} accounts={accounts} deleteAccount={deleteAccount} />
    </div>
  );
};

export default Navbar;
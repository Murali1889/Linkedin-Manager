// Settings.js
import React, { useState } from "react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "../components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";
import { IconButton } from "@mui/material";
import { Button } from "../components/ui/button"; // Using the Button component from ui/button
import {
  GearIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  ExitIcon, // Assuming ExitIcon is available; if not, use a suitable icon for logout
} from "@radix-ui/react-icons"; // Import the settings and delete icons
import { useAccounts } from "../Linkedin/AccountsProvider"; // Import AccountsContext

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const { accounts: linkedinAccounts, deleteAccount: deleteLinkedinAccount, clearAllAccounts: clearAllLinkedinAccounts } = useAccounts();

  const handleClearAllAccounts = async () => {
    setLoading(true);
    try {
      // Clear all accounts for both LinkedIn and Google Sheets
      await clearAllLinkedinAccounts();
    } catch (error) {
      console.error("Failed to clear all accounts:", error);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await window.electron.logout();
    } catch (error) {
      console.error("Failed to logout:", error);
    }
    setLoading(false);
  };

  const handleDeleteAccount = async (id, type) => {
    setLoading(true);
    try {
      if (type === "linkedin") {
        await deleteLinkedinAccount(id);
      } 
    } catch (error) {
      console.error(`Failed to delete ${type} account:`, error);
    }
    setLoading(false);
  };

  return (
    <div className="m-auto mt-5 mb-5 w-[80%]">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="flex items-center space-x-2 w-full">
            <GearIcon className="w-5 h-5" />
            <span>Settings</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="bg-white text-gray-900">
          <SheetHeader>
            <SheetTitle>Settings</SheetTitle>
            <SheetDescription>Manage your account settings</SheetDescription>
          </SheetHeader>
          <div className="p-4">
            <h2 className="text-lg font-semibold">LinkedIn Accounts</h2>
            <ul className="mt-2 space-y-2">
              {linkedinAccounts.map((account) => (
                <li key={account.id} className="w-full">
                  <div className="flex justify-between items-center w-full bg-gray-100 p-2 rounded-md">
                    <span>{account.name}</span>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <IconButton>
                          <TrashIcon className="w-5 h-5" />
                        </IconButton>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your LinkedIn account and remove your data from our servers.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteAccount(account.id, "linkedin")}>
                            Continue
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="flex items-center space-x-2 bg-red-100 hover:bg-red-200 text-red-700 w-full"
                    disabled={loading}
                  >
                    <ExclamationTriangleIcon className="w-5 h-5" />
                    <span>Clear All</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete all accounts and remove all data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearAllAccounts}>Continue</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            <div className="mt-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 w-full"
                    disabled={loading}
                  >
                    <ExitIcon className="w-5 h-5" />
                    <span>Logout</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action will log you out of the application.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLogout}>Logout</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Settings;
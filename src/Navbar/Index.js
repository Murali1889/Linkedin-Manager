// Navbar.jsx
import React, { useContext } from "react";
import { NavbarContext } from "./NavProvider";
import AccountsList from "../Linkedin/AccountsList";
import { useAccounts } from "../Linkedin/AccountsProvider";
import Settings from "../pages/Settings";
import AddNewSheet from "../Sheets/AddNewSheet";
import Select from "./Select";

const Navbar = () => {
  const { expanded, toggleExpand } = useContext(NavbarContext);
  const { switchNav } = useAccounts();

  const handleClick = () => {
    console.log("clicked");
    window.electron.logOut();
  };

  return (
    <div
      className="flex flex-col bg-white h-full flex-shrink-0"
      style={{ width: '250px', overflow: 'hidden' }} // Fixed width and no resizing
    >
      {/* Display the AccountsList or AddNewSheet based on the selected navigation */}
      {switchNav === "linkedin" && <AccountsList />}
      {switchNav === "sheets" && <AddNewSheet />}

      {/* Navigation buttons to switch between LinkedIn and Sheets */}
      <Select />

      {/* Settings component */}
      <Settings />
    </div>
  );
};

export default Navbar;
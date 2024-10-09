import React, { useContext, useState } from "react";
import { NavbarContext } from "./NavProvider";
import AccountsList from "../Linkedin/AccountsList";
import { useAccounts } from "../Linkedin/AccountsProvider";
import Settings from "../pages/Settings";
import AddNewSheet from "../Sheets/AddNewSheet";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, X } from "lucide-react";

const Navbar = ({ setIsExpanded, isExpanded }) => {  // Accepting props for expanding control
  const { switchNav } = useAccounts();

  const handleCloseSidebar = () => {
    setIsExpanded(false); // Collapse the sidebar when the X mark is clicked
  };

  return (
    <motion.div
      className="h-full border-r border-gray-200 shadow-sm bg-white"
      animate={{ width: isExpanded ? 300 : 0 }} // Expanding/collapsing animation
      transition={{ duration: 0.3 }}
      style={{ overflow: "hidden", background:`${switchNav==='sheets'?"#FFFFFF":"#FFFFFF"}` }}
    >
      <div className="flex flex-col h-full flex-shrink-0">
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Render different components based on switchNav */}
              {switchNav === "linkedin" && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <AccountsList />
                </motion.div>
              )}
              {switchNav === "sheets" && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <AddNewSheet />
                </motion.div>
              )}
              {switchNav === "docs" && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-gray-700 p-4">Document Library Coming Soon...</p>
                </motion.div>
              )}

              <Settings />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default Navbar;
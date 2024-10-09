import React, { useState } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "../components/ui/button";
import  CloseIcon  from '@mui/icons-material/Close'; // Import close icon from Material-UI
import { useSheets } from "../auth/SheetsProvider"; // Use the Sheets context

const AddNewSheet = () => {
  // Fetching sheets data and active sheet context
  const { sheetData, activeSheet, switchSheet, selectedSheets, setSelectedSheets } = useSheets(); 

  // For search functionality
  const [searchTerm, setSearchTerm] = useState(""); 
  const [warning, setWarning] = useState(""); // Warning message

  // Filter the sheets based on search input
  const filteredSheets = sheetData.filter(sheet => 
    sheet.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle sheet selection logic
  const handleSheetSelection = (sheet) => {
    if (selectedSheets.some(selectedSheet => selectedSheet.id === sheet.id)) {
      // If the sheet is already selected, just switch to it
      switchSheet(sheet.id);
    } else if (selectedSheets.length < 5) {
      // Add new sheet if the selected list has less than 5 sheets
      setSelectedSheets([...selectedSheets, sheet]);
      switchSheet(sheet.id);
      setWarning(""); // Clear warning if it's set
    } else {
      // If more than 5 sheets are selected, show a warning
      setWarning("You can only select up to 5 sheets. Please remove one to add another.");
    }
  };

  // Handle removing a sheet from the selected sheets list
  const handleRemoveSheet = (sheetId) => {
    const updatedSheets = selectedSheets.filter(sheet => sheet.id !== sheetId);
    setSelectedSheets(updatedSheets);
    setWarning(""); // Clear the warning when a sheet is removed
  };

  // Helper function to check if a sheet is selected
  const isSelected = (sheet) => selectedSheets.some(selectedSheet => selectedSheet.id === sheet.id);

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200">
        <motion.div
          key="expanded"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <input
            type="text"
            placeholder="Search sheets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded mb-2"
          />
        </motion.div>
      </div>

      {/* Warning message */}
      {warning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="text-red-500 p-2 text-center"
        >
          {warning}
        </motion.div>
      )}

      {/* List of sheets */}
      <div className="flex-grow relative overflow-y-auto h-[500px] p-1">
        <AnimatePresence>
          {filteredSheets.map((sheet, index) => (
            <motion.div
              key={sheet.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="mb-2 bg-white" // Add spacing between sheets
              style={{boxShadow: '-1px 2px 5.4px 1px rgba(0, 0, 0, 0.2)'}}
            >
              <div
                className={`w-full flex items-center justify-between px-4 py-2 rounded ${
                  isSelected(sheet) ? 'bg-blue-100 text-blue-600' : 'text-gray-700'
                } hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200 relative`}
                onClick={() => handleSheetSelection(sheet)}
              >
                <span className="flex-grow">{sheet.name}</span>

                {/* Show the X mark only for selected sheets on hover */}
                {isSelected(sheet) && (
                  <CloseIcon
                    className="ml-2 cursor-pointer text-gray-500 hover:text-red-500"
                    style={{ fontSize: 16 }}
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering the sheet selection on close
                      handleRemoveSheet(sheet.id);
                    }}
                  />
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredSheets.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-gray-500 mt-4"
          >
            No sheets found
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AddNewSheet;
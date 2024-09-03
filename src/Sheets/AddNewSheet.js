import React, { useState } from "react";
import { Button } from "../components/ui/button";
import { useSheets } from "./SheetsProvider"; // Use the Sheets context
import { XMarkIcon } from "@heroicons/react/24/solid"; // Correct import for the close icon

const AddNewSheet = () => {
  const { accounts, activeAccount, switchAccount, addAccount, deleteAccount } =
    useSheets();
  const [searchTerm, setSearchTerm] = useState("");
  const listHeight = accounts.length > 15 ? '73%' : 'auto';
  // Function to handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  // Sort accounts based on whether they match the search term
  const sortedAccounts = accounts.sort((a, b) => {
    const aMatches = a.name.toLowerCase().includes(searchTerm);
    const bMatches = b.name.toLowerCase().includes(searchTerm);

    // Show matching items first
    if (aMatches && !bMatches) return -1;
    if (!aMatches && bMatches) return 1;
    return 0; // Preserve order among similar types
  });

  return (
    <div style={{ padding: "10px 10px 0 10px" }}>
      {/* Search Input */}
      <input
        type="text"
        placeholder="Search sheets..."
        value={searchTerm}
        onChange={handleSearchChange}
        className="w-full p-2 mb-2 border border-gray-300 rounded"
        style={{ marginBottom: "10px" }}
      />

      <div className="mb-[10px]">
        <Button variant="default" size="default" fullWidth onClick={addAccount}>
          Add New Sheet
        </Button>
      </div>

      {/* List of available sheets */}
      <ul className="list-none p-0 m-0 overflow-y-scroll ul-scroll" style={{ height: listHeight }}>
        {sortedAccounts.map((account) => (
          <li
            key={account.id}
            onClick={() => switchAccount(account.id)}
            className={`flex justify-between items-center cursor-pointer p-2 rounded ${
              activeAccount?.id === account.id ? "bg-blue-100" : "bg-white"
            } hover:bg-blue-50`}
            style={{
              border: "1px solid #ddd",
              marginBottom: "5px",
              transition: "background-color 0.3s",
            }}
            title={account.name} // Show full name on hover
          >
            {/* Sheet Name, truncated with ellipsis if too long */}
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                flexGrow: 1,
              }}
            >
              {account.name}
            </span>
            {/* Delete Button */}
            <XMarkIcon
              className="w-4 h-4 text-red-500 cursor-pointer ml-2"
              onClick={(e) => {
                e.stopPropagation(); // Prevent triggering the switchAccount on delete
                deleteAccount(account.id);
              }}
              title="Remove sheet"
            />
          </li>
        ))}
      </ul>

      {/* Button to create a new sheet */}
    </div>
  );
};

export default AddNewSheet;

// Dropdown.jsx
import React, { useContext, useState } from 'react';
import { NavbarContext } from './NavProvider';
import { ExpandMore, ExpandLess, Add } from '@mui/icons-material';
import { IconButton } from '@mui/material';

const Dropdown = ({ header, icon }) => {
  const { expanded, dropdownData, addNewItem, setActiveTab } = useContext(NavbarContext);
  const [isOpen, setIsOpen] = useState(false);

  const items = dropdownData[header] || [];

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleAddNewItem = () => {
    addNewItem(header);
  };

  return (
    <div className="flex flex-col my-2 transition-all duration-300 ease-in-out">
      <div
        className="flex items-center justify-between px-2 cursor-pointer"
        onClick={handleToggle}
      >
        {icon}
        {expanded && <span className="text-black ml-2">{header}</span>}
        {expanded && (
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              handleAddNewItem();
            }}
            style={{ width: 30, height: 30 }}
          >
            <Add className="text-black" style={{ fontSize: 30 }} />
          </IconButton>
        )}
        {expanded && (
          <IconButton
            onClick={handleToggle}
            style={{ width: 30, height: 30 }}
          >
            {isOpen ? (
              <ExpandLess className="text-black" style={{ fontSize: 30 }} />
            ) : (
              <ExpandMore className="text-black" style={{ fontSize: 30 }} />
            )}
          </IconButton>
        )}
      </div>
      {isOpen && expanded && (
        <div className="flex flex-col mt-2 bg-gray-700 rounded transition-all duration-300 ease-in-out">
          {items.length > 0 ? (
            items.map((item, index) => (
              <div
                key={item.id}
                className="p-2 text-black border-b border-gray-600 cursor-pointer"
                onClick={() => setActiveTab(header, item)}
              >
                {item.name}
              </div>
            ))
          ) : (
            <div className="p-2 text-black border-b border-gray-600">
              {header === 'Linkedin Manager' ? 'Add new account' : 'Add new tab'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
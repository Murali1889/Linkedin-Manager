import { createContext, useState, useContext } from 'react';

// Create the RoleContext
export const RoleContext = createContext();

// Custom hook to use RoleContext
export const useRoleContext = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRoleContext must be used within a RoleProvider');
  }
  return context;
};

// Create a provider component
export const RoleProvider = ({ children }) => {
  const [isButtonClicked, setIsButtonClicked] = useState(0); // 0: hidden, 1: show form, 2: show loading, 3: show finished

  const handleClick = () => {
    setIsButtonClicked(1); // Show form when button is clicked
  };

  const startLoading = () => {
    setIsButtonClicked(2); // Show loading page after form submit
    setTimeout(() => {
      setIsButtonClicked(3); // After 15 sec, show finished page
    }, 15000);
  };

  // Context value to pass the state and functions to all children
  const value = {
    isButtonClicked,
    setIsButtonClicked,
    handleClick,
    startLoading,
  };

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
};

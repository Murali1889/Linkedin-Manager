// LinkedinWebviews.js
import React, { useEffect, useRef, useContext } from "react";
import { useAccounts } from "./AccountsProvider"; // Accessing accounts context
import PersonOffIcon from '@mui/icons-material/PersonOff'; // Import the icon for the empty state
import { injectTryGetAccountName, updateRoles, updateList, injectCustomJS } from "../Scripts/linkedinScripts";
import { ProfileContext } from "../auth/ProfileProvider";

const LinkedinWebviews = () => {
  const { accounts, activeAccount, addAccount, changeName, switchNav } = useAccounts();
  const { selectedProfiles, checkedItems, loading } = useContext(ProfileContext);
  
  const webviewRefs = useRef({}); // Store references to each webview element

  // Function to handle adding a new account
  const handleAddAccount = async () => {
    await addAccount();
  };

  // Effect to adjust z-index for active account's webviews
  useEffect(() => {
    if (activeAccount) {
      if (webviewRefs.current[activeAccount.id]) {
        webviewRefs.current[activeAccount.id].forEach(
          (view) => (view.style.zIndex = 10)
        );
      }
      Object.keys(webviewRefs.current).forEach((id) => {
        if (id !== activeAccount.id && webviewRefs.current[id]) {
          webviewRefs.current[id].forEach((view) => (view.style.zIndex = 1));
        }
      });
    }
  }, [activeAccount]);




  // Function to handle setting up the webview with the correct event listeners
  const setupWebview = (view, accountId) => {
    if (view) {
      view.addEventListener("dom-ready", () =>{
        injectTryGetAccountName(view, accountId, changeName);
        // updateRoles(selectedProfiles, webviewRefs);
        // updateList(checkedItems, webviewRefs);
        // injectCustomJS(view, accountId)
      });
    }
  };

  // useEffect(()=>{
  //   if(!loading && webviewRefs){
  //     updateList(checkedItems, webviewRefs)
  //   }
  // },[checkedItems]);

  // useEffect(()=>{
  //   console.log(selectedProfiles)
  //   if(!loading && webviewRefs){
  //     updateRoles(selectedProfiles, webviewRefs);
  //   }
  // },[selectedProfiles]);



  return (
    <div
      className="flex flex-col transition-all duration-300 ease-in-out w-full h-full absolute bg-white"
      style={{ zIndex: switchNav === 'sheets' ? 0 : 1 }}
    >
      <div className="relative flex-grow w-full h-full" style={{ display: "flex" }}>
        {accounts.length > 0 ? (
          accounts.map((account) => (
            <div
              key={account.id}
              className="flex-grow h-full w-full absolute"
              style={{ zIndex: activeAccount?.id === account.id ? 10 : 1 }}
            >
              <webview
                ref={(el) => {
                  if (!webviewRefs.current[account.id]) {
                    webviewRefs.current[account.id] = [];
                  }
                  if (el) {
                    // el.addEventListener("dom-ready", () => {
                    //   el.openDevTools(); // Opens the DevTools for the webview
                    // });
                    webviewRefs.current[account.id].push(el);
                    setupWebview(el, account.id); // Attach event listeners
                  }
                }}
                src="https://www.linkedin.com/messaging/"
                style={{
                  width: "100%",
                  height: "100%",
                  background: "white",
                  zIndex: activeAccount?.id === account.id ? 10 : 1,
                }}
                partition={account.partition}
                data-id={account.id}
              />
            </div>
          ))
        ) : (
          // Display message and icon when no LinkedIn accounts are available
          <div className="flex flex-col items-center justify-center w-full h-full text-center">
            <PersonOffIcon style={{ fontSize: 80, color: '#9CA3AF' }} />
            <h2 className="text-xl font-semibold text-gray-600 mt-4">No LinkedIn Accounts Available</h2>
            <p className="text-gray-500">Please add a LinkedIn account to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LinkedinWebviews;
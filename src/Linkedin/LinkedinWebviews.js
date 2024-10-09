import React, { useEffect, useRef, useContext, useState } from "react";
import { useAccounts } from "./AccountsProvider"; // Accessing accounts context
import PersonOffIcon from "@mui/icons-material/PersonOff"; // Import the icon for the empty state
import { injectTryGetAccountName, goToProfile, injectShortcutObserver, injectStayOnMessagingPage, updateRoles, updateList, injectCustomJS, addLabel, updateLabels, updateLabelTags , storeShortcutsInIndexedDB, scriptTo } from "../Scripts/linkedinScripts";
import { ProfileContext } from "../auth/ProfileProvider";
import { useLabels } from "../auth/LabelsProvider";
import { useShortcuts } from "../auth/ShortcutProvider";

const LinkedinWebviews = () => {
  const { accounts, activeAccount, addAccount, changeName, switchNav } = useAccounts();
  const { selectedProfiles, checkedItems, loading } = useContext(ProfileContext);
  const {shortcuts} = useShortcuts();
  const {labels} = useLabels();
  const [profileActiveAccount, setProfileActiveAccount] = useState(null);

  const webviewRefs = useRef({}); // Store references to each webview element

  // Effect to adjust visibility for active account's webviews using display:none
  console.log(activeAccount)
  useEffect(() => {
    if (activeAccount) {
      Object.keys(webviewRefs.current).forEach((id) => {
        if (webviewRefs.current[id]) {
          webviewRefs.current[id].messaging.style.display = id === activeAccount.id ? 'flex' : 'none';
        }
      });
    }
  }, [activeAccount]);

  // Function to handle setting up the webview with the correct event listeners
  const setupWebview = (view, accountId, type) => {
    if (view) {
      view.addEventListener("dom-ready", async() => {
        if (type === "messaging") {
          injectTryGetAccountName(view, accountId, changeName);
          injectStayOnMessagingPage(view);
          updateLabels(labels, view);
          injectShortcutObserver(view, shortcuts);
          goToProfile(view, accountId);
          injectCustomJS(view, accountId);
          addLabel(view, accountId);
          updateLabelTags(view);
          storeShortcutsInIndexedDB(view, shortcuts);
          scriptTo(view);
          injectSvg(view)
        }
      });
    }
  };

  // Listen for profile URL notifications and update the correct profile webview based on the account ID


  useEffect(() => {
    if (selectedProfiles && !loading) {
      if (Object.keys(webviewRefs.current).length > 0) {
        Object.values(webviewRefs.current).forEach((view) => {
          if (view.messaging) {
            updateRoles(selectedProfiles, view.messaging);
          }
        });
      }
    }
  }, [selectedProfiles]);

  useEffect(() => {
    if (checkedItems && !loading) {
      if (Object.keys(webviewRefs.current).length > 0) {
        Object.values(webviewRefs.current).forEach((view) => {
          if (view.messaging) {
            updateList(checkedItems, view.messaging);
          }
        });
      }
    }
  }, [checkedItems]);

  useEffect(() => {
    if (labels) {
      if (Object.keys(webviewRefs.current).length > 0) {
        Object.values(webviewRefs.current).forEach((view) => {
          if (view.messaging) {
            updateLabels(labels, view.messaging);
          }
        });
      }
    }
  }, [labels]);

  useEffect(() => {
    if (shortcuts) {
      Object.values(webviewRefs.current).forEach((view) => {
        if (view.messaging) {
          storeShortcutsInIndexedDB(view.messaging, shortcuts); // Update IndexedDB with new shortcuts
        }
      });
    }
  }, [shortcuts]);

  return (
    <div
      className="flex flex-col transition-all duration-300 ease-in-out w-full h-full absolute bg-white "
      style={{ zIndex: switchNav === "sheets" ? 0 : 1 }}
    >
      <div className="relative flex-grow w-full h-full overflow-x-scroll flex">
        {accounts.length > 0 ? (
          accounts.map((account) => (
            <div
              key={account.id}
              className="flex h-full w-full flex-nowrap absolute"
              style={{ display: activeAccount?.id === account.id ? 'block' : 'none' }}
            >
              <div className="flex h-full w-full" style={{ minWidth: "100%" }}>
                <div className="w-full h-full flex-shrink-0">
                  <webview
                    ref={(el) => {
                      if (!webviewRefs.current[account.id]) {
                        webviewRefs.current[account.id] = { messaging: null, profile: null };
                      }
                      if (el) {
                        webviewRefs.current[account.id].messaging = el;
                        setupWebview(el, account.id, "messaging"); // Attach event listeners
                      }
                    }}
                    src="https://www.linkedin.com/messaging/"
                    style={{
                      width: "100%",
                      height: "100%",
                      background: "white",
                    }}
                    partition={account.partition}
                    data-id={account.id}
                    preload="../public/preload.js"
                  />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full text-center">
            <PersonOffIcon style={{ fontSize: 80, color: "#9CA3AF" }} />
            <h2 className="text-xl font-semibold text-gray-600 mt-4">No LinkedIn Accounts Available</h2>
            <p className="text-gray-500">Please add a LinkedIn account to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LinkedinWebviews;
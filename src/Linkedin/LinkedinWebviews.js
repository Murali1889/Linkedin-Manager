// LinkedinWebviews.js
import React, { useEffect, useRef, useContext, useState } from "react";
import { useAccounts } from "./AccountsProvider"; // Accessing accounts context
import PersonOffIcon from "@mui/icons-material/PersonOff"; // Import the icon for the empty state
import { injectTryGetAccountName, injectShortcutHandler, goToProfile, injectProfileView } from "../Scripts/linkedinScripts";
import { ProfileContext } from "../auth/ProfileProvider";

const LinkedinWebviews = () => {
  const { accounts, activeAccount, addAccount, changeName, switchNav } = useAccounts();
  const { selectedProfiles, checkedItems, loading } = useContext(ProfileContext);

  const webviewRefs = useRef({}); // Store references to each webview element
  const [profileUrl, setProfileUrl] = useState(""); // To hold the URL for the profile webview

  // Function to handle adding a new account
  const handleAddAccount = async () => {
    await addAccount();
  };

  // Effect to adjust z-index for active account's webviews
  useEffect(() => {
    if (activeAccount) {
      Object.keys(webviewRefs.current).forEach((id) => {
        if (webviewRefs.current[id]) {
          webviewRefs.current[id].messaging.style.zIndex = id === activeAccount.id ? 10 : 1;
          webviewRefs.current[id].profile.style.zIndex = id === activeAccount.id ? 10 : 1;
        }
      });
    }
  }, [activeAccount]);

  // Function to handle setting up the webview with the correct event listeners
  const setupWebview = (view, accountId, type) => {
    if (view) {
      view.addEventListener("dom-ready", () => {
        if (type === "messaging") {
          injectTryGetAccountName(view, accountId, changeName);
          injectShortcutHandler(view);
          goToProfile(view, accountId);
        } else if (type === "profile") {
          // Inject different script for profile webview if needed
          injectProfileView(view, accountId)
        }
      });
    }
  };

  // Listen for profile URL notifications and update the profile webview
  useEffect(() => {
    window.electron.onProfileNotification((data) => {
      const { url } = data;
      setProfileUrl(url);
    });
  }, []);

  return (
    <div
      className="flex flex-col transition-all duration-300 ease-in-out w-full h-full absolute bg-white"
      style={{ zIndex: switchNav === "sheets" ? 0 : 1 }}
    >
      <div className="relative flex-grow w-full h-full overflow-x-scroll flex">
        {accounts.length > 0 ? (
          accounts.map((account) => (
            <div
              key={account.id}
              className="flex h-full w-full flex-nowrap absolute"
              style={{ zIndex: activeAccount?.id === account.id ? 10 : 1 }}
            >
              {/* Container for messaging and profile webviews */}
              <div className="flex h-full w-full" style={{ minWidth: "100%" }}>
                {/* Messaging Webview */}
                <div className="w-full h-full flex-shrink-0">
                  <webview
                    ref={(el) => {
                      if (!webviewRefs.current[account.id]) {
                        webviewRefs.current[account.id] = { messaging: null, profile: null };
                      }
                      if (el) {
                        webviewRefs.current[account.id].messaging = el;
                        // el.addEventListener("dom-ready", () => {
                        //   el.openDevTools(); // Opens the DevTools for the webview
                        // });
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

                {/* Profile Webview */}
                <div className="w-full h-full flex-shrink-0">
                  <webview
                    ref={(el) => {
                      if (el) {
                        webviewRefs.current[account.id].profile = el;
                        // el.addEventListener("dom-ready", () => {
                        //   el.openDevTools(); // Opens the DevTools for the webview
                        // });
                        setupWebview(el, account.id, "profile"); // Attach event listeners for profile webview
                      }
                    }}
                    src={profileUrl || "about:blank"} // Load the profile URL when available
                    style={{
                      width: "100%",
                      height: "100%",
                      background: "white",
                    }}
                    partition={account.partition}
                    data-id={account.id}
                  />
                </div>
              </div>
            </div>
          ))
        ) : (
          // Display message and icon when no LinkedIn accounts are available
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
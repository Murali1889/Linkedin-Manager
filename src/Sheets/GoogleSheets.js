// GoogleSheets.js
import React, { useRef, useEffect } from 'react';
import { useSheets } from './SheetsProvider'; // Import your SheetsProvider context
import { useAccounts } from '../Linkedin/AccountsProvider';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'; // Import the icon from Material-UI

const GoogleSheets = () => {
  const { accounts, activeAccount, setSheetName } = useSheets();
  const { switchNav } = useAccounts();
  const webviewRefs = useRef({}); // Store references to each webview element

  // Function to handle URL changes in the webview and extract the sheet name
  const handleUrlChange = (accountId) => {
    if (webviewRefs.current[accountId]) {
      const webview = webviewRefs.current[accountId];
      
      // JS code to extract the current URL and the meta title
      const jsCode = `
        (() => {
          const currentUrl = window.location.href;
          const metaTag = document.querySelector('meta[property="og:title"]');
          const sheetName = metaTag ? metaTag.content : '';
          return { currentUrl, sheetName };
        })();
      `;

      // Add an event listener for URL changes
      webview.addEventListener('did-navigate', () => {
        console.log('navigated');
        webview.executeJavaScript(jsCode).then(({ currentUrl, sheetName }) => {
          if (currentUrl && accounts.find((account) => account.id === accountId)) {
            if (sheetName || currentUrl) {
              setSheetName(accountId, sheetName, currentUrl);
            }
          }
        });
      });
    }
  };

  // Effect to handle URL changes when the active account changes
  useEffect(() => {
    if (activeAccount) {
      handleUrlChange(activeAccount.id);
    }
  }, [activeAccount]);

  return (
    <div
      className="flex flex-col transition-all duration-300 ease-in-out w-full h-full absolute bg-white"
      style={{ zIndex: switchNav === 'sheets' ? 1 : 0 }}
    >
      <div className="relative flex-grow w-full h-full" style={{ display: 'flex' }}>
        {accounts.length > 0 ? (
          accounts.map((account) => (
            <div
              key={account.id}
              className="flex-grow h-full w-full absolute"
              style={{ zIndex: activeAccount?.id === account.id ? 10 : 1 }}
            >
              <webview
                ref={(el) => {
                  if (el) {
                    webviewRefs.current[account.id] = el;
                    if (activeAccount && activeAccount.id === account.id) {
                      handleUrlChange(account.id); // Attach URL change handler only for active account
                    }
                  }
                }}
                src={account.url}
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'white',
                  zIndex: activeAccount?.id === account.id ? 10 : 1,
                }}
                partition="persist:shared-session"
              />
            </div>
          ))
        ) : (
          // Display message and icon when no sheets are available
          <div className="flex flex-col items-center justify-center w-full h-full text-center">
            <InsertDriveFileIcon style={{ fontSize: 80, color: '#9CA3AF' }} />
            <h2 className="text-xl font-semibold text-gray-600 mt-4">No Sheets Available</h2>
            <p className="text-gray-500">Add a new sheet to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleSheets;
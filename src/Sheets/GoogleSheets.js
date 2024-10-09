import React, { useEffect, useRef } from 'react';
import { useSheets } from '../auth/SheetsProvider';
import { useAccounts } from '../Linkedin/AccountsProvider';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CloseIcon from '@mui/icons-material/Close';

const getUrls = (activeSheet) => {
  return `
    (function() {
      document.addEventListener('click', function(e) {
        let target = e.target;
        while (target && target !== document.body) {
          if (target.tagName === 'A' || (target.tagName === 'BUTTON' && target.onclick)) {
            let url = target.href || (target.onclick && target.onclick.toString().match(/window\.open\\(['"]([^'"]+)['"]/)?.[1]);
            if (url) {
              console.log('Clicked URL:', url);
              window.electron.openUrlFromSheet(url,${JSON.stringify(activeSheet)} )
            }
            break;
          }
          target = target.parentNode;
        }
      }, true);
      console.log('URL logging script injected and active.');
    })();
  `;
};

const GoogleSheets = () => {
  const { activeSheet, switchSheet, selectedSheets, setSelectedSheets, setActiveSheet } = useSheets();
  const { switchNav } = useAccounts();
  const webviewRefs = useRef({});

  useEffect(() => {
    // Inject the script into the active webview
    if (activeSheet && webviewRefs.current[activeSheet.id]) {
      const webview = webviewRefs.current[activeSheet.id];
      webview.addEventListener('dom-ready', () => {
        // webview.openDevTools()
        webview.executeJavaScript(getUrls(activeSheet))
          .then(() => console.log('URL logging script injected into', activeSheet.name))
          .catch(err => console.error('Failed to inject URL logging script:', err));
      });
    }
  }, [activeSheet]);

  const handleRemoveSheet = (sheetId) => {
    const updatedSheets = selectedSheets.filter(sheet => sheet.id !== sheetId);
    setSelectedSheets(updatedSheets);
    if (activeSheet?.id === sheetId && updatedSheets.length > 0) {
      setActiveSheet(updatedSheets[0]);
    } else if (updatedSheets.length === 0) {
      setActiveSheet(null);
    }
  };

  return (
    <div
      className="flex flex-col transition-all duration-300 ease-in-out w-full h-full absolute bg-white"
      style={{ display: switchNav === 'sheets' ? 'flex' : 'none' }}
    >
      <div className="flex border-b border-gray-300 p-2 space-x-2 overflow-auto">
        {selectedSheets.length > 0 ? (
          selectedSheets.map((sheet) => (
            <div
              key={sheet.id}
              style={{ borderRadius: '20px', boxShadow: '-1px 2px 5.4px 1px rgba(0, 0, 0, 0.2)' }}
              className={`flex items-center p-2 border rounded cursor-pointer transition-colors duration-200 ${
                activeSheet?.id === sheet.id
                  ? 'bg-[#82CFFD] text-white'
                  : 'bg-[#F5F5F5] text-[#6A6A6A]'
              } hover:bg-[#4DB6E2] hover:text-white`}
              onClick={() => switchSheet(sheet.id)}
            >
              <span className="mr-2">{sheet.name}</span>
              <CloseIcon
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveSheet(sheet.id);
                }}
                style={{ fontSize: 16, cursor: 'pointer' }}
              />
            </div>
          ))
        ) : (
          <p className="text-gray-500">No Sheets Selected</p>
        )}
      </div>

      <div className="relative flex-grow w-full h-full" style={{ display: 'flex' }}>
        {selectedSheets.length === 0 ? (
          <div className="flex flex-col items-center justify-center w-full h-full text-center">
            <InsertDriveFileIcon style={{ fontSize: 80, color: '#9CA3AF' }} />
            <h2 className="text-xl font-semibold text-gray-600 mt-4">No Sheets Available</h2>
            <p className="text-gray-500">Add a new sheet to get started!</p>
          </div>
        ) : (
          selectedSheets.map((sheet) => (
            <div key={sheet.id} className='w-full h-full' style={{display: activeSheet?.id === sheet.id ? 'flex' : 'none'}}>
              <webview
                ref={(el) => {
                  if (el) {
                    webviewRefs.current[sheet.id] = el;
                  }
                }}
                src={`https://docs.google.com/spreadsheets/d/${sheet.id}/edit`}
                style={{
                  width: '100%',
                  height: '100%',
                  background: "white",
                }}
                data-id={activeSheet?.id}
                partition="persist:shared-session"
                preload="../public/preload.js"
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GoogleSheets;
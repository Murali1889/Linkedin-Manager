const { app, BrowserWindow, ipcMain, session, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');


const fs = require('fs');
const path = require('path');

const accountFilePath = path.join(app.getPath('userData'), 'sheetAccounts.json');
const linkedinDataFilePath = path.join(app.getPath('userData'), 'accounts.json');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
      webviewTag: true,
      webSecurity: true,
      nativeWindowOpen: true,
      partition: 'persist:shared-session'
    },
    fullscreen: true, // Make the window fullscreen
    fullscreenable: true,
  });

  mainWindow.webContents.openDevTools();
  const indexPath = path.join(__dirname, '../build/index.html');
  mainWindow.loadURL(`file://${indexPath}`);
  // mainWindow.loadURL('https://locolhost:3000')

  mainWindow.on('closed', function () {
    mainWindow = null;
  });

  // Check for updates after the window is created
  autoUpdater.checkForUpdatesAndNotify();

  // Update events
  autoUpdater.on('update-available', () => {
    dialog.showMessageBox({
      type: 'info',
      title: 'Update Available',
      message: 'A new version is available. Do you want to update now?',
      buttons: ['Yes', 'No']
    }).then(result => {
      if (result.response === 0) { // If 'Yes' is clicked
        autoUpdater.downloadUpdate();
      }
    });
  });

  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox({
      title: 'Update Ready',
      message: 'Update downloaded, application will restart for the update...'
    }).then(() => {
      setImmediate(() => {
        autoUpdater.quitAndInstall();
        
      });
    });
  });

  autoUpdater.on('error', (error) => {
    console.error('Update error:', error);
    dialog.showErrorBox('Update Error', error == null ? 'unknown' : (error.stack || error).toString());
  });
}

app.on('ready', () => {
  createWindow();
  session.defaultSession.cookies.get({ url: 'https://accounts.google.com' })
  .then((cookies) => {
    console.log(cookies);
  }).catch((error) => {
    console.error(error);
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

app.setAsDefaultProtocolClient('hypertalent');

function isJsonString(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

ipcMain.handle('create-view', async () => {
  const partition = `persist:account${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const ses = session.fromPartition(partition);
  await ses.clearStorageData();
  return partition;
});

ipcMain.on('save-name', (event, data) => {
  const accounts = loadAccounts();
  const accountIndex = accounts.findIndex(account => account.id === data.id);
  if (accountIndex !== -1) {
    const account = accounts[accountIndex];
    account.name = data.name;
    fs.writeFileSync(accountFilePath, JSON.stringify(accounts));
  }
});

ipcMain.on('message-from-webview', (event, data) => {
  console.log(dialog)
});

ipcMain.on('save-accounts', (event, uniqueAccounts) => {
  console.log('Saving Accounts to File:', uniqueAccounts.map(account => account.id));
  fs.writeFileSync(accountFilePath, JSON.stringify(uniqueAccounts));
});

ipcMain.handle('load-accounts', () => {
  const accounts = loadAccounts();
  return accounts;
});

ipcMain.handle('clear-all-accounts', async () => {
  try {
    const accounts = loadAccounts();
    if (accounts.length === 0) {
      console.log('No accounts to clear.');
      return;
    }

    for (const account of accounts) {
      try {
        if (account.partition) {
          console.log(`Clearing storage data for partition: ${account.partition}`);
          const ses = session.fromPartition(account.partition);
          await ses.clearStorageData();
          console.log(`Cleared storage data for partition: ${account.partition}`);
        } else {
          console.error('Account partition is undefined:', account);
        }
      } catch (sessionError) {
        console.error(`Error clearing storage data for partition: ${account.partition}`, sessionError);
      }
    }

    fs.writeFileSync(accountFilePath, JSON.stringify([]));
    console.log('All accounts cleared');
  } catch (error) {
    console.error('Error clearing all accounts:', error);
  }
});

ipcMain.handle('logout', async () => {
  try {

    // Step 2: Remove the accounts file if it exists
    if (fs.existsSync(accountFilePath)) {
      fs.unlinkSync(accountFilePath);
      console.log('Accounts file removed.');
    }

    // Step 3: Clear storage data from the shared session partition
    // const sharedSession = session.fromPartition('persist:shared-session');
    // await sharedSession.clearStorageData();
    // await sharedSession.clearCache();
    console.log('Cleared storage data from the shared session partition.');

    // Optional: Send a callback message to the frontend if necessary
    // mainWindow.webContents.send('logout-callback', { success: true });
    console.log('Logout successful.');

  } catch (error) {
    console.error('Failed to logout:', error);
    // mainWindow.webContents.send('logout-callback', { success: false, error: error.message });
  }
});

function loadAccounts() {
  if (fs.existsSync(accountFilePath)) {
    const data = fs.readFileSync(accountFilePath);
    const accounts = JSON.parse(data);
    console.log('Loaded Accounts from File:', accounts.map(account => account.id));
    return accounts;
  }
  return [];
}


// Load data from accounts.json
ipcMain.handle('loadData', async () => {
  try {
    if (fs.existsSync(accountFilePath)) {
      const data = fs.readFileSync(accountFilePath, 'utf-8');
      return JSON.parse(data);
    }
    return { dropdownData: {}, tabs: [] };
  } catch (error) {
    console.error('Failed to load data:', error);
    return { dropdownData: {}, tabs: [] };
  }
});

// Save data to accounts.json
ipcMain.on('saveData', (event, data) => {
  try {
    fs.writeFileSync(accountFilePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Failed to save data:', error);
  }
});




async function isGoogleAccountLoggedIn() {
  try {
    // Use the session from the shared session partition or default session
    const googleCookies = await session
      .fromPartition('persist:shared-session') // Replace with `session.defaultSession` if necessary
      .cookies.get({ domain: '.google.com' });

    // Check for common Google login cookies
    console.log(googleCookies)
    const isLoggedIn = googleCookies.some(
      (cookie) => cookie.name === 'SID' || cookie.name === 'LSID' || cookie.name === 'SSID'
    );

    return isLoggedIn;
  } catch (error) {
    console.error('Failed to check Google account login status:', error);
    return false;
  }
}

// IPC handler to check if Google account is logged in
ipcMain.handle('get-google-account', async () => {
  try {
    const loggedIn = await isGoogleAccountLoggedIn();
    return loggedIn; // Returns true if logged in, false otherwise
  } catch (error) {
    console.error('Error in get-google-account handler:', error);
    return false;
  }
});





// Function to load LinkedIn accounts from LinkedinData.json
function loadLinkedinAccounts() {
  if (fs.existsSync(linkedinDataFilePath)) {
    const data = fs.readFileSync(linkedinDataFilePath, 'utf-8');
    const accounts = JSON.parse(data);
    console.log('Loaded LinkedIn Accounts from File:', accounts.map(account => account.id));
    return accounts;
  }
  return [];
}

// Function to save LinkedIn accounts to LinkedinData.json
function saveLinkedinAccounts(accounts) {
  try {
    fs.writeFileSync(linkedinDataFilePath, JSON.stringify(accounts, null, 2));
    console.log('LinkedIn Accounts saved successfully.');
  } catch (error) {
    console.error('Failed to save LinkedIn accounts:', error);
  }
}

// IPC handler to get LinkedIn accounts
ipcMain.handle('getLinkedinAccounts', async () => {
  try {
    const linkedinAccounts = loadLinkedinAccounts();
    return linkedinAccounts;
  } catch (error) {
    console.error('Failed to fetch LinkedIn accounts:', error);
    return [];
  }
});

// IPC handler to save LinkedIn accounts
ipcMain.handle('saveLinkedinAccounts', async (event, updatedAccounts) => {
  try {
    saveLinkedinAccounts(updatedAccounts);
    return { success: true };
  } catch (error) {
    console.error('Failed to save LinkedIn accounts:', error);
    return { success: false, error: error.message };
  }
});



// Function to load Google Sheet accounts from accounts.json
function loadSheetAccounts() {
  if (fs.existsSync(accountFilePath)) {
    const data = fs.readFileSync(accountFilePath, 'utf-8');
    const accounts = JSON.parse(data);
    console.log('Loaded Google Sheet Accounts from File:', accounts.map(account => account.id));
    return accounts;
  }
  return [];
}

// IPC handler to get Google Sheet accounts
ipcMain.handle('getSheetAccounts', async () => {
  try {
    const sheetAccounts = loadSheetAccounts();
    return sheetAccounts;
  } catch (error) {
    console.error('Failed to fetch Google Sheet accounts:', error);
    return [];
  }
});

// Example of how you can save the accounts back to the file
ipcMain.handle('saveSheetsAccounts', async (event, updatedAccounts) => {
  try {
    fs.writeFileSync(accountFilePath, JSON.stringify(updatedAccounts, null, 2));
    console.log('Google Sheet Accounts saved successfully.');
    return { success: true };
  } catch (error) {
    console.error('Failed to save Google Sheet accounts:', error);
    return { success: false, error: error.message };
  }
});




ipcMain.on('open-profile', (event, { url, id }) => {
  console.log(`Opening : ${url} and ID: ${id}`);
  // Send a notification back to the renderer process
  console.log(url)
  sendProfileNotification(url, id);
});


function sendProfileNotification(url, id) {
  mainWindow.webContents.send('profile-notification', { url, id });

}


ipcMain.on('add-label',(event, {code, id, name})=>{
  console.log(`the code for the account id is ${code} and id ${id}`);
  mainWindow.webContents.send('open-label', {code, id, name});
})
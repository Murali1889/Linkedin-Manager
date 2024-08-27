const { app, BrowserWindow, ipcMain, session, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const fs = require('fs');
const path = require('path');

const accountFilePath = path.join(app.getPath('userData'), 'accounts.json');
const tokensFilePath = path.join(app.getPath('userData'), 'tokens.json');
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
      nativeWindowOpen: true
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

  mainWindow.webContents.on("console-message", (evt, logLevel, message, lineNumber, source) => {
    console.log(message)
    if (isJsonString(message) && message.includes('"request"')) {
      let jsn = JSON.parse(message);

      if (jsn.request === 'notification') {
        console.log(`Notification received from WebView with id ${jsn.id}: ${jsn.notification}`);
        // Handle the notification here as needed
        new Notification({ title: 'New Message', body: jsn.notification }).show();
      }
    }
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
      autoUpdater.quitAndInstall();
    });
  });

  autoUpdater.on('error', (error) => {
    console.error('Update error:', error);
  });
}

app.on('ready', () => {
  createWindow();
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (Notification.isSupported()) {
    new Notification({ title: 'App Ready', body: 'The app is ready.' }).show();
  } else {
    console.log('Notifications are not supported on this platform.');
  }
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
    if (fs.existsSync(tokensFilePath)) {
      fs.unlinkSync(tokensFilePath);
    }
    const defaultSession = session.defaultSession;
    await defaultSession.clearStorageData();
    await defaultSession.clearCache();
    mainWindow.webContents.send('logout-callback', {});
  } catch (error) {
    console.error('Failed to logout:', error);
  }
});

ipcMain.handle('delete-account', async (event, id) => {
  if (!id) {
    throw new Error('Invalid account ID');
  }
  const accounts = loadAccounts().filter(account => account.id !== id);
  const account = loadAccounts().find(account => account.id === id);
  if (account) {
    const ses = session.fromPartition(account.partition);
    await ses.clearStorageData();
  }
  fs.writeFileSync(accountFilePath, JSON.stringify(accounts));
  return accounts;
});


ipcMain.handle('clear-app-data', async () => {
  const userDataPath = app.getPath('userData');

  try {
    // Clear session storage
    const defaultSession = session.defaultSession;
    await defaultSession.clearStorageData();
    await defaultSession.clearCache();

    // Remove user data directory
    fs.rmdirSync(userDataPath, { recursive: true });

    return { success: true };
  } catch (error) {
    console.error('Failed to clear app data:', error);
    return { success: false, error: error.message };
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

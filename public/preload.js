const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  startAuth: () => ipcRenderer.send('auth-start'),
  addAccount: () => ipcRenderer.invoke('create-view'),
  saveName: (data) => ipcRenderer.send('save-name', data),
  saveAccounts: (accounts) => ipcRenderer.send('save-accounts', accounts),
  loadAccounts: () => ipcRenderer.invoke('load-accounts'),
  clearAllAccounts: () => ipcRenderer.invoke('clear-all-accounts'),
  deleteAccount: (id) => ipcRenderer.invoke('delete-account', id),
  invoke: (channel, data) => ipcRenderer.invoke(channel, data),
  on: (channel, callback) => ipcRenderer.on(channel, callback),
  saveUser: (user) => ipcRenderer.invoke('save-user', user),
  loadUser: () => ipcRenderer.invoke('load-user'),
  clearUser: () => ipcRenderer.invoke('clear-user'),
  loadData: () => ipcRenderer.invoke('loadData'),
  saveData: (data) => ipcRenderer.send('saveData', data),
  browserView: (sheetId, sheetUrl) => ipcRenderer.send('load-sheet',{sheetId, sheetUrl}),
  logOut: () => ipcRenderer.invoke('logout'),
  getGoogleAccount: () => ipcRenderer.invoke('get-google-account'),
  openGoogleLogin: ()=> ipcRenderer.invoke('open-google-login'),
  getLinkedinAccounts: () => ipcRenderer.invoke('getLinkedinAccounts'),
  saveLinkedinAccounts: (accounts) => ipcRenderer.invoke('saveLinkedinAccounts', accounts),
  saveSheetsAccounts: (accounts)=> ipcRenderer.invoke('saveSheetsAccounts',accounts),
  getSheetAccounts: ()=> ipcRenderer.invoke('getSheetAccounts'),
  addLabel: (code, id, name) => ipcRenderer.send('add-label',{code, id, name}),
  openProfile: (url, id) => ipcRenderer.send('open-profile', {url, id}),
  openUrlFromSheet: (url, sheet) => ipcRenderer.send('open-sheet-url',{url, sheet}),
  removeLabel: (labelName, code, name) => ipcRenderer.send('remove-label',{labelName, code, name}),
  onProfileNotification: (callback) => ipcRenderer.on('profile-notification', (event, data) => {
    console.log('Data received from main:', data); // Debugging line
    callback(data);
  }),
  onSheetUrlOpen: (callback) => ipcRenderer.on('opening-sheet-url',(event, data)=>{
    console.log('Data received from main:', data); // Debugging line
    callback(data);
  }),
  onRemoveLable: (callback) => ipcRenderer.on('removed-label', (event, data)=>{
    callback(data);
  }),
  onAddLabel: (callback) => ipcRenderer.on('open-label', (event, data) => {
    console.log('Data received from main:', data); // Debugging line
    callback(data);
  }),
});

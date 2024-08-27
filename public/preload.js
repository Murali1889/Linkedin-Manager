const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  startAuth: () => ipcRenderer.send('auth-start'),
  addAccount: () => ipcRenderer.invoke('create-view'),
  saveName: (data) => ipcRenderer.send('save-name', data),
  saveAccounts: (accounts) => ipcRenderer.send('save-accounts', accounts),
  loadAccounts: () => ipcRenderer.invoke('load-accounts'),
  clearAllAccounts: () => ipcRenderer.invoke('clear-all-accounts'),
  logout: () => ipcRenderer.invoke('logout'),
  deleteAccount: (id) => ipcRenderer.invoke('delete-account', id),
  onLogout: (callback) => ipcRenderer.on('logout-callback', callback),
  invoke: (channel, data) => ipcRenderer.invoke(channel, data),
  on: (channel, callback) => ipcRenderer.on(channel, callback),
  saveUser: (user) => ipcRenderer.invoke('save-user', user),
  loadUser: () => ipcRenderer.invoke('load-user'),
  clearUser: () => ipcRenderer.invoke('clear-user'),
});

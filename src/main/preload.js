const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  loadIssues: () => ipcRenderer.invoke('load-issues'),
  saveIssues: (issues) => ipcRenderer.invoke('save-issues', issues),
  selectFile: () => ipcRenderer.invoke('select-file'),
  openPhoto: (filename) => ipcRenderer.invoke('open-photo', filename),
  showPhotoFullscreen: (filename) => ipcRenderer.invoke('show-photo-fullscreen', filename),
  getPhotoBase64: (filename) => ipcRenderer.invoke('get-photo-base64', filename),
  getAvatarBase64: (filename) => ipcRenderer.invoke('get-avatar-base64', filename),
  checkInternet: () => ipcRenderer.invoke('check-internet'),
  saveTeardownReport: (report) => ipcRenderer.invoke('save-teardown-report', report),
  loadTeardownReports: () => ipcRenderer.invoke('load-teardown-reports'),


  // Добавляем новые мосты для работы с пользователями:
  getCurrentUser: () => ipcRenderer.invoke('get-current-user'), // получить того, кто за компом
  getAllUsers: () => ipcRenderer.invoke('get-all-users')       // получить вообще весь список из users.js
});

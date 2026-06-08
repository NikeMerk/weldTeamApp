const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const BASE_DIR = path.join('I:', 'Production', 'Welding', 'dataAppWelding');

// KTM (задачи)
const KTM_DATA_PATH = path.join(BASE_DIR, 'ktm', 'issues.json');
const KTM_PHOTO_DIR = path.join(BASE_DIR, 'ktm', 'photos');

// TEARDOWN
const TEARDOWN_DATA_PATH = path.join(BASE_DIR, 'teardown', 'teardown.json');
const TEARDOWN_PHOTO_DIR = path.join(BASE_DIR, 'teardown', 'photos');

// USERS
const AVATARS_DIR = path.join(BASE_DIR, 'userPhoto');
const USERS_JSON_PATH = path.join(BASE_DIR, 'users.json');

let mainWindow = null;
let reloadTimer = null;
let lastSaveTime = 0;
let teardownReloadTimer = null;
let lastTeardownSaveTime = 0;

// ========== СЛЕЖЕНИЕ ЗА ФАЙЛАМИ ==========
function watchIssuesFile() {
  if (!fs.existsSync(KTM_DATA_PATH)) return;

  fs.watch(KTM_DATA_PATH, (eventType) => {
    if (eventType !== 'change') return;
    if (Date.now() - lastSaveTime < 500) return;

    if (reloadTimer) clearTimeout(reloadTimer);
    reloadTimer = setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        console.log('🔄 Файл KTM изменился, уведомляем рендер...');
        mainWindow.webContents.send('issues-file-changed');
      }
      reloadTimer = null;
    }, 300);
  });
}

function watchTeardownFile() {
  if (!fs.existsSync(TEARDOWN_DATA_PATH)) return;

  fs.watch(TEARDOWN_DATA_PATH, (eventType) => {
    if (eventType !== 'change') return;
    if (Date.now() - lastTeardownSaveTime < 500) return;

    if (teardownReloadTimer) clearTimeout(teardownReloadTimer);
    teardownReloadTimer = setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        console.log('🔄 Файл TEARDOWN изменился, уведомляем рендер...');
        mainWindow.webContents.send('teardown-file-changed');
      }
      teardownReloadTimer = null;
    }, 300);
  });
}

// ========== IPC ОБРАБОТЧИКИ ==========
ipcMain.handle('get-avatar-base64', async (event, filename) => {
  try {
    if (!filename) return null;
    let filePath = path.join(AVATARS_DIR, filename);
    if (!fs.existsSync(filePath)) {
      const upperFilename = filename.replace(/\.jpg$/, '.JPG').replace(/\.jpeg$/, '.JPEG');
      filePath = path.join(AVATARS_DIR, upperFilename);
    }
    if (fs.existsSync(filePath)) {
      const base64 = fs.readFileSync(filePath, 'base64');
      return `data:image/jpeg;base64,${base64}`;
    }
    return null;
  } catch (err) {
    console.error('[IMAGE] Ошибка:', err);
    return null;
  }
});

ipcMain.handle('get-current-user', async () => identifyCurrentUser());
ipcMain.handle('get-all-users', async () => loadUsersFromDisk());

ipcMain.handle('get-photo-base64', async (event, filename) => {
  try {
    const filePath = path.join(KTM_PHOTO_DIR, filename);
    if (!fs.existsSync(filePath)) return null;
    return `data:image/jpeg;base64,${fs.readFileSync(filePath, 'base64')}`;
  } catch (err) {
    return null;
  }
});

ipcMain.handle('load-issues', async () => loadIssues());
ipcMain.handle('save-issues', async (event, issues) => {
  return { success: saveIssues(issues) };
});

ipcMain.handle('select-file', async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['jpg', 'png', 'jpeg', 'gif'] }]
    });
    if (result.canceled || result.filePaths.length === 0) return null;

    const filePath = result.filePaths[0];
    const base64 = fs.readFileSync(filePath, 'base64');
    const filename = Date.now() + '_' + path.basename(filePath);
    await savePhotoFile(`data:image/jpeg;base64,${base64}`, filename);
    return { base64: `data:image/jpeg;base64,${base64}`, filename: filename };
  } catch (err) {
    console.error(err);
    return null;
  }
});

ipcMain.handle('check-internet', async () => {
  try {
    const { exec } = require('child_process');
    return new Promise((resolve) => {
      exec('ping -n 1 8.8.8.8', (error) => resolve(!error));
    });
  } catch (err) {
    return false;
  }
});

// ========== TEARDOWN REPORTS ==========
ipcMain.handle('load-teardown-reports', async () => {
  try {
    if (fs.existsSync(TEARDOWN_DATA_PATH)) {
      return JSON.parse(fs.readFileSync(TEARDOWN_DATA_PATH, 'utf-8'));
    }
  } catch (err) {
    console.error('Ошибка чтения teardown.json:', err);
  }
  return [];
});

ipcMain.handle('save-teardown-report', async (event, report) => {
  try {
    let reports = [];
    if (fs.existsSync(TEARDOWN_DATA_PATH)) {
      reports = JSON.parse(fs.readFileSync(TEARDOWN_DATA_PATH, 'utf-8'));
    }

    // Найти индекс отчёта с таким же id
    const index = reports.findIndex(r => r.id === report.id);
    if (index !== -1) {
      reports[index] = report; // обновить существующий
    } else {
      reports.push(report); // добавить новый
    }

    // Сохранить в файл
    const dir = path.dirname(TEARDOWN_DATA_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(TEARDOWN_DATA_PATH, JSON.stringify(reports, null, 2));

    // Обновить время последнего сохранения (если используется watch)
    lastTeardownSaveTime = Date.now();

    return { success: true };
  } catch (err) {
    console.error('Ошибка сохранения teardown.json:', err);
    return { success: false, error: err.message };
  }
});

// ========== РАБОТА С ПОЛЬЗОВАТЕЛЯМИ ==========
function loadUsersFromDisk() {
  try {
    if (fs.existsSync(USERS_JSON_PATH)) {
      const data = fs.readFileSync(USERS_JSON_PATH, 'utf-8');
      const users = JSON.parse(data);
      if (!Array.isArray(users)) return [];
      if (users.length === 1 && users[0] && users[0].default) return [];
      return users;
    }
  } catch (err) {
    console.error('[DATABASE] Ошибка чтения users.json:', err);
  }
  return [];
}

function saveUsersToDisk(users) {
  try {
    fs.writeFileSync(USERS_JSON_PATH, JSON.stringify(users, null, 2));
    return true;
  } catch (err) {
    console.error('[DATABASE] Ошибка записи users.json:', err);
    return false;
  }
}

function identifyCurrentUser() {
  try {
    const currentWindowsLogin = os.userInfo().username.toLowerCase();
    console.log(`[AUTH] Подключение: ${currentWindowsLogin}`);
    const usersList = loadUsersFromDisk();
    let identifiedUser = usersList.find(user => user.windowsLogin?.toLowerCase() === currentWindowsLogin);

    if (!identifiedUser) {
      console.log(`[AUTH] Авто-регистрация: ${currentWindowsLogin}`);
      identifiedUser = {
        windowsLogin: currentWindowsLogin,
        avatarUrl: 'default.jpg',
        name: `Сотрудник (${currentWindowsLogin})`,
        position: 'Заводской персонал',
        phoneLink: '',
        phoneText: 'Номер не указан'
      };
      usersList.push(identifiedUser);
      saveUsersToDisk(usersList);
    }
    return identifiedUser;
  } catch (error) {
    console.error('[AUTH] Ошибка:', error);
    return { name: 'Ошибка системы', position: 'Неизвестно', avatarUrl: 'default.jpg' };
  }
}

// ========== РАБОТА С ФАЙЛАМИ KTM ==========
async function savePhotoFile(base64, filename) {
  const dir = KTM_PHOTO_DIR;
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, filename);
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
  fs.writeFileSync(filePath, base64Data, 'base64');
  return filename;
}

function loadIssues() {
  try {
    if (fs.existsSync(KTM_DATA_PATH)) {
      return JSON.parse(fs.readFileSync(KTM_DATA_PATH, 'utf-8'));
    }
  } catch (err) {
    console.error(err);
  }
  return [];
}

function saveIssues(issues) {
  lastSaveTime = Date.now();
  try {
    const dir = path.dirname(KTM_DATA_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(KTM_DATA_PATH, JSON.stringify(issues, null, 2));
    return true;
  } catch (err) {
    return false;
  }
}

// ========== ОКНО ==========
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, '../render/index.html'));
  mainWindow.webContents.openDevTools();

  // Ждём, когда окно полностью загрузится, и только потом запускаем слежение
  mainWindow.on('ready-to-show', () => {
    watchIssuesFile();
    watchTeardownFile();
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
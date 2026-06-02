const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const BASE_DIR = path.join('I:', 'Production', 'Welding', 'dataAppWelding');
const DATA_PATH = path.join(BASE_DIR, 'issues.json');       // Файл задач
const PHOTO_DIR = path.join(BASE_DIR, 'photos');            // Папка для фото дефектов
const AVATARS_DIR = path.join(BASE_DIR, 'userPhoto');       // Папка для аватарок сотрудников
const USERS_JSON_PATH = path.join(BASE_DIR, 'users.json');  // Путь к вашей базе в JSON
let mainWindow = null;
let reloadTimer = null;
let lastSaveTime = 0;

function watchIssuesFile() {
  if (!fs.existsSync(DATA_PATH)) return;

  fs.watch(DATA_PATH, (eventType) => {
    if (eventType !== 'change') return;

    // Защита от своего сохранения (игнорируем 500 мс после нашего save)
    if (Date.now() - lastSaveTime < 500) return;

    // Debounce: ждём 300 мс, прежде чем сказать рендеру
    if (reloadTimer) clearTimeout(reloadTimer);
    reloadTimer = setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        console.log('🔄 Файл изменился, уведомляем рендер...');
        mainWindow.webContents.send('issues-file-changed');
      }
      reloadTimer = null;
    }, 300);
  });
}


ipcMain.handle('get-avatar-base64', async (event, filename) => {
  try {
    if (!filename) return null;

    console.log(`\n--- [DEBUG] Ищу аватарку для файла: "${filename}" ---`);
    console.log(`Базовая папка аватарок (AVATARS_DIR): "${AVATARS_DIR}"`);

    // 1. Проверяем путь с маленькими буквами
    let filePath = path.join(AVATARS_DIR, filename);
    console.log(`Проверяю путь №1 (.jpg): "${filePath}" -> Существует?: ${fs.existsSync(filePath)}`);

    // 2. Если файла нет, проверяем с БОЛЬШИМИ БУКВЫМИ (.JPG)
    if (!fs.existsSync(filePath)) {
      const upperFilename = filename.replace(/\.jpg$/, '.JPG').replace(/\.jpeg$/, '.JPEG');
      filePath = path.join(AVATARS_DIR, upperFilename);
      console.log(`Проверяю путь №2 (.JPG): "${filePath}" -> Существует?: ${fs.existsSync(filePath)}`);
    }

    // 3. Если файл нашелся, читаем его
    if (fs.existsSync(filePath)) {
      console.log(`✅ УСПЕХ! Файл найден, отправляю на страницу.\n`);
      const base64 = fs.readFileSync(filePath, 'base64');
      return `data:image/jpeg;base64,${base64}`;
    }

    console.log(`❌ ОШИБКА! Ни один файл не найден на диске I.\\\n`);
    return null;
  } catch (err) {
    console.error('[IMAGE] Критическая ошибка отладки:', err);
    return null;
  }
});

// 2. Определение зашедшего пользователя по Windows-логину
ipcMain.handle('get-current-user', async () => {
  return identifyCurrentUser();
});

// 3. Получение всего списка пользователей для вкладки Контакты
ipcMain.handle('get-all-users', async () => {
  return loadUsersFromDisk();
});

// 4. Чтение картинок-дефектов из папки photos
ipcMain.handle('get-photo-base64', async (event, filename) => {
  try {
    const filePath = path.join(PHOTO_DIR, filename);
    if (!fs.existsSync(filePath)) return null;
    return `data:image/jpeg;base64,${fs.readFileSync(filePath, 'base64')}`;
  } catch (err) {
    return null;
  }
});

// 5. Загрузка задач
ipcMain.handle('load-issues', async () => loadIssues());

// 6. Сохранение задач
ipcMain.handle('save-issues', async (event, issues) => {

  return { success: saveIssues(issues) };
});

// 7. Выбор и сохранение файла дефекта через диалоговое окно
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
      exec('ping -n 1 8.8.8.8', (error) => {
        resolve(!error); // true если пинг прошёл
      });
    });
  } catch (err) {
    return false;
  }
});

// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ (ЛОГИКА И ЧТЕНИЕ ДИСКА)

function loadUsersFromDisk() {
  try {
    if (fs.existsSync(USERS_JSON_PATH)) {
      const data = fs.readFileSync(USERS_JSON_PATH, 'utf-8');
      const users = JSON.parse(data);

      // если в файле оказался не массив (например, объект default) — не загружаем, возвращаем []
      if (!Array.isArray(users)) {
        console.error('[DATABASE] users.json содержит не массив, а:', typeof users);
        return [];
      }

      // проверка: если единственный элемент и он — default-заглушка, тоже возвращаем []
      if (users.length === 1 && users[0] && users[0].default) {
        console.warn('[DATABASE] В users.json только объект default. Возвращаем пустой массив.');
        return [];
      }

      return users;
    }
  } catch (err) {
    console.error('[DATABASE] Ошибка чтения базы пользователей:', err);
  }
  // если файла нет — возвращаем пустой массив (но НЕ СОХРАНЯЕМ)
  return [];
}

function saveUsersToDisk(users) {
  try {
    fs.writeFileSync(USERS_JSON_PATH, JSON.stringify(users, null, 2));
    return true;
  } catch (err) {
    console.error('[DATABASE] Ошибка записи базы пользователей:', err);
    return false;
  }
}

function identifyCurrentUser() {
  try {
    const currentWindowsLogin = os.userInfo().username.toLowerCase();
    console.log(`[AUTH] Подключение с компьютера: ${currentWindowsLogin}`);

    const usersList = loadUsersFromDisk();
    let identifiedUser = usersList.find(user => user.windowsLogin.toLowerCase() === currentWindowsLogin);

    if (!identifiedUser) {
      console.log(`[AUTH] Авто-регистрация нового логина: ${currentWindowsLogin}`);
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

async function savePhotoFile(base64, filename) {
  const dir = PHOTO_DIR;
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, filename);
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
  fs.writeFileSync(filePath, base64Data, 'base64');
  return filename;
}

function loadIssues() {
  try { if (fs.existsSync(DATA_PATH)) return JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8')); }
  catch (err) { console.error(err); }
  return [];
}

function saveIssues(issues) {
  lastSaveTime = Date.now();
  try {
    const dir = path.dirname(DATA_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_PATH, JSON.stringify(issues, null, 2));
    return true;
  } catch (err) { return false; }
}

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

  // Загружаем index.html из папки render
  mainWindow.loadFile(path.join(__dirname, '../render/index.html'));

  // Открываем DevTools (удобно для отладки)
  mainWindow.webContents.openDevTools();

  // 👇 ЭТО НОВОЕ — запускаем слежение за файлом
  setTimeout(() => watchIssuesFile(), 1000);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

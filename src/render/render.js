import { todoList } from "../App/todo/todo.js";
import { createContacts, createHeaderContent } from "../App/domComponents/dom.js";
import { renderDashboard } from "../App/dashboard/dashboard.js"; // 👈 импорт дашборда
import { hideLoader, showLoader } from "./loader/loader.js";
import { createTableTearDown } from "../App/domComponents/tearDown/tearDown.js";
let updateTimer = null;
// ========== ПРОВЕРКА ИНТЕРНЕТА ПРИ СТАРТЕ ==========
async function checkInternetAndWarn() {
  const hasInternet = await window.api.checkInternet();

  if (!hasInternet) {
    const warningDiv = document.createElement('div');
    warningDiv.textContent = '⚠️ Нет подключения к интернету. Синхронизация недоступна.';
    warningDiv.style.cssText = `
      position: fixed;
      top: 60px;
      left: 50%;
      transform: translateX(-50%);
      background: #ff9800;
      color: #000;
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: bold;
      z-index: 10000;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(warningDiv);

    // Удаляем через 5 секунд
    setTimeout(() => warningDiv.remove(), 5000);
  }

  return hasInternet;
}

// Функция, которая будет вызываться при изменении файла другим пользователем
window.setupLiveReload = () => {
  if (typeof window.api.onIssuesChanged === 'function') {
    window.api.onIssuesChanged(async () => {
      // Защита от частых вызовов (debounce)
      if (updateTimer) clearTimeout(updateTimer);
      updateTimer = setTimeout(async () => {
        console.log('🔄 [LIVE] Обновляем данные...');

        // 1. Загружаем свежие задачи
        const freshIssues = await window.api.loadIssues();

        // 2. Если есть глобальный массив задач — обновляем его
        if (window.listArray) {
          window.listArray.length = 0;
          window.listArray.push(...freshIssues);
        }

        // 3. Перерисовываем todoList, если он открыт
        if (typeof window.update === 'function') {
          window.update();
        }

        // 4. Обновляем дашборд, если он открыт
        if (typeof window.refreshDashboardIfNeeded === 'function') {
          window.refreshDashboardIfNeeded();
        }

        updateTimer = null;
      }, 200);
    });
  } else {
    console.warn('⚠️ [LIVE] window.api.onIssuesChanged не найден. Проверь preload.js');
  }
};
// Создаём функцию обновления дашборда
window.refreshDashboardIfNeeded = async () => {
  const mainContainer = document.querySelector(".main-container");
  const isDashboardOpen = mainContainer && mainContainer.querySelector('.dashboard-container');

  if (isDashboardOpen) {
    console.log('🔄 Дашборд открыт, обновляем...');
    const freshIssues = await window.api.loadIssues();
    const freshUsers = await window.api.getAllUsers();
    await renderDashboard(mainContainer, freshIssues, freshUsers);
  }
};
async function initApp() {
  // Показываем лоадер при старте
  showLoader('Загрузка приложения...');
  const isOnline = await checkInternetAndWarn();
  const btnProblems = document.getElementById("button-nav-problems");
  const btnContacts = document.getElementById("button-nav-contacts");
  const btnTearDown = document.getElementById("button-nav-tear-down")
  const mainContainer = document.querySelector(".main-container");

  try {
    const [currentUser, usersData, issues] = await Promise.all([
      window.api.getCurrentUser(),
      window.api.getAllUsers(),
      window.api.loadIssues()
    ]);

    await createHeaderContent(currentUser);

    // 🚀 Показываем дашборд при старте
    await renderDashboard(mainContainer, issues, usersData);

    btnProblems.onclick = () => {
      document.body.classList.remove('dashboard-active');
      if (mainContainer) mainContainer.innerHTML = "";
      todoList();
    };

    btnTearDown.onclick = () => {
      document.body.classList.remove('dashboard-active');
      if (mainContainer) mainContainer.innerHTML = "";
      createTableTearDown(mainContainer, [
        {
          model: "T13J",
          config: "2WD/STD",
          area: "RF",
          station: "M0090",
          equipment: "R2",
          pointNum: "48010", // Передаем чистый номер
          importance: "Важно",
          defectType: "Непровар / Разделение (Separation)",
          details: "Деталь поставщика"
        },
        {
          model: "T13J",
          config: "2WD/STD",
          area: "MB",
          station: "M0010",
          equipment: "R1",
          pointNum: "10707",
          importance: "Обычный",
          defectType: "Малая точка / Small nugget",
          details: ""
        }
      ])
    }

    btnContacts.onclick = () => {
      document.body.classList.remove('dashboard-active');
      if (mainContainer) mainContainer.innerHTML = "";
      createContacts(usersData);
    };

  } catch (error) {
    console.error("Ошибка при инициализации приложения:", error);
  } finally {
    hideLoader();
  }

  window.setupLiveReload();
}
// Запускаем всё наше приложение одной строкой
initApp();
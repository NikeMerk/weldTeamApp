import { todoList } from "../App/todo/todo.js";
import { createContacts, createHeaderContent } from "../App/domComponents/dom.js";
import { renderDashboard } from "../App/dashboard/dashboard.js"; // 👈 импорт дашборда
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
  topbar.show();
  try {
    const [currentUser, usersData, issues] = await Promise.all([
      window.api.getCurrentUser(),
      window.api.getAllUsers(),
      window.api.loadIssues()   // 👈 загружаем задачи для дашборда
    ]);

    await createHeaderContent(currentUser);
    const mainContainer = document.querySelector(".main-container");

    // 🚀 Показываем дашборд при старте
    await renderDashboard(mainContainer, issues, usersData);

    // Кнопка "Проблемы" — переключаем на todoList
    const btnProblems = document.getElementById("button-nav-problems");
    if (btnProblems) {
      btnProblems.onclick = () => {
        document.body.classList.remove('dashboard-active');
        if (mainContainer) mainContainer.innerHTML = "";
        todoList();
      };
    }

    // Кнопка "Контакты" — переключаем на контакты
    const btnContacts = document.getElementById("button-nav-contacts");
    if (btnContacts) {
      btnContacts.onclick = () => {
        document.body.classList.remove('dashboard-active');
        if (mainContainer) mainContainer.innerHTML = "";
        topbar.show();
        try {
          createContacts(usersData);
        } finally {
          topbar.hide();
        }
      };
    }
  } catch (error) {
    console.error("Ошибка при инициализации приложения:", error);
  } finally {
    topbar.hide();
  }
}

initApp();

// Запускаем всё наше приложение одной строкой
initApp();
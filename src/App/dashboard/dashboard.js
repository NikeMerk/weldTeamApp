// src/App/dashboard/dashboard.js

export async function renderDashboard(container, listArray, usersData) {
  // Очищаем контейнер
  container.innerHTML = '';
  document.body.classList.add('dashboard-active');

  // 1. Считаем статистику
  const totalProblems = listArray.length;
  const solvedProblems = listArray.filter(task => task.done === true).length;
  const solvedThisWeek = listArray.filter(task => {
    if (!task.done) return false;
    const taskDate = new Date(task.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return taskDate >= weekAgo;
  }).length;
  const activeContacts = usersData.length;

  // 2. Прогресс-бар
  const progressPercent = totalProblems === 0 ? 0 : (solvedProblems / totalProblems) * 100;

  // 3. Группировка задач по дням (для графика)
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    const count = listArray.filter(task => {
      const taskDate = new Date(task.date);
      return taskDate.toDateString() === date.toDateString();
    }).length;
    last7Days.push({ date: dateStr, count });
  }

  // 4. HTML-вёрстка
  container.innerHTML = `
    <div class="dashboard-container">
      <h2 class="dashboard-title"> 
       Статистика работы
      <span class="icon-statistic"><span/>
      </h2>
      
      <div class="dashboard-cards">
        <div class="card">
          <div class="card-value">${totalProblems}</div>
          <div class="card-label">Всего проблем</div>
        </div>
        <div class="card">
          <div class="card-value">${solvedThisWeek}</div>
          <div class="card-label">Решено за неделю</div>
        </div>
      </div>

      <div class="dashboard-progress">
        <div class="progress-label">Выполнено задач: ${solvedProblems} из ${totalProblems}</div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progressPercent}%;"></div>
        </div>
      </div>

      <div class="dashboard-chart">
        <h3>Динамика проблем за неделю</h3>
        <div class="chart-bars">
          ${last7Days.map(day => `
            <div class="chart-column">
              <div class="chart-bar" style="height: ${day.count * 30}px;"></div>
              <div class="chart-label">${day.date}</div>
              <div class="chart-count">${day.count}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}
import { stationModels, extraSelectsConfig, stationRobots } from "../api/dataArray.js";
import { createSect, createList, createForm, createItem, createFilters, createTitleTodo } from "../domComponents/dom.js";

let currentPhotos = null;

// 👇 ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ СЖАТИЯ ФОТО (Canvas)


async function createTodoApp(container, listArray, updateCallback) {
  const user = await window.api.getCurrentUser();

  const startList = createList();
  const startForm = createForm();
  const startTitle = createTitleTodo();
  const { form, input, button, buttonPhoto } = startForm;
  const { container: selectsContainer } = createSect();

  const filterDiv = createFilters();
  selectsContainer.appendChild(filterDiv);

  container.append(startTitle, selectsContainer, startForm.form, startList);

  // 👇 ОБНОВЛЕННАЯ СТРАТЕГИЯ ВЫБОРА И СЖАТИЯ ФОТО
  buttonPhoto.onclick = async () => {
    const result = await window.api.selectFiles('ktm');
    if (result && result.length > 0) {
      currentPhotos = result.map(f => f.filename);
      buttonPhoto.textContent = `📸 (${currentPhotos.length}) фото `;
      buttonPhoto.style.background = '#4caf50';
    }
  };


  const loaded = await window.api.loadIssues();
  listArray.length = 0;
  listArray.push(...loaded);
  for (let elem of listArray) {
    startList.append(createItem(elem, listArray).item);
  }

  const typeFilter = document.querySelector('#filter-type');
  const dateFilter = document.querySelector('#filter-date');

  function update() {
    renderFilteredList(listArray, startList, typeFilter.value, dateFilter.value, listArray);
  }

  window.update = update;
  if (updateCallback) updateCallback(update);

  startForm.button.onclick = async (e) => {
    e.preventDefault();
    const inputValue = startForm.input.value.trim();
    if (!inputValue) return;

    const mainSelect = document.querySelector('#todo-select');
    const selectedMain = mainSelect ? mainSelect.value : '';

    let description = '';

    if (selectedMain === 'Robot') {
      const robotNumberSelect = document.querySelector('#robot_number');
      const stationModelSelect = document.querySelector('#station_model');

      const robotNumber = robotNumberSelect ? robotNumberSelect.value : '';
      const stationModel = stationModelSelect ? stationModelSelect.value : '';

      description = `${stationModel}`;
      if (robotNumber) description += `-R${robotNumber}`;
      description += ` : ${inputValue}`;

    } else if (selectedMain === 'Gun') {
      const gunStationSelect = document.getElementById("gun_station");
      const gunNumberSelect = document.getElementById("gun_number");

      const stationName = gunStationSelect ? gunStationSelect.options[gunStationSelect.selectedIndex]?.textContent : '';
      const gunNumber = gunNumberSelect ? gunNumberSelect.value : '';

      description = `${stationName}`;
      if (gunNumber) description += ` : Ган${gunNumber}`;
      description += ` : ${inputValue}`;

    } else if (selectedMain === 'coni ma') {
      const programSelect = document.querySelector('#program');
      const speedArmSelect = document.querySelector('#speed_arm');

      const program = programSelect ? programSelect.value : '';
      const speedArm = speedArmSelect ? speedArmSelect.value : '';

      description = `${speedArm}`;
      if (program) description += ` : ${program}`;
      description += ` : ${inputValue}`;
    }

    const newObj = {
      id: createSpecialId(listArray),
      name: description,
      done: false,
      date: new Date().toISOString(),
      type: selectedMain,
      photos: currentPhotos,
      authorId: user.windowsLogin,
      authorAvatar: user.avatarUrl || null
    };

    listArray.push(newObj);

    await window.api.saveIssues(listArray);
    if (typeof window.refreshDashboardIfNeeded === 'function') {
      window.refreshDashboardIfNeeded();
    }
    startForm.input.value = '';
    startForm.button.disabled = true;
    startForm.buttonPhoto.disabled = true;
    update();
    currentPhoto = null;
  };

  typeFilter.addEventListener('change', update);
  dateFilter.addEventListener('change', update);
  update();
}

export const todoList = async () => {
  let listArray = [];
  const container = document.querySelector('.main-container');
  if (!container) return;
  await createTodoApp(container, listArray);
};

function createSpecialId(arr) {
  let maxNumber = 0;
  for (let elem of arr) {
    if (elem.id > maxNumber) maxNumber = elem.id;
  }
  return maxNumber + 1;
}

function renderFilteredList(arr, startList, filterType, filterDate, listArray) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());

  const filtered = arr.filter(item => {
    const matchType = filterType === 'all' || item.type === filterType;
    let matchDate = true;
    const itemDate = new Date(item.date);
    if (filterDate === 'today') matchDate = itemDate >= todayStart;
    if (filterDate === 'week') matchDate = itemDate >= weekStart;
    return matchType && matchDate;
  });

  filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

  startList.innerHTML = '';
  filtered.forEach(obj => {
    startList.append(createItem(obj, listArray).item);
  });
}

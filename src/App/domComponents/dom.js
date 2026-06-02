import { extraSelectsConfig, stationModels, stationRobots, gunStations } from "../api/dataArray.js";
import { showLoader, hideLoader } from "../../render/loader/loader.js";


export const createTitleTodo = () => {
  const title = document.createElement("h2");
  title.classList.add("todo-title");
  title.textContent = "Проблемы/заметки:"
  return title
}

export const createSect = () => {
  const container = document.createElement('div');
  container.classList.add('selects-container');

  const blockLeft = document.createElement("div");
  const label = document.createElement('label');
  const select = document.createElement('select');
  const extraSelectsDiv = document.createElement('div');
  const option1 = document.createElement('option');
  const option2 = document.createElement('option');
  const option3 = document.createElement('option');

  label.setAttribute('for', 'todo-select');
  label.textContent = 'Раздел:';
  label.classList.add('todo-label');

  select.classList.add("todo-select", "select-style");
  blockLeft.classList.add("extra-select-wrapper");
  extraSelectsDiv.classList.add('extra-selects');
  select.id = 'todo-select';
  select.name = 'options';

  option1.value = 'Robot';
  option1.textContent = 'Robot';
  option1.selected = true;
  option2.value = 'Gun';
  option2.textContent = 'Gun';
  option3.value = 'coni ma';
  option3.textContent = 'coni ma';

  select.append(option1, option2, option3);

  function renderExtraSelects(robotType) {
    extraSelectsDiv.innerHTML = '';

    if (robotType === 'Robot') {
      // ===== ЛОГИКА ДЛЯ ROBOT (без изменений) =====
      const configs = extraSelectsConfig[robotType] || [];
      const orderedConfigs = [];
      let stationTypeSelect = null;
      let robotNumberConfig = null;

      blockLeft.append(label, select);
      extraSelectsDiv.appendChild(blockLeft);

      for (let cfg of configs) {
        if (cfg.id === 'robot_number') {
          robotNumberConfig = cfg;
        } else {
          orderedConfigs.push(cfg);
        }
      }
      if (robotNumberConfig) orderedConfigs.push(robotNumberConfig);

      orderedConfigs.forEach(config => {
        const wrapper = document.createElement('div');
        wrapper.classList.add('extra-select-wrapper');

        const lbl = document.createElement('label');
        lbl.textContent = config.label;
        lbl.classList.add('extra-label');

        const sel = document.createElement('select');
        sel.id = config.id;
        sel.classList.add('todo-select');

        config.options.forEach(opt => {
          const option = document.createElement('option');
          option.value = opt;
          option.textContent = opt;
          sel.appendChild(option);
        });

        if (config.id === 'station_type') {
          stationTypeSelect = sel;
          sel.addEventListener('change', (e) => {
            const selectedType = e.target.value;
            const modelSelect = extraSelectsDiv.querySelector('#station_model');
            if (modelSelect) {
              const models = stationModels[selectedType] || [];
              modelSelect.innerHTML = '';
              models.forEach(model => {
                const opt = document.createElement('option');
                opt.value = model;
                opt.textContent = model;
                modelSelect.appendChild(opt);
              });
              const firstModel = modelSelect.value;
              if (firstModel) {
                const robotSelect = extraSelectsDiv.querySelector('#robot_number');
                if (robotSelect) {
                  const robots = stationRobots[firstModel] || [];
                  robotSelect.innerHTML = '';
                  robots.forEach(robot => {
                    const opt = document.createElement('option');
                    opt.value = robot;
                    opt.textContent = robot;
                    robotSelect.appendChild(opt);
                  });
                }
              }
            }
          });
        }

        if (config.id === 'station_model') {
          sel.addEventListener('change', (e) => {
            const selectedModel = e.target.value;
            const robotSelect = extraSelectsDiv.querySelector('#robot_number');
            if (robotSelect) {
              const robots = stationRobots[selectedModel] || [];
              robotSelect.innerHTML = '';
              robots.forEach(robot => {
                const opt = document.createElement('option');
                opt.value = robot;
                opt.textContent = robot;
                robotSelect.appendChild(opt);
              });
            }
          });
        }

        wrapper.appendChild(lbl);
        wrapper.appendChild(sel);
        extraSelectsDiv.appendChild(wrapper);
      });

      if (stationTypeSelect && robotType === 'Robot') {
        const initialType = stationTypeSelect.value;
        const modelSelect = extraSelectsDiv.querySelector('#station_model');
        if (modelSelect) {
          const models = stationModels[initialType] || [];
          modelSelect.innerHTML = '';
          models.forEach(model => {
            const opt = document.createElement('option');
            opt.value = model;
            opt.textContent = model;
            modelSelect.appendChild(opt);
          });
          const firstModel = modelSelect.value;
          if (firstModel) {
            const robotSelect = extraSelectsDiv.querySelector('#robot_number');
            if (robotSelect) {
              const robots = stationRobots[firstModel] || [];
              robotSelect.innerHTML = '';
              robots.forEach(robot => {
                const opt = document.createElement('option');
                opt.value = robot;
                opt.textContent = robot;
                robotSelect.appendChild(opt);
              });
            }
          }
        }
      }
    }
    // ========== GUN (НОВОЕ, с импортированными данными) ==========
    else if (robotType === 'Gun') {
      blockLeft.append(label, select);
      extraSelectsDiv.appendChild(blockLeft);

      // Селект выбора станции
      const stationWrapper = document.createElement('div');
      stationWrapper.classList.add('extra-select-wrapper');
      const stationLabel = document.createElement('label');
      stationLabel.textContent = 'Станция:';
      stationLabel.classList.add('extra-label');
      const stationSelect = document.createElement('select');
      stationSelect.id = 'gun_station';
      stationSelect.classList.add('todo-select');

      gunStations.forEach(station => {
        const opt = document.createElement('option');
        opt.value = station.id;
        opt.textContent = station.name;
        stationSelect.appendChild(opt);
      });

      stationWrapper.appendChild(stationLabel);
      stationWrapper.appendChild(stationSelect);
      extraSelectsDiv.appendChild(stationWrapper);

      // Селект выбора номера гана
      const gunWrapper = document.createElement('div');
      gunWrapper.classList.add('extra-select-wrapper');
      const gunLabel = document.createElement('label');
      gunLabel.textContent = 'Номер гана:';
      gunLabel.classList.add('extra-label');
      const gunSelect = document.createElement('select');
      gunSelect.id = 'gun_number';
      gunSelect.classList.add('todo-select');

      gunWrapper.appendChild(gunLabel);
      gunWrapper.appendChild(gunSelect);
      extraSelectsDiv.appendChild(gunWrapper);

      // Функция обновления списка ганов при смене станции
      const updateGunNumbers = () => {
        const stationId = stationSelect.value;
        const station = gunStations.find(s => s.id === stationId);
        const guns = station ? station.guns : [];

        gunSelect.innerHTML = '';
        guns.forEach(gun => {
          const opt = document.createElement('option');
          opt.value = gun;
          opt.textContent = `Ган №${gun}`;
          gunSelect.appendChild(opt);
        });
      };

      stationSelect.addEventListener('change', updateGunNumbers);
      updateGunNumbers(); // заполнить при первом открытии
    }
    // ========== CONI MA (пока пусто) ==========
    else if (robotType === 'coni ma') {
      blockLeft.append(label, select);
      extraSelectsDiv.appendChild(blockLeft);
      // TODO: добавить логику для coni ma
    }
  }

  select.addEventListener('change', (event) => {
    renderExtraSelects(event.target.value);
  });

  renderExtraSelects('Robot');
  container.append(extraSelectsDiv);
  return { container, extraSelectsDiv };
};

// editModal.js
function openEditModal(task, onSave) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal-container';

  const title = document.createElement('h3');
  title.innerText = 'Редактировать задачу';

  const descLabel = document.createElement('label');
  descLabel.className = 'modal-label';
  descLabel.innerText = 'Описание:';

  const descInput = document.createElement('input');
  descInput.className = 'modal-input';
  descInput.value = task.name || '';

  const btnContainer = document.createElement('div');
  btnContainer.className = 'modal-buttons';

  const saveBtn = document.createElement('button');
  saveBtn.innerText = 'Сохранить';
  const cancelBtn = document.createElement('button');
  cancelBtn.innerText = 'Отмена';

  btnContainer.appendChild(saveBtn);
  btnContainer.appendChild(cancelBtn);
  modal.appendChild(title);
  modal.appendChild(descLabel);
  modal.appendChild(descInput);
  modal.appendChild(btnContainer);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  saveBtn.onclick = () => {
    const newName = descInput.value.trim();
    if (!newName) return;
    onSave({ ...task, name: newName });
    overlay.remove();
  };

  cancelBtn.onclick = () => overlay.remove();
}

export const createList = () => {
  const list = document.createElement('ul');
  list.classList.add('todo-list');
  return list;
};

export const createForm = () => {
  const form = document.createElement('form');
  const input = document.createElement('input');
  const button = document.createElement('button');
  const buttonPhoto = document.createElement('button');

  buttonPhoto.type = 'button';

  form.classList.add('todo-form');
  input.classList.add('todo-input');
  button.classList.add('todo-button');
  buttonPhoto.classList.add('todo-button-photo');

  input.placeholder = 'Опишите проблему';
  button.textContent = 'Добавить';
  buttonPhoto.title = 'Добавить фото';

  button.disabled = true;
  buttonPhoto.disabled = true;

  input.oninput = () => {
    buttonPhoto.disabled = !input.value.trim();
    button.disabled = !input.value.trim();
  };

  form.append(input, buttonPhoto, button);
  return { form, input, button, buttonPhoto };
};

export const createFilters = () => {
  const filterDiv = document.createElement('div');
  filterDiv.className = 'filter-container';
  filterDiv.innerHTML = `
  <span class="filter-span">Фильтры</span>
    <select id="filter-type" class="filter-select">
      <option value="all">Все типы</option>
      <option value="Robot">Robot</option>
      <option value="Gun">Gun</option>
      <option value="coni ma">coni ma</option>
    </select>
    <select id="filter-date" class="filter-select">
      <option value="all">Все даты</option>
      <option value="today">Сегодня</option>
      <option value="week">Эта неделя</option>
    </select>
  `;
  return filterDiv;
};

export const createItem = (obj, listArray) => {
  const item = document.createElement('li');
  const divIcon = document.createElement("div");
  const itemContent = document.createElement("div")
  const itemText = document.createElement('span');
  const itemBlock = document.createElement('div');
  const itemLeftBlock = document.createElement('div');
  const itemDate = document.createElement('div');
  const itemButtonShowPhoto = document.createElement("button")
  const itemButtonDone = document.createElement('button');
  const itemButtonChange = document.createElement('button');
  const itemButtonDelete = document.createElement('button');
  const divAutorItemPhoto = document.createElement("div");

  const dateObj = new Date(obj.date);
  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const year = dateObj.getFullYear().toString().slice(-2); // последние 2 цифры года
  const hours = dateObj.getHours().toString().padStart(2, '0');
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');

  itemDate.innerText = `${day}.${month}.${year}г. ${hours}:${minutes}`;

  itemDate.className = 'todo-item-date';
  divIcon.classList = "todo-item-icon"
  divAutorItemPhoto.classList = "todo-item-autor"

  item.classList.add('todo-item');
  itemContent.classList.add("todo-item-content")
  itemLeftBlock.classList.add('todo-item-left-block');//
  itemText.classList.add('todo-item-text');
  itemBlock.classList.add('todo-item-actions');//
  itemButtonShowPhoto.classList.add("todo-item-show-photo")
  itemButtonDone.classList.add('todo-item-done');
  itemButtonChange.classList.add('todo-item-delete');

  itemText.innerText = obj.name;
  itemButtonDone.innerText = 'Готово';
  itemButtonChange.innerText = 'Изменить';
  itemButtonDelete.innerText = "Delete"

  itemLeftBlock.append(itemDate, itemText);
  itemBlock.append(itemButtonDone, itemButtonChange);
  itemBlock.append(itemButtonDelete)
  itemContent.append(itemLeftBlock, itemBlock)
  item.append(divIcon, itemContent, divAutorItemPhoto);


  if (obj.type == "Robot") {
    divIcon.style.backgroundImage = "url('../App/images/icons/robot.png')";
  }
  if (obj.type == "Gun") {
    divIcon.style.backgroundImage = "url('../App/images/icons/gun.png')";
  }

  if (obj.authorAvatar) {
    divAutorItemPhoto.style.backgroundImage = `url(../App/images/userPhoto/${obj.authorAvatar})`;
  } else {
    divAutorItemPhoto.style.backgroundColor = '#3a6ea5'; // цвет на случай если нет аватарки
  }

  if (obj.done) item.classList.add('todo-item--completed');
  if (obj.photo) itemBlock.append(itemButtonShowPhoto) // тут добавляю

  itemButtonChange.onclick = () => {
    openEditModal(obj, (updatedTask) => {
      const index = listArray.findIndex(i => i.id === updatedTask.id);
      if (index !== -1) {
        listArray[index] = updatedTask;
        window.api.saveIssues(listArray);
        if (typeof window.update === 'function') window.update();
      }
    });
  };

  itemButtonDone.onclick = async () => {
    item.classList.toggle('todo-item--completed');
    const found = listArray.find(el => el.id === obj.id);
    if (found) found.done = !found.done;
    await window.api.saveIssues(listArray);
    if (document.activeElement) document.activeElement.blur();
    if (window.update) window.update();
    setTimeout(() => {
      const inputField = document.querySelector('.todo-input');
      if (inputField) inputField.focus();
    }, 0)
  };
  itemButtonShowPhoto.onclick = async () => {
    const base64 = await window.api.getPhotoBase64(obj.photo);
    if (base64) {
      showPhotoModal(base64);
    }
  };

  // раскомментируй если хочешь вернуцть кнопку delete и не забудь itemBlock.append прописать
  itemButtonDelete.onclick = async () => {
    const userConfirmed = await confirmWindow();  // получаем true/false

    if (userConfirmed) {
      const index = listArray.findIndex(el => el.id === obj.id);
      if (index !== -1) listArray.splice(index, 1);
      await window.api.saveIssues(listArray);
      if (window.update) window.update();
    }

    // Фокус всегда возвращаем (даже если отмена)
    const inputField = document.querySelector('.todo-input');
    if (inputField) inputField.focus();
  };

  return { item };
};

function showPhotoModal(base64) {
  // Удаляем старый модал, если есть
  const existing = document.querySelector('.photo-modal-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.classList.add('photo-modal-overlay');

  const img = document.createElement('img');
  img.src = base64;
  img.classList.add('photo-modal-img');

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.classList.add('photo-modal-close');
  closeBtn.onclick = () => overlay.remove();

  overlay.appendChild(closeBtn);
  overlay.appendChild(img);
  document.body.appendChild(overlay);
}

export const confirmWindow = () => {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.classList.add('body-disabled');

    const div = document.createElement('div');
    div.classList.add('block-confirm');

    const span = document.createElement('span');
    span.textContent = 'Удалить дело?';

    const buttonsDiv = document.createElement('div');
    buttonsDiv.classList.add('block-buttons-confirm');

    const buttonConfirm = document.createElement('button');
    buttonConfirm.textContent = 'Удалить';
    buttonConfirm.classList.add('button-confirm');

    const buttonExit = document.createElement('button');
    buttonExit.textContent = 'Отмена';
    buttonExit.classList.add('button-exit');

    buttonsDiv.appendChild(buttonConfirm);
    buttonsDiv.appendChild(buttonExit);
    div.appendChild(span);
    div.appendChild(buttonsDiv);
    overlay.appendChild(div);
    document.body.appendChild(overlay);

    // Фокус на кнопку "Удалить"
    buttonConfirm.focus();

    // Зацикливание Tab внутри диалога
    const focusableElements = [buttonConfirm, buttonExit];
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    const onTabKey = (e) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    };

    const cleanup = () => overlay.remove();

    const onKeyDown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        buttonConfirm.click();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        buttonExit.click();
      }
      if (e.key === 'Tab') {
        onTabKey(e);
      }
    };
    document.addEventListener('keydown', onKeyDown);

    const finalCleanup = () => {
      document.removeEventListener('keydown', onKeyDown);
      cleanup();
    };

    buttonConfirm.onclick = () => {
      finalCleanup();
      resolve(true);
    };

    buttonExit.onclick = () => {
      finalCleanup();
      resolve(false);
    };
  });
};

export const createContacts = async () => {
  const loader = document.getElementById('customLoader');
  if (loader) {
    loader.style.display = 'flex';
    const textDiv = loader.querySelector('div:last-child');
    if (textDiv) textDiv.textContent = 'Загрузка контактов...';
  }

  try {
    const usersData = await window.api.getAllUsers();

    const titleContacts = document.createElement('h3');
    const listContacts = document.createElement('ul');

    titleContacts.classList.add('title-contacts');
    listContacts.classList.add('list-contacts');
    titleContacts.textContent = 'Контакты';

    for (const obj of usersData) {
      const itemContacts = document.createElement('li');
      const avatar = document.createElement('img');
      const name = document.createElement('h2');
      const position = document.createElement('p');
      const mainPhone = document.createElement('a');
      const socialLinks = document.createElement('div');
      const tgLink = document.createElement('a');
      const waLink = document.createElement('a');
      const vbLink = document.createElement('a');

      itemContacts.classList.add('item-contacts');
      avatar.alt = 'Аватар';
      avatar.classList.add('avatar');

      if (obj.avatarUrl) {
        const base64Photo = await window.api.getAvatarBase64(obj.avatarUrl);
        if (base64Photo) {
          avatar.src = base64Photo;
        } else {
          const defaultBase64 = await window.api.getAvatarBase64('default.jpg');
          avatar.src = defaultBase64 || '';
        }
      } else {
        const defaultBase64 = await window.api.getAvatarBase64('default.jpg');
        avatar.src = defaultBase64 || '';
      }

      name.textContent = obj.name;
      position.classList.add('position');
      position.textContent = obj.position;
      mainPhone.href = `tel:${obj.phoneLink}`;
      mainPhone.classList.add('main-phone');
      mainPhone.textContent = obj.phoneText;

      socialLinks.classList.add('social-links');

      tgLink.href = 'https://t.me';
      tgLink.target = '_blank';
      tgLink.classList.add('social-btn', 'tg');
      tgLink.textContent = 'Telegram';

      waLink.href = 'https://wa.me';
      waLink.target = '_blank';
      waLink.classList.add('social-btn', 'wa');
      waLink.textContent = 'WhatsApp';

      vbLink.href = `viber://chat?number=${encodeURIComponent(obj.phoneLink)}`;
      vbLink.classList.add('social-btn', 'vb');
      vbLink.textContent = 'Viber';

      socialLinks.appendChild(tgLink);
      socialLinks.appendChild(waLink);
      socialLinks.appendChild(vbLink);

      itemContacts.appendChild(avatar);
      itemContacts.appendChild(name);
      itemContacts.appendChild(position);
      itemContacts.appendChild(mainPhone);
      itemContacts.appendChild(socialLinks);

      listContacts.appendChild(itemContacts);
    }

    const container = document.querySelector(".main-container");
    if (container) {
      container.innerHTML = ''; // Очищаем контейнер
      container.appendChild(titleContacts);
      container.appendChild(listContacts);
    }
  } catch (error) {
    console.error("Ошибка при загрузке контактов:", error);
  } finally {
    // Скрываем лоадер
    if (loader) {
      loader.style.display = 'none';
    }
  }
};

export const createHeaderContent = async (currentUser) => {
  const header = document.querySelector('.header');
  if (!header) return; // Безопасность: выходим, если хедера нет на странице

  header.innerHTML = '';

  const headerBlock = document.createElement('div');
  headerBlock.classList.add('header__block');

  const headerContainer = document.createElement('div');
  headerContainer.classList.add('header-container');

  const headerRightBlock = document.createElement('div');
  headerRightBlock.classList.add('header-right-block');

  const avatarClient = document.createElement('img');
  avatarClient.classList.add('avatar-client');
  avatarClient.alt = 'Аватар пользователя';

  if (currentUser && currentUser.avatarUrl) {
    const base64Photo = await window.api.getAvatarBase64(currentUser.avatarUrl);
    // Вместо локального пути запрашиваем дефолтную картинку с диска I:\
    avatarClient.src = base64Photo || await window.api.getAvatarBase64('default.jpg') || '';
  } else {
    avatarClient.src = await window.api.getAvatarBase64('default.jpg') || '';
  }
  // =========================================================

  headerRightBlock.appendChild(avatarClient);
  headerContainer.appendChild(headerRightBlock);
  headerBlock.appendChild(headerContainer);
  header.appendChild(headerBlock);
}

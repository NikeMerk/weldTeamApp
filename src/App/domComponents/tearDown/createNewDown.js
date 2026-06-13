import { stationModels, stationRobots, gunStations } from "../../api/dataArray.js";


let objectTearDownData = null;
let currentPointPhoto = null;

export function createNewDown(mainContainer, existingReport = null, mainPageTearDown = null) {
    if (!mainContainer) return;

    // 1. Очищаем экран
    mainContainer.innerHTML = '';

    // 2. Шапка формы с кнопкой Назад
    mainContainer.appendChild(createTitleTearDown(mainPageTearDown));

    // 1. Создаем общую обертку для формы
    const formWrapper = document.createElement('div');
    formWrapper.className = 'td-form-wrapper';

    // 2. СНАЧАЛА ГЕНЕРИРУЕМ ФОРМУ И ВСТАВЛЯЕМ ЕЁ В ЭКРАН
    createVehicleReportForm(formWrapper);
    mainContainer.appendChild(formWrapper);

    // 3. ТЕПЕРЬ, когда элементы физически появились в DOM, мы можем их искать!
    const vinInput = document.getElementById('form-vin');
    const modelEl = document.getElementById('form-model');
    const driveEl = document.getElementById('form-drive');
    const configEl = document.getElementById('form-config');
    const categorySelect = document.getElementById('td-category');
    const dynamicContainer = document.getElementById('td-dynamic-location');

    // 4. И только теперь проверяем и заполняем данные, если это редактирование
    if (existingReport) {
        // Записываем старый отчет в рабочую переменную
        objectTearDownData = existingReport;

        // Заполняем инпуты данными этой машины
        if (modelEl) modelEl.value = objectTearDownData.modelCode;
        if (vinInput) vinInput.value = objectTearDownData.vinNumber;

        // Распиливаем строку "2WD/STD" обратно на Привод и Комплектацию
        if (objectTearDownData.config && (driveEl || configEl)) {
            const [drive, config] = objectTearDownData.config.split('/');
            if (driveEl) driveEl.value = drive;
            if (configEl) configEl.value = config;
        }

        // Подставляем раздел (Robot/Gun/Supplier)
        if (categorySelect) {
            categorySelect.value = objectTearDownData.area;
            // Перерисовываем внутренности (появятся селекты роботов или ганов)


            // проверяем есть ли точки
            if (objectTearDownData.points.length > 0) {
                const firstPoint = objectTearDownData.points[0];

                if (firstPoint.area === 'Robot') {
                    const modelSelect = document.getElementById('td-robot-station-model');
                    const robotSelect = document.getElementById('td-robot-number');

                    if (modelSelect && firstPoint.station) {
                        modelSelect.value = firstPoint.station;
                        modelSelect.dispatchEvent(new Event('change'));
                    }
                    if (robotSelect && firstPoint.equipment) {
                        const robotNumber = firstPoint.equipment.replace('R', '');
                        robotSelect.value = robotNumber;
                    }
                }
                else if (firstPoint.area === 'Gun') {
                    const stationSelect = document.getElementById('td-gun-station');
                    const numberSelect = document.getElementById('td-gun-number');

                    if (stationSelect && firstPoint.station) {
                        const station = gunStations.find(s => s.name === firstPoint.station);
                        if (station) stationSelect.value = station.id;
                        stationSelect.dispatchEvent(new Event('change'));
                    }
                    if (numberSelect && firstPoint.equipment) {
                        const gunNumber = firstPoint.equipment.replace('Ган ', '');
                        numberSelect.value = gunNumber;
                    }
                }
                else if (firstPoint.area === 'Supplier') {
                    const supplierInput = document.getElementById('td-supplier');
                    if (supplierInput && firstPoint.equipment) {
                        supplierInput.value = firstPoint.equipment;
                    }
                }
            }
            updateLocationFields(categorySelect, dynamicContainer);
        }

        // НАМЕРТВО БЛОКИРУЕМ ПАСПОРТ МАШИНЫ
        if (vinInput) vinInput.disabled = true;
        if (modelEl) modelEl.disabled = true;
        if (driveEl) driveEl.disabled = true;
        if (configEl) configEl.disabled = true;

        // Сразу же отрисовываем внизу те точки, которые в этой машине уже были дефектованы
        updateTemporaryPointsUI();

    } else {
        // Если зашли С НУЛЯ (создать новый), то просто обнуляем переменные, как обычно
        objectTearDownData = null;
        currentPointPhoto = null;
    }

    // ========== ДИНАМИЧЕСКИЕ СЕЛЕКТЫ ==========
    categorySelect.addEventListener('change', () => {
        updateLocationFields(categorySelect, dynamicContainer);
    });
    // ========== ЛОГИКА РАБОТЫ С ТОЧКАМИ ==========
    const btnPointPhoto = document.getElementById('btn-point-photo');
    if (btnPointPhoto) {
        btnPointPhoto.onclick = async () => {
            const result = await window.api.selectFile();

            if (result && result.base64 && result.filename) {
                try {
                    btnPointPhoto.textContent = '⏳ Сжатие фото...';

                    // Функция сжатия
                    const compressImageBase64Native = (base64, maxWidth = 1200, quality = 0.7) => {
                        return new Promise((resolve, reject) => {
                            const img = new Image();
                            img.onload = () => {
                                const canvas = document.createElement('canvas');
                                let width = img.width;
                                let height = img.height;

                                if (width > maxWidth) {
                                    height = (height * maxWidth) / width;
                                    width = maxWidth;
                                }

                                canvas.width = width;
                                canvas.height = height;

                                const ctx = canvas.getContext('2d');
                                ctx.drawImage(img, 0, 0, width, height);

                                const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                                resolve(compressedBase64);
                            };
                            img.onerror = reject;
                            img.src = base64;
                        });
                    };

                    // ВЫЗЫВАЕМ функцию и передаём ей base64
                    const compressedBase64 = await compressImageBase64Native(result.base64, 1200, 0.7);

                    result.base64 = compressedBase64;
                    currentPointPhoto = result.filename;
                    btnPointPhoto.textContent = '📷 Фото выбрано ✓';
                    btnPointPhoto.style.background = '#4caf50';
                    btnPointPhoto.style.borderColor = '#4caf50';

                } catch (error) {
                    console.error("Ошибка при сжатии изображения:", error);
                    btnPointPhoto.textContent = '❌ Ошибка сжатия';
                    btnPointPhoto.style.background = '#f44336';
                }
            }
        };
    }

    document.getElementById('btn-add-point-to-list').addEventListener('click', async () => {
        const pointNum = document.getElementById('add-point-num');
        const defect = document.getElementById('add-point-defect');
        const importance = document.getElementById('add-point-importance');
        const details = document.getElementById('add-point-details');
        const vinInput = document.getElementById('form-vin');

        const modelEl = document.getElementById('form-model');
        const driveEl = document.getElementById('form-drive');
        const configEl = document.getElementById('form-config');

        // 1. Валидация
        if (!modelEl.value) { showConfirmAlert('Выберите модель автомобиля!'); return; }
        if (!driveEl.value) { showConfirmAlert('Выберите привод!'); return; }
        if (!configEl.value) { showConfirmAlert('Выберите комплектацию!'); return; }
        if (!vinInput.value.trim() || vinInput.value.trim().length !== 6) {
            showConfirmAlert('VIN-номер должен быть 6 символов!');
            vinInput.focus();
            return;
        }
        if (!pointNum.value || !defect.value) {
            showConfirmAlert('Заполните номер точки и тип дефекта!');
            return;
        }

        // 2. Получаем текущие значения локации
        let areaValue = categorySelect.value || "—";
        let stationValue = "—";
        let equipmentValue = "—";

        if (categorySelect.value === 'Robot') {
            stationValue = document.getElementById('td-robot-station-model')?.value || "—";
            equipmentValue = document.getElementById('td-robot-number')?.value ? 'R' + document.getElementById('td-robot-number').value : "—";
        } else if (categorySelect.value === 'Gun') {
            const gunStationId = document.getElementById('td-gun-station')?.value;
            const foundStation = gunStations.find(s => s.id === gunStationId);
            stationValue = foundStation ? foundStation.name : "—";
            equipmentValue = document.getElementById('td-gun-number')?.value ? 'Ган ' + document.getElementById('td-gun-number').value : "—";
        } else if (categorySelect.value === 'Supplier') {
            stationValue = "Поставка";
            equipmentValue = document.getElementById('td-supplier')?.value || "—";
        }

        // 3. СОЗДАЁМ ТОЧКУ
        const newPoint = {
            id: crypto.randomUUID(),
            pointNum: pointNum.value,
            defectType: defect.value,
            importance: importance.value,
            details: details.value,
            photo: currentPointPhoto,
            area: areaValue,
            station: stationValue,
            equipment: equipmentValue
        };

        // 4. ЕСЛИ ЭТО ПЕРВАЯ ТОЧКА — создаём объект автомобиля
        if (objectTearDownData === null) {
            objectTearDownData = {
                id: crypto.randomUUID(),
                modelCode: modelEl.value,
                modelName: modelEl.options[modelEl.selectedIndex].text,
                config: `${driveEl.value}/${configEl.value}`,
                vinNumber: vinInput.value.trim().toUpperCase(),
                date: new Date().toLocaleDateString('ru-RU'),
                points: []
            };

            // Блокируем поля автомобиля
            vinInput.disabled = true;
            modelEl.disabled = true;
            driveEl.disabled = true;
            configEl.disabled = true;
            // добавить выбор селектов
        }

        // 5. ДОБАВЛЯЕМ ТОЧКУ В ЛОКАЛЬНЫЙ МАССИВ
        objectTearDownData.points.push(newPoint);

        // 6. ОТПРАВЛЯЕМ ВЕСЬ ОТЧЁТ НА СЕРВЕР
        const result = await window.api.saveTeardownReport(objectTearDownData);

        // 7. ПРОВЕРЯЕМ ОТВЕТ
        if (result && result.success) {
            // Успех — очищаем поля и перерисовываем
            pointNum.value = '';
            defect.value = '';
            details.value = '';

            currentPointPhoto = null;
            const photoBtn = document.getElementById('btn-point-photo');
            if (photoBtn) {
                photoBtn.textContent = '📷 Выбрать фото';
                photoBtn.style.background = '';
                photoBtn.style.borderColor = '#444';
            }

            updateTemporaryPointsUI();
        } else {
            // Ошибка — откатываем добавление точки
            objectTearDownData.points.pop();

            // Если точек не осталось — сбрасываем объект и разблокируем поля
            if (objectTearDownData.points.length === 0) {
                objectTearDownData = null;
                vinInput.disabled = false;
                modelEl.disabled = false;
                driveEl.disabled = false;
                configEl.disabled = false;
            }

            showConfirmAlert('Ошибка при сохранении отчёта: ' + (result?.error || 'неизвестная ошибка'));
        }

        pointNum.focus();
    });

    document.getElementById('btn-save-full-report').addEventListener('click', () => {
        if (!objectTearDownData || objectTearDownData.points.length === 0) {
            showConfirmAlert('Добавьте хотя бы одну точку!');
            return;
        }
        console.log('Отчет сохранен:', objectTearDownData);

        showConfirmAlert('Отчет успешно сохранен!');
        // Очищаем глобальный объект
        objectTearDownData = null;

        // Возвращаемся к списку отчетов
        mainPageTearDown(document.querySelector(".main-container"));
    });
}


function createTitleTearDown(onClose) {
    const headerRow = document.createElement('div');
    const button = document.createElement("button");
    const title = document.createElement("h2");

    headerRow.className = 'td-form-header';
    button.className = "td-btn-back";
    button.id = "btn-cancel-report";
    title.className = "td-form-title";

    button.innerText = "← Отмена";
    title.innerText = objectTearDownData ? "Редактирование отчета Tear Down" : "Новый отчет Tear Down";
    // НАПРАМУЮ КЛЕИМ ЛОГИКУ КЛИКА ПРИ СОЗДАНИИ КНОПКИ
    button.onclick = () => {
        objectTearDownData = null; // сбрасываем черновик отчета

        if (typeof onClose === 'function') {
            onClose(); // запускаем рендеринг главной страницы

        } else {
            console.warn("Функция закрытия onClose не передана!");

        }
    };
    headerRow.append(button, title)
    return headerRow;
}

function showConfirmAlert(text) {
    const bodyDisabled = document.createElement('div');
    bodyDisabled.className = 'body-disabled';
    const blockConfirm = document.createElement('div');
    blockConfirm.className = 'block-confirm';
    blockConfirm.innerHTML = `
        <div style="font-size: 36px; margin-bottom: 10px;">⚠️</div>
        <div style="color: #333333; font-size: 15px; font-weight: 600; line-height: 1.4; margin-bottom: 20px;">${text}</div>
        <button id="modal-ok-btn" style="background-color: #ff4d4d; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer;">ОК</button>
    `;
    bodyDisabled.appendChild(blockConfirm);
    document.body.appendChild(bodyDisabled);
    blockConfirm.querySelector('#modal-ok-btn').addEventListener('click', () => bodyDisabled.remove());
}

function createVehicleReportForm(formWrapper) {
    // Очищаем контейнер перед добавлением
    formWrapper.innerHTML = '';

    // СЕКЦИЯ 1: ИНФОРМАЦИЯ ОБ АВТОМОБИЛЕ

    const section1 = document.createElement('div');
    section1.className = 'td-form-section';

    const title1 = document.createElement('div');
    title1.className = 'td-section-title';
    title1.textContent = '1. Информация об автомобиле';
    section1.appendChild(title1);

    const grid1 = document.createElement('div');
    grid1.className = 'td-form-row-grid tripple';

    // Модель автомобиля
    const modelGroup = createInputGroup('Модель автомобиля');
    const modelSelect = createSelect('form-model', [
        { value: '', text: '-- Выберите модель --', selected: true },
        { value: 'M1e', text: 'M1e (A8)' },
        { value: 'M32', text: 'M32 (EXEED)' },
        { value: 'T1EJ', text: 'T1EJ (J7)' },
        { value: 'T13', text: 'T13 (J6)' },
        { value: 'T26', text: 'T26 (J8)' }
    ]);
    modelGroup.appendChild(modelSelect);
    grid1.appendChild(modelGroup);

    // Привод
    const driveGroup = createInputGroup('Привод');
    const driveSelect = createSelect('form-drive', [
        { value: '', text: '-- --', selected: true },
        { value: '2WD', text: '2WD' },
        { value: '4WD', text: '4WD' }
    ]);
    driveGroup.appendChild(driveSelect);
    grid1.appendChild(driveGroup);

    // Комплектация
    const configGroup = createInputGroup('Комплектация');
    const configSelect = createSelect('form-config', [
        { value: '', text: '-- --', selected: true },
        { value: 'STD', text: 'STD' },
        { value: 'SUN', text: 'SUN' }
    ]);
    configGroup.appendChild(configSelect);
    grid1.appendChild(configGroup);

    // VIN-номер
    const vinGroup = createInputGroup('VIN-номер');
    const vinInput = document.createElement('input');
    vinInput.type = 'text';
    vinInput.id = 'form-vin';
    vinInput.placeholder = '6-значный код';
    vinInput.maxLength = 6;
    vinInput.style.textTransform = 'uppercase';
    vinGroup.appendChild(vinInput);
    grid1.appendChild(vinGroup);

    section1.appendChild(grid1);
    formWrapper.appendChild(section1);

    // ==========================================
    // СЕКЦИЯ 2: ЛОКАЦИЯ НА ПРОИЗВОДСТВЕ
    // ==========================================
    const section2 = document.createElement('div');
    section2.className = 'td-form-section';

    const title2 = document.createElement('div');
    title2.className = 'td-section-title';
    title2.textContent = '2. Локация на производстве';
    section2.appendChild(title2);

    const grid2 = document.createElement('div');
    grid2.className = 'td-form-row-grid';

    // Раздел
    const categoryGroup = createInputGroup('Раздел');
    const categorySelect = createSelect('td-category', [
        { value: '', text: '-- Выберите раздел --' },
        { value: 'Robot', text: 'Robot' },
        { value: 'Gun', text: 'Gun' },
        { value: 'Supplier', text: 'Supplier' }
    ]);
    categoryGroup.appendChild(categorySelect);
    grid2.appendChild(categoryGroup);
    section2.appendChild(grid2);

    // Динамический блок локации
    const dynamicLocation = document.createElement('div');
    dynamicLocation.id = 'td-dynamic-location';
    dynamicLocation.className = 'td-dynamic-location';
    section2.appendChild(dynamicLocation);

    formWrapper.appendChild(section2);

    // СЕКЦИЯ 3: РЕГИСТРАЦИЯ ДЕФЕКТНЫХ ТОЧЕК
    const section3 = document.createElement('div');
    section3.className = 'td-form-section';

    const title3 = document.createElement('div');
    title3.className = 'td-section-title';
    title3.textContent = '3. Регистрация дефектных точек';
    section3.appendChild(title3);

    const pointAdderBox = document.createElement('div');
    pointAdderBox.className = 'td-point-adder-box';

    const adderGrid = document.createElement('div');
    adderGrid.className = 'td-adder-grid';

    // № Точки
    const pointNumGroup = createInputGroup('№ Точки (5 цифр)');
    const pointNumInput = document.createElement('input');
    pointNumInput.type = 'number';
    pointNumInput.id = 'add-point-num';
    pointNumInput.placeholder = '00000';
    pointNumGroup.appendChild(pointNumInput);
    adderGrid.appendChild(pointNumGroup);

    // Важность
    const importanceGroup = createInputGroup('Важность');
    const importanceSelect = createSelect('add-point-importance', [
        { value: 'Обычный', text: 'Норма' },
        { value: 'Важно', text: '⚠️ Важно' }
    ]);
    importanceGroup.appendChild(importanceSelect);
    adderGrid.appendChild(importanceGroup);

    // Тип дефекта
    const defectGroup = createInputGroup('Тип дефекта');
    defectGroup.className += ' full-width';
    const defectSelect = createSelect('add-point-defect', [
        { value: '', text: '-- Выберите тип --' },
        { value: 'Непровар', text: 'Непровар' },
        { value: 'Малое ядро', text: 'Малое ядро' },
        { value: 'Прожог', text: 'Прожог' },
        { value: 'Смещение', text: 'Смещение' }
    ]);
    defectGroup.appendChild(defectSelect);
    adderGrid.appendChild(defectGroup);

    // Подробности / Заметка
    const detailsGroup = createInputGroup('Подробности / Заметка');
    detailsGroup.className += ' full-width';
    const detailsInput = document.createElement('input');
    detailsInput.type = 'text';
    detailsInput.id = 'add-point-details';
    detailsInput.placeholder = 'Деталь поставщика / зазор детали';
    detailsGroup.appendChild(detailsInput);
    adderGrid.appendChild(detailsGroup);

    // Фото дефекта
    const photoGroup = createInputGroup('Фото дефекта');
    const photoBtn = document.createElement('button');
    photoBtn.type = 'button';
    photoBtn.className = 'td-btn-photo';
    photoBtn.id = 'btn-point-photo';
    photoBtn.textContent = '📷 Выбрать фото';

    const photoHiddenInput = document.createElement('input');
    photoHiddenInput.type = 'hidden';
    photoHiddenInput.id = 'point-photo-filename';
    photoHiddenInput.value = '';

    photoGroup.appendChild(photoBtn);
    photoGroup.appendChild(photoHiddenInput);
    adderGrid.appendChild(photoGroup);

    pointAdderBox.appendChild(adderGrid);

    // Кнопка добавления точки
    const addPointBtn = document.createElement('button');
    addPointBtn.type = 'button';
    addPointBtn.className = 'td-btn-add-point';
    addPointBtn.id = 'btn-add-point-to-list';
    addPointBtn.textContent = '+ Добавить точку в отчет';
    pointAdderBox.appendChild(addPointBtn);

    section3.appendChild(pointAdderBox);

    // Список добавленных точек
    const addedPointsTitle = document.createElement('div');
    addedPointsTitle.className = 'td-added-points-title';
    addedPointsTitle.textContent = 'Добавленные точки в этом отчете:';
    section3.appendChild(addedPointsTitle);

    const pointsList = document.createElement('div');
    pointsList.className = 'td-added-points-list';
    pointsList.id = 'temporary-points-list';

    const emptyStub = document.createElement('div');
    emptyStub.className = 'td-empty-points-stub';
    emptyStub.textContent = 'Точки еще не добавлены.';
    pointsList.appendChild(emptyStub);

    section3.appendChild(pointsList);
    formWrapper.appendChild(section3);

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'td-form-actions';

    const saveBtn = document.createElement('button');
    saveBtn.className = 'td-btn-submit';
    saveBtn.id = 'btn-save-full-report';
    saveBtn.textContent = 'Сохранить отчет';

    vinInput.addEventListener("input", function (e) {
        // 1. Удаляем всё, кроме цифр (буквы, пробелы, знаки препинания)
        const digitsOnly = e.target.value.replace(/\D/g, '');

        // Перезаписываем значение в инпуте, чтобы пользователь видел только цифры
        e.target.value = digitsOnly;

        // 2. Проверяем длину получившейся строки из чистых цифр
        if (digitsOnly.length === 6) {
            e.target.classList.add('input-success');
        } else {
            e.target.classList.remove('input-success');
        }

    })

    actionsDiv.appendChild(saveBtn);
    formWrapper.appendChild(actionsDiv);
}

function createInputGroup(labelText) {
    const group = document.createElement('div');
    group.className = 'td-input-group';
    const label = document.createElement('label');
    label.textContent = labelText;
    group.appendChild(label);
    return group;
}

function createSelect(id, optionsData) {
    const select = document.createElement('select');
    select.id = id;
    optionsData.forEach(data => {
        const option = document.createElement('option');
        option.value = data.value;
        option.textContent = data.text;
        if (data.selected) {
            option.selected = true;
        }
        select.appendChild(option);
    });
    return select;
}

function updateLocationFields(categorySelect, dynamicContainer) {
    if (!categorySelect || !dynamicContainer) return;

    const category = categorySelect.value;
    dynamicContainer.innerHTML = '';

    // ==========================================
    // ВАРИАНТ: ROBOT
    // ==========================================
    if (category === 'Robot') {
        dynamicContainer.innerHTML = `
            <div class="td-form-row-grid tripple">
                <div class="td-input-group">
                    <label>Участок</label>
                    <select id="td-robot-station-type">
                        <option value="">-- Выберите тип --</option>
                        ${Object.keys(stationModels).map(type => `<option value="${type}">${type}</option>`).join('')}
                    </select>
                </div>
                <div class="td-input-group td-hidden" id="td-robot-model-group">
                    <label>№ станции</label>
                    <select id="td-robot-station-model">
                        <option value="">-- сначала выберите тип --</option>
                    </select>
                </div>
                <div class="td-input-group td-hidden" id="td-robot-number-group">
                    <label>№ робота</label>
                    <select id="td-robot-number">
                        <option value="">-- сначала выберите модель --</option>
                    </select>
                </div>
            </div>
        `;

        const stationType = document.getElementById('td-robot-station-type');
        const modelGroup = document.getElementById('td-robot-model-group');
        const modelSelect = document.getElementById('td-robot-station-model');
        const numberGroup = document.getElementById('td-robot-number-group');
        const numberSelect = document.getElementById('td-robot-number');

        stationType.addEventListener('change', () => {
            const type = stationType.value;
            if (type && stationModels[type]) {
                modelSelect.innerHTML = `<option value="">-- Выберите модель --</option>${stationModels[type].map(m => `<option value="${m}">${m}</option>`).join('')}`;
                modelGroup.classList.remove('td-hidden');
                numberGroup.classList.add('td-hidden');
            } else {
                modelGroup.classList.add('td-hidden');
                numberGroup.classList.add('td-hidden');
            }
        });

        modelSelect.addEventListener('change', () => {
            const model = modelSelect.value;
            if (model && stationRobots[model]) {
                numberSelect.innerHTML = `<option value="">-- Выберите робота --</option>${stationRobots[model].map(r => `<option value="${r}">R${r}</option>`).join('')}`;
                numberGroup.classList.remove('td-hidden');
            } else {
                numberGroup.classList.add('td-hidden');
            }
        });

        // ==========================================
        // ВАРИАНТ: GUN
        // ==========================================
    } else if (category === 'Gun') {
        const stationSelect = document.createElement('div');
        stationSelect.className = 'td-form-row-grid double';
        stationSelect.innerHTML = `
            <div class="td-input-group">
                <label>Станция</label>
                <select id="td-gun-station">
                    <option value="">-- Выберите станцию --</option>
                    ${gunStations.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
                </select>
            </div>
            <div class="td-input-group td-hidden" id="td-gun-number-group">
                <label>Номер ган</label>
                <select id="td-gun-number"></select>
            </div>
        `;
        dynamicContainer.appendChild(stationSelect);

        const stationEl = document.getElementById('td-gun-station');
        const numberGroup = document.getElementById('td-gun-number-group');
        const numberSelect = document.getElementById('td-gun-number');

        stationEl.addEventListener('change', () => {
            const selected = gunStations.find(s => s.id === stationEl.value);
            if (selected && selected.guns.length) {
                numberSelect.innerHTML = `<option value="">-- Выберите ган --</option>${selected.guns.map(g => `<option value="${g}">Ган ${g}</option>`).join('')}`;
                numberGroup.classList.remove('td-hidden');
            } else {
                numberGroup.classList.add('td-hidden');
            }
        });

        // ==========================================
        // ВАРИАНТ: SUPPLIER
        // ==========================================
    } else if (category === 'Supplier') {
        dynamicContainer.innerHTML = `
            <div class="td-form-row-grid">
                <div class="td-input-group">
                    <label>Поставщик</label>
                    <input type="text" id="td-supplier" placeholder="Название детали">
                </div>
            </div>
        `;
    }
}

function updateTemporaryPointsUI() {
    // Ищем правильный контейнер для списка точек
    const container = document.querySelector('.td-added-points-list');
    if (!container) return;

    // Очищаем контейнер
    container.innerHTML = '';

    if (!objectTearDownData || objectTearDownData.points.length === 0) {
        container.innerHTML = '<div class="td-empty-points-stub">Точки еще не добавлены.</div>';
        return;
    }

    // Создаём список с правильным классом для таймлайна
    const list = document.createElement('div');
    list.className = 'td-points-list';  // ← нужен для вертикальной линии

    objectTearDownData.points.forEach(point => {
        list.appendChild(renderPointsItems(point));
    });

    container.appendChild(list);
}

function renderPointsItems(point) {
    // Элемент timeline
    const timelineItem = document.createElement('div');
    timelineItem.className = 'timeline-item';
    if (point.importance === 'Важно') {
        timelineItem.classList.add('important');
    }

    // Маркер (кружок на линии)
    const marker = document.createElement('div');
    marker.className = 'timeline-marker';
    timelineItem.appendChild(marker);

    // КАРТОЧКА (кликабельная)
    const card = document.createElement('div');
    card.className = 'timeline-card';

    // Шапка карточки (видна всегда)
    const cardHeader = document.createElement('div');
    cardHeader.className = 'timeline-card-header';
    cardHeader.innerHTML = `
        <div class="timeline-card-left">
            <span class="timeline-num">#${point.pointNum}</span>
            <span class="timeline-defect">${point.defectType}</span>
        </div>
        <div class="timeline-card-right">
            ${point.importance === 'Важно' ? '<span class="timeline-importance">⚠️</span>' : ''}
            ${point.photo ? '<span class="timeline-photo-icon">📸</span>' : ''}
            <span class="timeline-arrow">▼</span>
        </div>
    `;

    // КОНТЕНТ (раскрывается)
    const cardContent = document.createElement('div');
    cardContent.className = 'timeline-card-content';
    cardContent.innerHTML = `
        <div class="timeline-detail-row">
            <span class="timeline-detail-label">📝 Подробности:</span>
            <span class="timeline-detail-value">${point.details || '—'}</span>
        </div>
        <div class="timeline-detail-row">
            <span class="timeline-detail-label">📍 Раздел:</span>
            <span class="timeline-detail-value">${point.area || '—'}</span>
        </div>
        <div class="timeline-detail-row">
            <span class="timeline-detail-label">🏭 Станция / Модель:</span>
            <span class="timeline-detail-value">${point.station || '—'}</span>
        </div>
        <div class="timeline-detail-row">
            <span class="timeline-detail-label">🤖 Оборудование:</span>
            <span class="timeline-detail-value">${point.equipment || '—'}</span>
        </div>
    `;

    // Кнопка удаления
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'timeline-delete-btn';
    deleteBtn.textContent = 'Удалить точку';
    deleteBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const result = await window.api.deleteTeardownPoint(objectTearDownData.id, point.id);
        if (result && result.success) {
            const index = objectTearDownData.points.findIndex(p => p.id === point.id);
            if (index !== -1) {
                objectTearDownData.points.splice(index, 1);
                updateTemporaryPointsUI();
                if (objectTearDownData.points.length === 0) {
                    objectTearDownData = null;
                }
            }
        }
    });

    cardContent.appendChild(deleteBtn);
    card.appendChild(cardHeader);
    card.appendChild(cardContent);
    timelineItem.appendChild(card);

    // Клик по карточке раскрывает/закрывает
    cardHeader.addEventListener('click', () => {
        timelineItem.classList.toggle('open');
    });

    // Обработчик клика по иконке фото
    const photoIcon = cardHeader.querySelector('.timeline-photo-icon');
    if (photoIcon) {
        photoIcon.addEventListener('click', async (e) => {
            e.stopPropagation();
            const base64 = await window.api.getPhotoBase64(point.photo);
            if (base64) showPhotoModal(base64);
        });
    }

    return timelineItem;
}
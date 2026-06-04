import { createNewDown } from "./createNewDown.js";

export function mainPageTearDown(mainContainer) {
    if (!mainContainer) return;

    // Очищаем всё, чтобы построить новую структуру
    mainContainer.innerHTML = '';

    // 1. СОЗДАЕМ ВЕРХНЮЮ ПАНЕЛЬ (Кнопка + Фильтры)
    const toolbar = document.createElement('div');
    toolbar.className = 'td-toolbar';

    // Кнопка создания
    const btnCreate = document.createElement('button');
    btnCreate.className = 'td-btn-main-create';
    btnCreate.innerText = '+ Создать новый отчет';
    toolbar.appendChild(btnCreate);

    // Контейнер для кнопок-фильтров
    const filterGroup = document.createElement('div');
    filterGroup.className = 'td-filter-group';

    // Список ваших моделей для фильтрации
    const models = [
        { id: 'all', label: 'Все' },
        { id: 'M1e', label: 'M1e (Arrizo)' },
        { id: 'M32', label: 'M32 (EXEED)' },
        { id: 'T1EJ', label: 'T1EJ (Jaecoo 7)' },
        { id: 'T13', label: 'T13 (Jaecoo 6)' },
        { id: 'T26', label: 'T26 (Jaecoo 8)' }
    ];

    models.forEach((model, index) => {
        const btnFilter = document.createElement('button');
        btnFilter.className = 'td-btn-filter';
        if (index === 0) btnFilter.classList.add('active'); // "Все" активна по умолчанию
        btnFilter.innerText = model.label;
        btnFilter.dataset.modelId = model.id;

        btnFilter.addEventListener('click', (e) => {
            document.querySelectorAll('.td-btn-filter').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            filterReports(model.id);
        });

        filterGroup.appendChild(btnFilter);
    });

    // Нажатие на кнопку "Создать новый отчет"
    btnCreate.onclick = () => {
        createNewDown(mainContainer, null, () => {
            mainPageTearDown(mainContainer);
        });
    };

    toolbar.appendChild(filterGroup);
    mainContainer.appendChild(toolbar);

    // 2. СОЗДАЕМ КОНТЕЙНЕР ДЛЯ СПИСКА КАРТОЧЕК
    const listContainer = document.createElement('div');
    listContainer.id = 'td-reports-list';
    listContainer.className = 'td-list-container';
    mainContainer.appendChild(listContainer);

    // Рендерим первоначальные данные (Передаем mainContainer внутрь для логики кнопок)
    renderReports(mockReportsData, mainContainer);
}

// Функция отрисовки карточек отчетов
function renderReports(dataArray, mainContainer) {
    const listContainer = document.getElementById('td-reports-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    dataArray.forEach(item => {
        const card = document.createElement('div');
        card.className = 'td-report-card';
        card.dataset.model = item.modelCode; // Для фильтрации

        // Подсвечиваем, если есть важные дефекты
        if (item.importance === 'Важно') {
            card.classList.add('td-card-important');
        }

        // Шапка (Только статус важности отчета)
        const header = document.createElement('div');
        header.className = 'td-report-header';
        header.innerHTML = `
            <div class="td-importance-badge ${item.importance === 'Важно' ? 'critical' : ''}">
                ${item.importance === 'Важно' ? '⚠️ Контроль дефектов' : 'Статус: Норма'}
            </div>
        `;

        // Новая центральная строка: Модель + Комплектация и количество дефектов
        const infoRow = document.createElement('div');
        infoRow.className = 'td-info-row';
        infoRow.innerHTML = `
            <div class="td-loc-path">
                <span class="td-model-name">${item.modelName}</span> 
                <p class="td-vin">VIN:  ${item.vin}<p/>
                <span class="td-config-badge">${item.config} </span>
            </div>
            <div class="td-defects-counter">
                Дефектов: <span class="td-count-num">${item.defectsCount}</span>
            </div>
        `;

        // Строка действий с кнопкой "Изменить"
        const actionsRow = document.createElement('div');
        actionsRow.className = 'td-actions-row';
        actionsRow.innerHTML = `
            <span class="td-report-date">${item.date || ''}</span>
            <button class="td-btn-open-report">Изменить</button>
        `;

        // Клик на кнопку "Изменить" открывает форму редактирования/создания
        actionsRow.querySelector('.td-btn-open-report').addEventListener('click', () => {
            // Передаем mainContainer, чтобы форма знала, куда рисоваться, и данные отчета для редактирования
            createNewDown(mainContainer, item);
        });

        card.appendChild(header);
        card.appendChild(infoRow);
        card.appendChild(actionsRow);
        listContainer.appendChild(card);
    });
}

// Логика фильтрации на клиенте
function filterReports(modelId) {
    const cards = document.querySelectorAll('.td-report-card');
    cards.forEach(card => {
        if (modelId === 'all' || card.dataset.model === modelId) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}


// ОБНОВЛЕННЫЙ МАССИВ ДАННЫХ (Теперь это сущность "Отчет по машине")
const mockReportsData = [
    {
        modelCode: "T13",
        modelName: "T13 (J6)",
        config: "2WD/STD",
        area: "RF",
        vin: 123456,
        station: "M0090",
        equipment: "R2",
        defectsCount: 8, // Сколько проблемных точек внутри
        importance: "Важно",
        date: "02.06.2026"
    },
    {
        modelCode: "M32",
        modelName: "M32 ()",
        config: "4WD/LUX",
        area: "MB",
        vin: 123456,
        station: "M0010",
        equipment: "R1",
        defectsCount: 3,
        importance: "Обычный",
        date: "01.06.2026"
    },
    {
        modelCode: "T1EJ",
        modelName: "T1EJ (Jaecoo 7)",
        config: "2WD/COMF",
        area: "Side",
        vin: 123456,
        station: "S0040",
        equipment: "R4",
        defectsCount: 14,
        importance: "Важно",
        date: "02.06.2026"
    },
    // {
    //     id: createSpecialId(listArray),
    //     name: description,
    //     done: false,
    //     date: new Date().toISOString(),
    //     type: selectedMain,
    //     photo: currentPhoto || null,
    //     authorId: user.windowsLogin,
    //     authorAvatar: user.avatarUrl || null
    // }
    // const finalReport = {
    // // 1. Паспорт автомобиля (Заполняется в Блоке 1)
    // id: "rep_" + Date.now(),             // Уникальный ID самого отчета
    // modelCode: "T13",                    // Код модели для фильтров (T13, M32...)
    // modelName: "T13 (Jaecoo 6)",         // Красивое имя для карточки
    // config: "2WD/STD",                   // Комплектация
    // vinNumber: "XTA211000XXXXXXXX",      // VIN-номер машины

    // // 2. Локация на производстве (Заполняется в Блоке 2)
    // area: "RF",                          // Участок
    // station: "M0090",                    // Станция
    // equipment: "R2",                     // Робот

    // // 3. Мета-данные для главного экрана
    // date: new Date().toLocaleDateString('ru-RU'), // Дата создания отчета
    // defectsCount: 0,                     // Сюда перед сохранением запишем currentReportPoints.length
    // importance: "Обычный",               // Если хоть одна точка "Важно", запишем "Важно"

    // // 4. МАССИВ ТОЧЕК (Заполняется в Блоке 3)
    // // Сюда мы просто вставляем весь наш массив currentReportPoints!
    // points: [
    //     {
    //         id: 1717438400000,
    //         pointNum: "48010",
    //         defectType: "Непровар / Разделение",
    //         importance: "Важно",
    //         details: "Деталь поставщика"
    //     },
    //     {
    //         id: 1717438415000,
    //         pointNum: "48012",
    //         defectType: "Малый размер точки",
    //         importance: "Обычный",
    //         details: ""
    //     }
    // ]


];

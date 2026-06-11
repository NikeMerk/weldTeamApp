import { createNewDown } from "./createNewDown.js";

export async function mainPageTearDown(mainContainer) {
    if (!mainContainer) return;

    // Очищаем всё
    mainContainer.innerHTML = '';

    // 1. Верхняя панель
    const toolbar = document.createElement('div');
    toolbar.className = 'td-toolbar';

    const btnCreate = document.createElement('button');
    btnCreate.className = 'td-btn-main-create';
    btnCreate.innerText = '+ Создать новый отчет';
    toolbar.appendChild(btnCreate);

    const filterGroup = document.createElement('div');
    filterGroup.className = 'td-filter-group';

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
        if (index === 0) btnFilter.classList.add('active');
        btnFilter.innerText = model.label;
        btnFilter.dataset.modelId = model.id;

        btnFilter.addEventListener('click', (e) => {
            document.querySelectorAll('.td-btn-filter').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            filterReports(model.id);
        });

        filterGroup.appendChild(btnFilter);
    });

    btnCreate.onclick = () => {
        createNewDown(mainContainer, null, () => {
            mainPageTearDown(mainContainer);
        });
    };

    toolbar.appendChild(filterGroup);
    mainContainer.appendChild(toolbar);

    // 2. Контейнер для списка карточек
    const listContainer = document.createElement('div');
    listContainer.id = 'td-reports-list';
    listContainer.className = 'td-list-container';
    mainContainer.appendChild(listContainer);

    // 3. Загружаем реальные отчёты с сервера
    await loadAndRenderReports(listContainer);
}

// Загрузка с сервера и отрисовка
async function loadAndRenderReports(listContainer) {
    try {
        const reports = await window.api.loadTeardownReports();

        if (!reports || reports.length === 0) {
            listContainer.innerHTML = '<div class="td-empty-stub">Нет сохранённых отчётов. Создайте первый!</div>';
            return;
        }

        listContainer.innerHTML = '';

        reports.forEach(report => {
            const card = document.createElement('div');
            card.className = 'td-report-card';
            card.dataset.model = report.modelCode || '';

            // Определяем важность (если есть хоть одна точка с importance === 'Важно')
            const hasImportant = report.points && report.points.some(p => p.importance === 'Важно');
            if (hasImportant) {
                card.classList.add('td-card-important');
            }

            const header = document.createElement('div');
            header.className = 'td-report-header';
            header.innerHTML = `
                <div class="td-importance-badge ${hasImportant ? 'critical' : ''}">
                    ${hasImportant ? '⚠️ Контроль дефектов' : 'Статус: Норма'}
                </div>
            `;

            const infoRow = document.createElement('div');
            infoRow.className = 'td-info-row';
            infoRow.innerHTML = `
                <div class="td-loc-path">
                    <span class="td-model-name">${report.modelName || ''}</span>
                    <p class="td-vin">VIN: ${report.vinNumber || ''}</p>
                    <span class="td-config-badge">${report.config || ''}</span>
                </div>
                <div class="td-defects-counter">
                    Дефектов: <span class="td-count-num">${report.points ? report.points.length : 0}</span>
                </div>
            `;

            const actionsRow = document.createElement('div');
            actionsRow.className = 'td-actions-row';
            actionsRow.innerHTML = `
                <span class="td-report-date">${report.date || ''}</span>
                <button class="td-btn-open-report">Изменить</button>
            `;

            actionsRow.querySelector('.td-btn-open-report').addEventListener('click', () => {
                createNewDown(listContainer.closest('.main-container'), report);
            });

            card.appendChild(header);
            card.appendChild(infoRow);
            card.appendChild(actionsRow);
            listContainer.appendChild(card);
        });

    } catch (err) {
        console.error('Ошибка загрузки отчётов:', err);
        listContainer.innerHTML = '<div class="td-error-stub">Ошибка загрузки данных с сервера</div>';
    }
}

// Фильтрация по модели
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
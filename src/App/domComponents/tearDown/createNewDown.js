export function createNewDown(mainContainer) {
    if (!mainContainer) return;

    // 1. Очищаем экран
    mainContainer.innerHTML = '';

    // 2. Шапка формы с кнопкой Назад
    const headerRow = document.createElement('div');
    headerRow.className = 'td-form-header';
    headerRow.innerHTML = `
        <button class="td-btn-back" id="btn-cancel-report">← Отмена</button>
        <h2 class="td-form-title">Новый отчет Tear Down</h2>
    `;
    mainContainer.appendChild(headerRow);

    // 3. Создаем общую обертку для формы
    const formWrapper = document.createElement('div');
    formWrapper.className = 'td-form-wrapper';

    // Заполняем форму логическими блоками
    formWrapper.innerHTML = `
        <!-- БЛОК 1: ПАРАПЕТРЫ АВТОМОБИЛЯ -->
       <div class="td-form-section">
    <div class="td-section-title">1. Информация об автомобиле</div>
    <div class="td-form-row-grid tripple">
        <div class="td-input-group">
            <label>Модель автомобиля</label>
            <select id="form-model">
                <option value="M1e">M1e (Arrizo)</option>
                <option value="M32">M32 (EXEED)</option>
                <option value="T1EJ">T1EJ (Jaecoo 7)</option>
                <option value="T13" selected>T13 (Jaecoo 6)</option>
                <option value="T26">T26 (Jaecoo 8)</option>
            </select>
        </div>
        <div class="td-input-group">
            <label>Комплектация</label>
            <input type="text" id="form-config" placeholder="Например: 2WD/STD" value="2WD/STD">
        </div>
        <div class="td-input-group">
            <label>VIN-номер</label>
            <input type="text" id="form-vin" placeholder="17-значный код машины" maxlength="17" style="text-transform: uppercase;">
        </div>
    </div>
</div>

        <!-- БЛОК 2: ЛОКАЦИЯ НА ЛИНИИ -->
        <div class="td-form-section">
            <div class="td-section-title">2. Локация на производстве</div>
            <div class="td-form-row-grid tripple">
                <div class="td-input-group">
                    <label>Участок</label>
                    <input type="text" id="form-area" placeholder="Например: RF" value="RF">
                </div>
                <div class="td-input-group">
                    <label>Станция</label>
                    <input type="text" id="form-station" placeholder="Например: M0090" value="M0090">
                </div>
                <div class="td-input-group">
                    <label>Робот / Оборудование</label>
                    <input type="text" id="form-equipment" placeholder="Например: R2" value="R2">
                </div>
            </div>
        </div>

        <!-- БЛОК 3: ДОБАВЛЕНИЕ ТОЧЕК С ДЕФЕКТАМИ -->
        <div class="td-form-section">
            <div class="td-section-title">3. Регистрация дефектных точек</div>
            
            <!-- Инпуты для быстрой вставки одной точки -->
            <div class="td-point-adder-box">
                <div class="td-adder-grid">
                    <div class="td-input-group">
                        <label>№ Точки (5 цифр)</label>
                        <input type="number" id="add-point-num" placeholder="48010">
                    </div>
                    <div class="td-input-group">
                        <label>Важность</label>
                        <select id="add-point-importance">
                            <option value="Обычный">Норма</option>
                            <option value="Важно">⚠️ Важно</option>
                        </select>
                    </div>
                    <div class="td-input-group full-width">
                        <label>Тип дефекта</label>
                        <input type="text" id="add-point-defect" placeholder="Непровар / Разделение / Малая точка">
                    </div>
                    <div class="td-input-group full-width">
                        <label>Подробности / Заметка</label>
                        <input type="text" id="add-point-details" placeholder="Деталь поставщика / зазор детали">
                    </div>
                </div>
                <button type="button" class="td-btn-add-point" id="btn-add-point-to-list">+ Добавить точку в отчет</button>
            </div>

            <!-- Временный список добавленных точек (живой предпросмотр) -->
            <div class="td-added-points-title">Добавленные точки в этом отчете:</div>
            <div class="td-added-points-list" id="temporary-points-list">
                <!-- Сюда скрипт будет на лету накидывать мини-карточки точек -->
                <div class="td-empty-points-stub">Точки еще не добавлены. Заполните поля выше.</div>
            </div>
        </div>

        <!-- ФИНАЛЬНЫЕ КНОПКИ -->
        <div class="td-form-actions">
            <button class="td-btn-submit" id="btn-save-full-report">Сохранить отчет</button>
        </div>
    `;

    mainContainer.appendChild(formWrapper);

    // ==========================================
    // ЛОГИКА РАБОТЫ ФОРМЫ (ИНТЕРАКТИВ)
    // ==========================================

    // Массив, где будут храниться временно добавленные точки текущего отчета
    let currentReportPoints = [];

    // Кнопка "Отмена" — возвращает на главный список машин
    document.getElementById('btn-cancel-report').addEventListener('click', () => {
        initTearDownSection(containerId);
    });

    // Логика добавления точки во временный список
    document.getElementById('btn-add-point-to-list').addEventListener('click', () => {
        const pointNumInput = document.getElementById('add-point-num');
        const defectInput = document.getElementById('add-point-defect');
        const importanceSelect = document.getElementById('add-point-importance');
        const detailsInput = document.getElementById('add-point-details');
        const inputVin = document.getElementById("form-vin")

        if (!pointNumInput.value || !defectInput.value) {
            showConfirmAlert('Пожалуйста, введите как минимум Номер точки и Тип дефекта!', 'error');
            return;
        }
        if (!inputVin.value.trim()) {
            showConfirmAlert('Нельзя сохранить отчет без VIN-номера! Пожалуйста, заполните поле.');
            vinInput.focus();
            return;
        }

        // 2. Проверяем длину VIN-номера (строго 17 символов для автопрома)
        if (inputVin.value.trim().length !== 6) {
            showConfirmAlert(`VIN-номер должен состоять строго из 6 символов!<br>Сейчас введено: ${inputVin.value.trim().length}`);
            inputVin.focus();
            return;
        }

        // Создаем объект точки
        const newPoint = {
            id: Date.now(),
            vin: inputVin.value,
            pointNum: pointNumInput.value,
            defectType: defectInput.value,
            importance: importanceSelect.value,
            details: detailsInput.value
        };

        currentReportPoints.push(newPoint);
        console.log(currentReportPoints)
        updateTemporaryPointsUI();

        // Очищаем только поля ввода точки, чтобы вводить следующую
        pointNumInput.value = '';
        defectInput.value = '';
        detailsInput.value = '';
    });

    // Функция обновления списка добавленных точек на экране
    function updateTemporaryPointsUI() {
        const list = document.getElementById('temporary-points-list');
        if (currentReportPoints.length === 0) {
            list.innerHTML = '<div class="td-empty-points-stub">Точки еще не добавлены. Заполните поля выше.</div>';
            return;
        }

        list.innerHTML = '';
        currentReportPoints.forEach((p, idx) => {
            const miniCard = document.createElement('div');
            miniCard.className = `td-mini-point-card ${p.importance === 'Важно' ? 'important' : ''}`;
            miniCard.innerHTML = `
                <div class="td-mini-info">
                    <span class="td-mini-num">#${p.pointNum}</span>
                    <span class="td-mini-defect">${p.defectType}</span>
                    ${p.details ? `<span class="td-mini-details">(${p.details})</span>` : ''}
                </div>
                <button class="td-mini-del-btn" data-id="${p.id}">×</button>
            `;

            // Удаление отдельной точки из списка перед сохранением
            miniCard.querySelector('.td-mini-del-btn').addEventListener('click', (e) => {
                const idToDelete = parseInt(e.target.dataset.id);
                currentReportPoints = currentReportPoints.filter(item => item.id !== idToDelete);
                updateTemporaryPointsUI();
            });

            list.appendChild(miniCard);
        });
    }

    // Сохранение всего отчета целиком
    document.getElementById('btn-save-full-report').addEventListener('click', () => {
        if (currentReportPoints.length === 0) {
            alert('Нельзя сохранить пустой отчет! Добавьте хотя бы одну дефектную точку.');
            return;
        }

        // Собираем готовый объект, который полетит в вашу БД / массив
        const finalReport = {
            modelCode: document.getElementById('form-model').value,
            config: document.getElementById('form-config').value,
            area: document.getElementById('form-area').value,
            station: document.getElementById('form-station').value,
            equipment: document.getElementById('form-equipment').value,
            defectsCount: currentReportPoints.length,
            importance: currentReportPoints.some(p => p.importance === 'Важно') ? 'Важно' : 'Обычный',
            date: new Date().toLocaleDateString('ru-RU')
        };

        // Тут вы можете сделать push в ваш глобальный массив или fetch на бэкенд
        // mockReportsData.push(finalReport); 

        initTearDownSection(containerId); // Возврат на главную
    });
}

function showConfirmAlert(text) {
    // 1. Создаем элемент подложки
    const bodyDisabled = document.createElement('div');
    bodyDisabled.className = 'body-disabled';

    // 2. Создаем элемент самого модального окна
    const blockConfirm = document.createElement('div');
    blockConfirm.className = 'block-confirm';

    // 3. Наполняем модальное окно контентом
    blockConfirm.innerHTML = `
        <div style="font-size: 36px; margin-bottom: 10px;">⚠️</div>
        <div style="color: #333333; font-size: 15px; font-weight: 600; line-height: 1.4; margin-bottom: 20px; max-width: 300px;">
            ${text}
        </div>
        <button id="modal-ok-btn" style="
            background-color: #ff4d4d; 
            color: #ffffff; 
            border: none; 
            padding: 10px 20px; 
            font-size: 14px; 
            font-weight: bold; 
            border-radius: 8px; 
            cursor: pointer;
            width: 100%;
            box-shadow: 0 4px 10px rgba(255, 77, 77, 0.2);
            transition: background 0.2s;
        ">ОК</button>
    `;

    // 4. Реализуем вложенность: кладем модалку внутрь подложки
    bodyDisabled.appendChild(blockConfirm);

    // 5. Помещаем подложку со всем содержимым в body
    document.body.appendChild(bodyDisabled);

    // 6. Логика удаления всей конструкции из DOM при нажатии на кнопку "ОК"
    blockConfirm.querySelector('#modal-ok-btn').addEventListener('click', () => {
        bodyDisabled.remove();
    });
}

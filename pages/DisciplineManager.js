class DisciplineManager {
    constructor(browser) {
        this.browser = browser
    }

    get expandTreeButton() {
        return 'button[title="Развернуть дерево элементов"]'
    }

    get treeItems() {
        return '.uptem'
    }

    async expandTree() {
        await this.browser.waitForElementVisible(this.expandTreeButton, 10000)

        for (let i = 0; i < 3; i++) {
            await this.browser.click(this.expandTreeButton)
            await this.browser.pause(500)

            // Проверяем, раскрылось ли дерево
            const count = await this.browser.findElements('.uptem')
            if (count.length > 2) {
                console.log(`✅ Дерево раскрылось после попытки ${i + 1}`)
                break
            }
        }

        await this.browser.pause(1000)
    }

    async waitForTreeExpanded(minExpected = 10, timeout = 10000) {
        await this.browser.waitUntil(async () => {
            const elements = await this.browser.findElements(this.treeItems)
            const count = elements.length
            console.log(`🔍 Ожидание раскрытия дерева... Найдено элементов: ${count}`)
            return count >= minExpected
        }, timeout, `Дерево не раскрылось: найдено меньше ${minExpected} элементов`)

        const finalElements = await this.browser.findElements(this.treeItems)
        return finalElements.length
    }

    //=========================

    get add_element_button() {
        return '#root button.ant-btn-variant-solid.bg-primary-400.p-0'
    }

    get select_discipline() {
        return 'button:nth-child(4) > div'
    }

    get select_input() {
        return '#rc_select_1';
    }

    get first_dropdown_item() {
        return '.rc-virtual-list-holder-inner .ant-select-item-option:first-child';
    }

    section_by_name(name) {
        return `//div[contains(@class, "uptem")]//span[text()="${name}"]`;
    }

    async openAddDialog() {
        await this.browser.waitForElementVisible(this.add_element_button, 10000)
        await this.browser.click(this.add_element_button)
    }

    async selectDisciplineType(type = 'И') {
        const browser = this.browser;

        await browser.waitForElementVisible(this.select_discipline, 10000);
        await browser.click(this.select_discipline);

        await browser.waitForElementVisible(this.select_input, 5000);
        await browser.setValue(this.select_input, type);
        await browser.pause(500);

        await browser.waitForElementVisible(this.first_dropdown_item, 5000);
        await browser.click(this.first_dropdown_item);
    }

    async selectSection(sectionName) {
        const browser = this.browser;

        await browser.useXpath();
        const targetSection = this.section_by_name(sectionName);

        // 1. Ждем и кликаем по нужному разделу
        await browser.waitForElementVisible(targetSection, 1000);
        await browser.click(targetSection);

        // Переключаемся обратно на CSS-селекторы
        await browser.useCss();

        // 2. ВАЖНО: Кликаем по самому верхнему контейнеру модалки, чтобы вернуть фокус ввода
        await browser.execute(function() {
            const event = new KeyboardEvent('keydown', {
                key: 'Escape',
                keyCode: 27,
                code: 'Escape',
                which: 27,
                bubbles: true,
                cancelable: true
            });
            document.activeElement.dispatchEvent(event); // Отправляет ESC в текущий активный элемент
        });

        await browser.waitForElementNotPresent('.ant-modal-content', 3000);
    }

    async isDisciplineInTree(disciplineName) {
        const browser = this.browser;

        await this.waitForTreeExpanded(5, 5000);

        const disciplineXpath = `//*[contains(@class, "uptem")]//span[text()="${disciplineName}"]`;
        await browser.useXpath();

        const result = await browser.findElements(disciplineXpath);
        await browser.useCss();

        if (result.length > 0) {
            console.log(`✅ Дисциплина "${disciplineName}" успешно найдена в дереве элементов!`);
            return true;
        }

        console.log(`❌ Дисциплина "${disciplineName}" отсутствует в дереве.`);
        return false;
    }

    async openEditDiscipline(disciplineName) {
        const browser = this.browser;

        const editIconXpath = `//div[contains(@class, "uptem") and .//span[text()="${disciplineName}"]]//*[local-name()='svg' and @viewBox='0 0 576 512']`;

        await browser.useXpath();
        await browser.waitForElementVisible(editIconXpath, 5000);
        await browser.click(editIconXpath);
        await browser.useCss();
        await browser.pause(500);
    }

    async setSemester(semesterNumber) {
        const browser = this.browser;
        const roman = semesterNumber === '2' ? 'II' : 'I';
        const semesterButton = `//button[./span[text()="${roman}"]]`;
        await browser.pause(500);

        await browser.useXpath();
        await browser.waitForElementVisible(semesterButton, 5000);
        await browser.click(semesterButton);
        await browser.useCss();
        await browser.pause(5000);
    }

    async setHours(semesterNumber, fieldPlaceholder, hoursValue) {
        const browser = this.browser;
        const roman = String(semesterNumber) === '2' ? 'II' : 'I';

        // Приводим название к нижнему регистру для гибкости
        const name = fieldPlaceholder.toLowerCase();
        let searchPhrase = name;

        // Корректируем фразу для поиска в зависимости от того, что пришло из сценария
        if (name.includes('всего')) {
            searchPhrase = 'Всего';
        } else if (name.includes('з.е') || name.includes('зачет')) {
            searchPhrase = 'Зачетны'; // Ищем по плейсхолдеру "Зачетные..." из верстки AntD
        } else if (name.includes('лекци')) {
            searchPhrase = 'Лекции';
        }

        // Ищем строку по кнопке семестра, а внутри нее инпут, у которого placeholder НАЧИНАЕТСЯ или СОДЕРЖИТ нужную фразу
        const hoursInputXpath = `//tr[.//button/span[text()="${roman}"]]//input[contains(@placeholder, "${searchPhrase}")]`;

        await browser.useXpath();
        await browser.waitForElementPresent(hoursInputXpath, 5000);

        // Стабильное очищение числового поля
        await browser.click(hoursInputXpath);
        await browser.setValue(hoursInputXpath, [browser.Keys.CONTROL, 'a']);
        await browser.setValue(hoursInputXpath, browser.Keys.BACK_SPACE);
        await browser.clearValue(hoursInputXpath);

        // Ввод значения
        await browser.setValue(hoursInputXpath, hoursValue);
        await browser.useCss();
    }

    async getHoursValue(semesterNumber, fieldPlaceholder) {
        const browser = this.browser;
        const roman = String(semesterNumber) === '2' ? 'II' : 'I';

        const name = fieldPlaceholder.toLowerCase();
        let searchPhrase = name;

        if (name.includes('всего')) {
            searchPhrase = 'Всего';
        } else if (name.includes('з.е') || name.includes('зачет')) {
            searchPhrase = 'Зачетны';
        } else if (name.includes('лекци')) {
            searchPhrase = 'Лекции';
        }

        const hoursInputXpath = `//tr[.//button/span[text()="${roman}"]]//input[contains(@placeholder, "${searchPhrase}")]`;

        await browser.useXpath();
        await browser.waitForElementPresent(hoursInputXpath, 5000);
        const result = await browser.getValue(hoursInputXpath);
        await browser.useCss();

        return typeof result === 'object' ? result.value : result;
    }

    async deleteDiscipline(disciplineName) {
        const browser = this.browser;

        console.log(`\n=================== СТАРТ УДАЛЕНИЯ ===================`);
        console.log(`[INFO] Удаляем дисциплину: "${disciplineName}"`);

        await browser.useCss();

        // Находим строку, кликаем по корзине прямо через JS внутри браузера
        const clickResult = await browser.execute(function(name) {
            // Находим все строки в дереве
            const rows = document.querySelectorAll('.flex-row, .uptem');

            for (let row of rows) {
                // Ищем строку, которая содержит название дисциплины
                if (row.innerText && row.innerText.includes(name)) {
                    // Ищем svg-корзину. Идентификация по пути Material Design (M6 19c0...)
                    const svg = row.querySelector('svg path[d*="M6 19c0"], svg[viewBox="0 0 24 24"]');

                    if (svg) {
                        // Берем сам элемент SVG, если нашли path
                        const targetSvg = svg.tagName.toLowerCase() === 'path' ? svg.closest('svg') : svg;

                        // Вызываем нативный клик браузера прямо по иконке удаления
                        targetSvg.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                        return 'CLICKED_SUCCESS';
                    }
                }
            }
            return 'NOT_FOUND';
        }, [disciplineName]);

        console.log(`[JS_RESULT] Статус клика по корзине: ${clickResult}`);

        if (clickResult === 'NOT_FOUND') {
            throw new Error(`[ERROR] Не удалось найти корзину для дисциплины: "${disciplineName}"`);
        }

        // Локатор для кнопки ОК в модальном окне
        const confirmButtonXpath = '//button[.//span[text()="OK" or text()="ОК" or text()="Ok"]]';

        try {
            // Ждем появление модального окна подтверждения
            await browser.useXpath();
            await browser.waitForElementPresent(confirmButtonXpath, 5000);
            await browser.waitForElementVisible(confirmButtonXpath, 4000);

            // Кликаем ОК
            await browser.click(confirmButtonXpath);
            console.log(`[SUCCESS] Удаление подтверждено в модальном окне.`);

        } catch (error) {
            console.error(`[ERROR] Ошибка при подтверждении удаления (модалка):`, error.message);
            throw error;
        }

        await browser.useCss();
        await browser.pause(1500); // Ожидаем завершения анимации удаления
        console.log(`=================== КОНЕЦ УДАЛЕНИЯ ===================\n`);
    }




    async saveChanges() {
        const browser = this.browser;
        const acceptButton = '//button[./span[text()="Принять"]]';

        await browser.useXpath();
        await browser.waitForElementVisible(acceptButton, 500);
        await browser.click(acceptButton);
        await browser.useCss();
        await browser.pause(500);
    }
}

module.exports = DisciplineManager
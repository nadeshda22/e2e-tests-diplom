const BasePage = require('./BasePage');

class DisciplineManager extends BasePage {
    constructor(browser) {
        super(browser);
    }

    // ======================== ГЕТТЕРЫ СЕЛЕКТОРОВ ========================

    get expandTreeButton() {
        return 'button[title="Развернуть дерево элементов"]';
    }

    get treeItems() {
        return '.uptem';
    }

    get addElementButton() {
        return '#root button.ant-btn-variant-solid.bg-primary-400.p-0';
    }

    get selectDisciplineButton() {
        return 'button:nth-child(4) > div';
    }

    get selectInput() {
        return '#rc_select_1';
    }

    get firstDropdownItem() {
        return '.rc-virtual-list-holder-inner .ant-select-item-option:first-child';
    }

    sectionByName(name) {
        return `//div[contains(@class, "uptem")]//span[text()="${name}"]`;
    }

    // ======================== РАБОТА С ДЕРЕВОМ ========================

    async expandTree() {
        await this.waitForVisible(this.expandTreeButton, 10000);

        for (let i = 0; i < 3; i++) {
            await this.click(this.expandTreeButton);
            await this.browser.pause(500);

            const count = await this.browser.findElements('.uptem');
            if (count.length > 2) {
                console.log(`✅ Дерево раскрылось после попытки ${i + 1}`);
                await this.takeScreenshot(`tree_expanded_attempt_${i + 1}`);
                break;
            }
        }

        await this.browser.pause(1000);
    }

    async waitForTreeExpanded(minExpected = 10, timeout = 10000) {
        await this.browser.waitUntil(async () => {
            const elements = await this.browser.findElements(this.treeItems);
            const count = elements.length;
            console.log(`🔍 Ожидание раскрытия дерева... Найдено элементов: ${count}`);
            return count >= minExpected;
        }, timeout, `Дерево не раскрылось: найдено меньше ${minExpected} элементов`);

        const finalElements = await this.browser.findElements(this.treeItems);
        await this.takeScreenshot(`tree_expanded_final_${finalElements.length}_elements`);
        return finalElements.length;
    }

    // ======================== ДОБАВЛЕНИЕ ДИСЦИПЛИНЫ ========================

    async openAddDialog() {
        await this.waitForVisible(this.addElementButton, 10000);
        await this.click(this.addElementButton);
        await this.takeScreenshot('add_dialog_opened');
    }

    async selectDisciplineType(type = 'И') {
        await this.waitForVisible(this.selectDisciplineButton, 10000);
        await this.click(this.selectDisciplineButton);

        await this.waitForVisible(this.selectInput, 5000);
        await this.browser.setValue(this.selectInput, type);
        await this.browser.pause(500);

        await this.waitForVisible(this.firstDropdownItem, 5000);
        await this.click(this.firstDropdownItem);
        await this.takeScreenshot(`discipline_type_selected_${type}`);
    }

    async selectSection(sectionName) {
        await this.browser.useXpath();
        const targetSection = this.sectionByName(sectionName);

        await this.waitForVisible(targetSection, 1000);
        await this.click(targetSection);

        await this.browser.useCss();

        await this.browser.execute(function() {
            const event = new KeyboardEvent('keydown', {
                key: 'Escape',
                keyCode: 27,
                code: 'Escape',
                which: 27,
                bubbles: true,
                cancelable: true
            });
            document.activeElement.dispatchEvent(event);
        });

        await this.browser.waitForElementNotPresent('.ant-modal-content', 3000);
        await this.takeScreenshot(`section_selected_${sectionName}`);
    }

    async isDisciplineInTree(disciplineName) {
        await this.waitForTreeExpanded(5, 5000);

        const disciplineXpath = `//*[contains(@class, "uptem")]//span[text()="${disciplineName}"]`;
        await this.browser.useXpath();

        const result = await this.browser.findElements(disciplineXpath);
        await this.browser.useCss();

        if (result.length > 0) {
            console.log(`✅ Дисциплина "${disciplineName}" успешно найдена в дереве элементов!`);
            await this.takeScreenshot(`discipline_found_${disciplineName}`);
            return true;
        }

        console.log(`❌ Дисциплина "${disciplineName}" отсутствует в дереве.`);
        await this.takeScreenshot(`discipline_not_found_${disciplineName}`);
        return false;
    }

    // ======================== РЕДАКТИРОВАНИЕ ДИСЦИПЛИНЫ ========================

    async openEditDiscipline(disciplineName) {
        const editIconXpath = `//div[contains(@class, "uptem") and .//span[text()="${disciplineName}"]]//*[local-name()='svg' and @viewBox='0 0 576 512']`;

        await this.browser.useXpath();
        await this.waitForVisible(editIconXpath, 5000);
        await this.click(editIconXpath);
        await this.browser.useCss();
        await this.browser.pause(500);
        await this.takeScreenshot(`edit_discipline_opened_${disciplineName}`);
    }

    async setSemester(semesterNumber) {
        const roman = semesterNumber === '2' ? 'II' : 'I';
        const semesterButton = `//button[./span[text()="${roman}"]]`;
        await this.browser.pause(500);

        await this.browser.useXpath();
        await this.waitForVisible(semesterButton, 5000);
        await this.click(semesterButton);
        await this.browser.useCss();
        await this.browser.pause(5000);
        await this.takeScreenshot(`semester_set_${roman}`);
    }

    async setHours(semesterNumber, fieldPlaceholder, hoursValue) {
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

        await this.browser.useXpath();
        await this.waitForVisible(hoursInputXpath, 5000);

        await this.click(hoursInputXpath);
        await this.browser.setValue(hoursInputXpath, [this.browser.Keys.CONTROL, 'a']);
        await this.browser.setValue(hoursInputXpath, this.browser.Keys.BACK_SPACE);
        await this.clearValue(hoursInputXpath);
        await this.browser.setValue(hoursInputXpath, hoursValue);

        await this.browser.useCss();
        await this.takeScreenshot(`hours_set_${roman}_${fieldPlaceholder}_${hoursValue}`);
    }

    async getHoursValue(semesterNumber, fieldPlaceholder) {
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

        await this.browser.useXpath();
        await this.waitForVisible(hoursInputXpath, 5000);
        const result = await this.browser.getValue(hoursInputXpath);
        await this.browser.useCss();

        return typeof result === 'object' ? result.value : result;
    }

    async clearValue(selector) {
        const { browser } = this;
        await browser.execute(function(sel) {
            const element = document.querySelector(sel);
            if (element) element.value = '';
        }, [selector]);
    }

    async deleteDiscipline(disciplineName) {
        const disciplineRowXpath = `//div[contains(@class, "uptem")]//span[text()="${disciplineName}"]/ancestor::div[contains(@class, "flex-row")]`;
        await this.browser.useXpath();
        await this.browser.waitForElementVisible(disciplineRowXpath, 5000);

        const trashXpath = `${disciplineRowXpath}//svg[contains(@viewBox, '0 0 24 24')]`;

        try {
            await this.browser.waitForElementVisible(trashXpath, 3000);
            await this.browser.click(trashXpath);
        } catch {
            const clicked = await this.browser.execute(name => {
                const rows = document.querySelectorAll('.flex-row');
                for (const row of rows) {
                    if (row.innerText?.includes(name)) {
                        const svgs = row.querySelectorAll('svg');
                        if (svgs.length > 0) {
                            const lastSvg = svgs[svgs.length - 1]; // последний SVG
                            lastSvg.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            lastSvg.dispatchEvent(new MouseEvent('click', { view: window, bubbles: true }));
                            return true;
                        }
                    }
                }
                return false;
            }, [disciplineName]);

            if (!clicked) {
                await this.takeScreenshot(`trash_not_found_${disciplineName}`);
                throw new Error(`[ERROR] Корзина не найдена для: "${disciplineName}"`);
            }
        }

        await this.browser.pause(500);

        // 3. Ждем модальное окно и нажимаем OK
        let modalFound = false;
        for (let i = 0; i < 10; i++) {
            const modal = await this.browser.execute(() => document.querySelector('.ant-modal-content'));
            if (modal) {
                modalFound = true;
                await this.takeScreenshot(`modal_found_${disciplineName}`);

                const okButtonXpath = '//div[contains(@class, "ant-modal-footer")]//button[contains(@class, "ant-btn-primary")]';
                await this.browser.useXpath();
                await this.browser.waitForElementVisible(okButtonXpath, 3000);
                await this.browser.click(okButtonXpath);
                await this.browser.useCss();
                break;
            }
            await this.browser.pause(500);
        }

        if (!modalFound) {
            const stillExists = await this.isDisciplineInTree(disciplineName);
            if (!stillExists) return;

            await this.takeScreenshot(`modal_not_found_${disciplineName}`);
            throw new Error(`[ERROR] Модальное окно не появилось`);
        }

        await this.browser.pause(1000);
        await this.takeScreenshot(`discipline_deleted_${disciplineName}`);

     }

    // ======================== СОХРАНЕНИЕ ИЗМЕНЕНИЙ ========================

    async saveChanges() {
        const acceptButton = '//button[./span[text()="Принять"]]';

        await this.browser.useXpath();
        await this.waitForVisible(acceptButton, 500);
        await this.click(acceptButton);
        await this.browser.useCss();
        await this.browser.pause(500);
        await this.takeScreenshot('changes_saved');
    }
}

module.exports = DisciplineManager;
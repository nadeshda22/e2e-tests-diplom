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

        await browser.waitForElementVisible(targetSection, 1000);
        await browser.click(targetSection);
        await browser.useCss();
        await browser.keys(browser.keys.ESCAPE);
        await browser.pause(500)
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

}

module.exports = DisciplineManager
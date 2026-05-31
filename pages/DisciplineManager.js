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





}

module.exports = DisciplineManager
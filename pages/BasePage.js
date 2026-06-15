// pages/BasePage.js
const path = require('path');
const fs = require('fs');
const allure = require('allure-commandline');

class BasePage {
    constructor(browser) {
        this.browser = browser;
    }

    async waitForVisible(selector, timeout = 15000) {
        return this.browser.waitForElementVisible(selector, timeout);
    }

    async click(selector) {
        await this.waitForVisible(selector);
        return this.browser.click(selector);
    }

    async getText(selector) {
        await this.waitForVisible(selector);
        return this.browser.getText(selector);
    }

    async takeScreenshot(name, attachToAllure = true) {
        try {
            const cleanName = name.toLowerCase().replace(/[^a-zа-яё0-9]/g, '_');
            const filename = `${cleanName}.png`;
            const filepath = path.resolve('reports/screenshots', filename);

            if (fs.existsSync(filepath) && !attachToAllure) {
                return;
            }

            const dir = path.dirname(filepath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            await this.browser.saveScreenshot(filepath);
            console.log(`📸 ${filename}`);

            // Отправляем в Allure отчёт
            if (attachToAllure && this.allure) {
                const screenshotData = fs.readFileSync(filepath);
                this.allure.attachment(name, screenshotData, 'image/png');
            }

        } catch (err) {
        }
    }
}

module.exports = BasePage;
class BasePage {

    constructor(browser) {
        this.browser = browser;
    }

    async waitForVisible(selector, timeout = 15000) {

        return this.browser.waitForElementVisible(
            selector,
            timeout
        );
    }

    async click(selector) {

        await this.waitForVisible(selector);

        return this.browser.click(selector);
    }

    async getText(selector) {

        await this.waitForVisible(selector);

        return this.browser.getText(selector);
    }

    async takeScreenshot(name) {

        try {

            const timestamp = Date.now();

            const filename =
                `${name}_${timestamp}.png`;

            await this.browser.saveScreenshot(
                `reports/screenshots/${filename}`
            );

            console.log(`📸 Скриншот: ${filename}`);

        } catch (err) {

            console.log(
                '⚠️ Ошибка screenshot:',
                err.message
            );
        }
    }
}

module.exports = BasePage;
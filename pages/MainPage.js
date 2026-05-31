const BasePage = require('./BasePage');

class MainPage extends BasePage {
    constructor(browser) {
        super(browser);
        this.url = 'http://localhost:3001/38/';

        this.selectors = {
            dropdownTrigger: '.ant-dropdown-trigger',
            importMenuItem: 'li[data-menu-id*="import"]:not([data-menu-id*="importdb"])',
            specialtyNumber: 'span.text-sm.font-semibold.whitespace-nowrap'
        };
    }

    async open() {
        await this.browser.url(this.url);
        await this.waitForVisible('body');
        return this;
    }

    async getPageTitle() {
        return this.browser.getTitle();
    }

    async openImportMenu() {
        await this.click(this.selectors.dropdownTrigger);
        await this.browser.pause(500);
        await this.takeScreenshot('import_menu_clicked');
        return this;
    }

    async getSpecialtyNumber() {
        await this.waitForVisible(this.selectors.specialtyNumber);
        const text = await this.getText(this.selectors.specialtyNumber);
        return text;
    }

    async takeScreenshot(name) {
        const timestamp = Date.now();
        const filename = `${name}_${timestamp}.png`;
        await this.browser.saveScreenshot(`reports/screenshots/${filename}`);
    }
}

module.exports = MainPage;
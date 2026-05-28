const BasePage = require('./BasePage');
const path = require('path');
const fs = require('fs');

class ImportModal extends BasePage {

    constructor(browser) {

        super(browser);

        this.selectors = {
            fileInput: 'input[type="file"]',
        };
    }

    async uploadFile(filePath) {

        const absolutePath =
            path.resolve(filePath);

        if (!fs.existsSync(absolutePath)) {

            throw new Error(
                `❌ Файл не найден: ${absolutePath}`
            );
        }

        console.log(
            `📁 Загружаю файл: ${absolutePath}`
        );

        await this.browser.execute(function(selector) {

            const input =
                document.querySelector(selector);

            if (input) {

                input.style.display = 'block';
                input.style.opacity = '1';
                input.style.visibility = 'visible';
                input.style.position = 'fixed';
                input.style.top = '10px';
                input.style.left = '10px';
                input.style.zIndex = '999999';
            }

        }, this.selectors.fileInput);

        await this.browser.pause(500);

        await this.browser.setValue(
            this.selectors.fileInput,
            absolutePath
        );

        console.log('✅ Файл выбран');

        await this.browser.pause(5000);

        await this.takeScreenshot(
            'file_uploaded'
        );
    }
}

module.exports = ImportModal;
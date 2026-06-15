const BasePage = require('./BasePage');
const path = require('path');
const fs = require('fs');

class ImportModal extends BasePage {

    constructor(browser) {

        super(browser);

        this.selectors = {
            fileInput: 'li:nth-child(2) input[type=file]',
        };
    }


    async uploadFile(filePath) {
        const absolutePath = path.resolve(filePath);

        if (!fs.existsSync(absolutePath)) {
            throw new Error(`❌ Файл не найден: ${absolutePath}`);
        }

        const fileContent = fs.readFileSync(absolutePath, 'utf8');
        const fileName = path.basename(absolutePath);

        await this.browser.execute(function(selector, content, name) {
            const input = document.querySelector(selector);
            if (!input) return 'Элемент инпута не найден';

            const blob = new Blob([content], { type: 'application/json' });
            const file = new File([blob], name, { type: 'application/json' });

            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);

            input.files = dataTransfer.files;

            const originalOnClick = input.onclick;
            input.onclick = null;

            const event = new Event('change', { bubbles: true, cancelable: true });

            Object.defineProperty(event, 'target', { writable: false, value: input });

            input.dispatchEvent(event);

            input.onclick = originalOnClick;

            return 'Файл успешно обработан React-компонентом';
        }, [this.selectors.fileInput, fileContent, fileName]);

        await this.browser.pause(1000);
        await this.takeScreenshot('file_imported_successfully');
    }

}

module.exports = ImportModal;
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

    // async uploadFile(filePath) {
    //
    //     const absolutePath =
    //         path.resolve(filePath);
    //
    //     if (!fs.existsSync(absolutePath)) {
    //
    //         throw new Error(
    //             `❌ Файл не найден: ${absolutePath}`
    //         );
    //     }
    //
    //     console.log(
    //         `📁 Загружаю файл: ${absolutePath}`
    //     );
    //
    //     await this.browser.execute(function(selector) {
    //
    //         const input =
    //             document.querySelector(selector);
    //
    //         if (input) {
    //
    //             input.style.display = 'block';
    //             input.style.opacity = '1';
    //             input.style.visibility = 'visible';
    //             input.style.position = 'fixed';
    //             input.style.top = '10px';
    //             input.style.left = '10px';
    //             input.style.zIndex = '999999';
    //         }
    //
    //     }, this.selectors.fileInput);
    //
    //     await this.browser.pause(500);
    //
    //     await this.browser.setValue(
    //         this.selectors.fileInput,
    //         absolutePath
    //     );
    //
    //     console.log('✅ Файл выбран');
    //
    //     await this.browser.pause(5000);
    //
    //     await this.takeScreenshot(
    //         'file_uploaded'
    //     );
    // }

    async uploadFile(filePath) {
        const absolutePath = path.resolve(filePath);

        if (!fs.existsSync(absolutePath)) {
            throw new Error(`❌ Файл не найден: ${absolutePath}`);
        }

        console.log(`📁 Читаю JSON-файл: ${absolutePath}`);

        // Читаем файл как текст (так как это JSON)
        const fileContent = fs.readFileSync(absolutePath, 'utf8');
        const fileName = path.basename(absolutePath);

        console.log(`📁 Инжектирую файл в React-компонент...`);

        // Передаем данные прямо в обработчик onChange
        await this.browser.execute(function(selector, content, name) {
            const input = document.querySelector(selector);
            if (!input) return 'Элемент инпута не найден';

            // 1. Создаем настоящий блоб и файл с контентом
            const blob = new Blob([content], { type: 'application/json' });
            const file = new File([blob], name, { type: 'application/json' });

            // 2. Помещаем файл в DataTransfer
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);

            // Записываем файлы в инпут
            input.files = dataTransfer.files;

            // 3. Хак для обхода сброса в onClick: временно удаляем onClick перед событием change
            const originalOnClick = input.onclick;
            input.onclick = null;

            // 4. Создаем нативное событие change, которое ожидает React
            const event = new Event('change', { bubbles: true, cancelable: true });

            // Специфичный фикс для React: подменяем целевой элемент, чтобы e.target.files был доступен
            Object.defineProperty(event, 'target', { writable: false, value: input });

            // Запускаем onChange(e) -> onImport(e)
            input.dispatchEvent(event);

            // Возвращаем onClick обратно, если нужно
            input.onclick = originalOnClick;

            return 'Файл успешно обработан React-компонентом';
        }, [this.selectors.fileInput, fileContent, fileName]);

        console.log('✅ Файл успешно передан, событие onChange выполнено');

        // Ждем пару секунд, пока React обработает импорт
        await this.browser.pause(1000);
        await this.takeScreenshot('file_imported_successfully');
    }

}

module.exports = ImportModal;
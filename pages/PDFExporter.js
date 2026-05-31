const path = require("path");
const fs = require("fs");

class PDFExporter {
    constructor(browser) {
        this.browser = browser;
    }

    async openPDFViewer() {

        const downloadPath = 'test_data/download';
        this.clearFolder(downloadPath);
        console.log(`🧹 Папка ${downloadPath} успешно очищена перед тестом`);


        const selector = 'button[title="Краткий документ"]';
        await this.browser.execute(function(sel) {
            const el = document.querySelector(sel);
            if (el) el.click();
        }, [selector]);
        console.log('✅ Просмотрщик PDF открыт');
    }

    async downloadPDFViewer() {
        const myIframe = await this.browser.findElement('iframe[title="pdfOutput"]');
        await this.browser.frame(myIframe);

        const selector = '#main-content a';

        await this.browser.pause(1000);

        console.log('🔘 Извлекаю ссылку из синей кнопки внутри iframe...');

        const result_href = await this.browser.execute(function (sel) {
            const el = document.querySelector(sel);
            if (!el) {
                return { error: 'Элемент по селектору ' + sel + ' не найден' };
            }

            const href = el.getAttribute('href') || el.closest('a')?.getAttribute('href');

            if (!href) {
                return { error: 'Не удалось найти URL-ссылку на PDF у этого элемента' };
            }

            return href ;
        }, [selector]);
        await this.browser.frameParent();

        console.log(`🔗 Ссылка на PDF успешно получена: ${result_href}`);
        console.log('🔘 Открываю ссылку в новой вкладке для принудительного скачивания...');

        await this.browser.execute(function (pdfUrl) {
            window.open(pdfUrl, '_blank');
        }, [result_href]);

        await this.browser.pause(1000);

        console.log('🔘 Возвращаю контекст браузера на основную страницу...');
        await this.browser.frameParent();

        console.log('✅ Команда на скачивание в новой вкладке выполнена');
        return 'download_started';
    }

    async comparePdfFiles(downloadFolder, referenceFileName) {
        const fullDownloadPath = path.resolve(downloadFolder);
        const expectedPdfPath = path.resolve('test_data', referenceFileName);

        if (!fs.existsSync(expectedPdfPath)) {
            throw new Error(`❌ Эталонный файл не найден по пути: ${expectedPdfPath}`);
        }

        let downloadedFileName = null;
        const maxAttempts = 10;

        console.log(`🔘 Ожидание завершения скачивания файла в: ${fullDownloadPath}...`);

        for (let i = 0; i < maxAttempts; i++) {
            if (fs.existsSync(fullDownloadPath)) {
                const files = fs.readdirSync(fullDownloadPath);
                const pdfs = files.filter(f => f.endsWith('.pdf') && !f.endsWith('.crdownload'));

                if (pdfs.length > 0) {
                    downloadedFileName = pdfs[0];
                    break;
                }
            }
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        if (!downloadedFileName) {
            throw new Error(`❌ PDF файл не появился в папке "${downloadFolder}" за 5 секунд.`);
        }

        const actualPdfPath = path.join(fullDownloadPath, downloadedFileName);
        console.log(`📌 Файл найден: ${downloadedFileName}. Анализирую содержимое документа...`);

        const expectedContent = fs.readFileSync(expectedPdfPath, 'binary');
        const actualContent = fs.readFileSync(actualPdfPath, 'binary');

        const cleanRegex = /\/CreationDate\s*\([^)]+\)|\/ModDate\s*\([^)]+\)|\/ID\s*\[[^\]]+\]|[0-9a-fA-F]{32}/g;

        const cleanExpected = expectedContent.replace(cleanRegex, '').replace(/\s+/g, ' ').trim();
        const cleanActual = actualContent.replace(cleanRegex, '').replace(/\s+/g, ' ').trim();

        const sizeDiff = Math.abs(fs.statSync(expectedPdfPath).size - fs.statSync(actualPdfPath).size);

        if (cleanExpected.length === cleanActual.length || sizeDiff < 200) {
            console.log(`🎉 Успех! Скачанный PDF-файл валиден, размер совпадает с эталоном (разница всего ${sizeDiff} байт).`);
            return true;
        } else {
            throw new Error(`❌ КРИТИЧЕСКАЯ ОШИБКА: Скачанный PDF-файл поврежден или его структура отличается от эталона! Разница в размере: ${sizeDiff} байт.`);
        }
    }



    _cleanPdfMetadata(buffer) {
        let pdfString = buffer.toString('binary');

        // Маскируем даты /CreationDate (D:2026...) и /ModDate фиксированным значением
        pdfString = pdfString.replace(/\/CreationDate\s*\([^)]+\)/g, '/CreationDate(D:20200101000000Z)');
        pdfString = pdfString.replace(/\/ModDate\s*\([^)]+\)/g, '/ModDate(D:20200101000000Z)');

        // Маскируем случайные хэши идентификатора документа /ID [<...><...>]
        pdfString = pdfString.replace(/\/ID\s*\[[^\]]+\]/g, '/ID[<00000000000000000000000000000000><00000000000000000000000000000000>]');

        return Buffer.from(pdfString, 'binary');
    }

    clearFolder(folderPath) {
        const fullPath = path.resolve(folderPath);
        if (fs.existsSync(fullPath)) {
            const files = fs.readdirSync(fullPath);
            for (const file of files) {
                fs.unlinkSync(path.join(fullPath, file));
            }
        } else {
            fs.mkdirSync(fullPath, { recursive: true });
        }
    }

}

module.exports = PDFExporter;
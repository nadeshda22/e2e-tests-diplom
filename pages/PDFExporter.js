class PDFExporter {
    constructor(browser) {
        this.browser = browser;
    }

    async openPDFViewer() {
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
    }async getFileMd5(filePath) {
        const fileBuffer = fs.readFileSync(filePath);
        return crypto.createHash('md5').update(fileBuffer).digest('hex');
    }

    clearFolder(folderPath) {
        const fullPath = path.resolve(folderPath);
        if (fs.existsSync(fullPath)) {
            const files = fs.readdirSync(fullPath);
            for (const file of files) {
                fs.unlinkSync(path.join(fullPath, file));
            }
        }
    }
}

module.exports = PDFExporter;
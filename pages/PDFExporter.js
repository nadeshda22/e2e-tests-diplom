class PDFExporter {
    constructor(browser) {
        this.browser = browser;
    }

    async openPDFViewer() {
        console.log('🔘 Открываю просмотрщик PDF...');

        const selector = 'button[title="Краткий документ"]';

        // Ждём, пока кнопка станет видимой
        await this.browser.waitForElementVisible(selector, 10000);

        // Кликаем через JavaScript
        await this.browser.execute(function(sel) {
            const el = document.querySelector(sel);
            if (el) el.click();
        }, [selector]);

        console.log('✅ Клик выполнен');
        await this.browser.pause(3000);

        // Проверяем, появился ли pdf-viewer
        const hasViewer = await this.browser.execute(function() {
            return !!document.querySelector('pdf-viewer');
        });

        console.log(`📌 pdf-viewer найден: ${hasViewer}`);

        if (!hasViewer) {
            // Если не нашли, попробуем найти embed или iframe
            const elements = await this.browser.execute(function() {
                return {
                    embed: !!document.querySelector('embed'),
                    iframe: !!document.querySelector('iframe'),
                    object: !!document.querySelector('object'),
                    bodyText: document.body.innerText.substring(0, 200)
                };
            });
            console.log('📌 Другие элементы:', elements);
        }

        console.log('✅ Просмотрщик PDF открыт');
    }

    async downloadPDF() {
        console.log('⏳ Ожидание загрузки PDF viewer...');
        await this.browser.pause(3000);

        const result = await this.browser.execute(function() {
            const viewer = document.querySelector('pdf-viewer');
            if (!viewer) {
                return 'pdf-viewer not found';
            }
            const shadow1 = viewer.shadowRoot;
            if (!shadow1) return 'shadowRoot1 not found';
            const toolbar = shadow1.querySelector('#toolbar');
            if (!toolbar) return 'toolbar not found';
            const shadow2 = toolbar.shadowRoot;
            if (!shadow2) return 'shadowRoot2 not found';
            const saveButton = shadow2.querySelector('cr-icon-button#save');
            if (!saveButton) return 'save button not found';
            saveButton.click();
            return 'clicked';
        });

        console.log('📌 RESULT:', result);
        const status = result.value || result;

        if (status !== 'clicked') {
            throw new Error(`❌ ${status}`);
        }

        console.log('✅ PDF скачан');
    }
}

module.exports = PDFExporter;
const {
    Given,
    When,
    Then
} = require('@cucumber/cucumber');

const path = require('path');
const fs = require('fs');
const { expect } = require('chai');
const MainPage = require('../pages/MainPage');
const ImportModal = require('../pages/ImportModal');
const PDFExporter = require('../pages/PDFExporter');
const DisciplineManager = require('../pages/DisciplineManager');
const screenshotsDir = path.resolve('reports/screenshots');

if (fs.existsSync(screenshotsDir)) {

    const files =
        fs.readdirSync(screenshotsDir);

    for (const file of files) {

        if (file.endsWith('.png')) {

            fs.unlinkSync(
                path.join(
                    screenshotsDir,
                    file
                )
            );
        }
    }

    console.log(
        '🗑️ Старые скриншоты удалены'
    );
}

When(
    'я открываю главную страницу',
    async function () {
        await this.mainPage.open();
    });

Then(
    'заголовок страницы содержит {string}',
    async function (expectedText) {
        const title = await this.mainPage.getPageTitle();
        expect(title).to.include(expectedText);
        await this.mainPage.takeScreenshot('title_verified');
    });

Given(
    'приложение открыто по адресу {string}',
    async function (url) {

        this.mainPage =
            new MainPage(this.browser);

        this.importModal =
            new ImportModal(this.browser);

        this.pdfExporter =
            new PDFExporter(this.browser);

        await this.browser.url(url);
    }
);

When('я нажимаю кнопку импорта', async function () {
    await this.mainPage.openImportMenu();
});

When('я загружаю файл {string}', async function (filePath) {
    this.importModal = new ImportModal(this.browser);
    await this.importModal.uploadFile(filePath);
});

Then('отображается номер специальности', async function () {
    const specialtyNumber = await this.mainPage.getSpecialtyNumber();
    expect(specialtyNumber).to.match(/\d{2}-\d{4}-\d{2}/);
    await this.mainPage.takeScreenshot('specialty_number_found');
});

When(
    'я открываю просмотрщик PDF',
    async function () {

        await this.pdfExporter.openPDFViewer();
    }
);

When(
    'я скачиваю PDF из просмотрщика',
    async function () {

        this.lastPDFPath =
            await this.pdfExporter.downloadPDF();
    }
);

Then(
    'PDF сохраняется в папку {string}',
    async function (folder) {

        const fullPath =
            path.resolve(folder);

        const files =
            fs.readdirSync(fullPath);

        const pdfs =
            files.filter(
                f => f.endsWith('.pdf')
            );

        if (pdfs.length === 0) {

            throw new Error(
                '❌ PDF не найден'
            );
        }

        console.log(
            `✅ PDF найден: ${pdfs[0]}`
        );
    }

);

When('я нажимаю кнопку "Развернуть дерево элементов"', async function () {
    const disciplineManager = new DisciplineManager(this.browser)
    await disciplineManager.expandTree()
})


Then('дерево дисциплин содержит не менее {int} элементов', async function (minCount) {
    // СОЗДАЁМ ЭКЗЕМПЛЯР ПРЯМО ЗДЕСЬ
    const disciplineManager = new DisciplineManager(this.browser)

    // Ждём раскрытия дерева (ждём, пока элементов станет >= minCount)
    const actualCount = await disciplineManager.waitForTreeExpanded(minCount, 10000)

    await this.browser.saveScreenshot(
        path.resolve('reports/screenshots', 'tree_expanded.png')
    )

    expect(actualCount).to.be.at.least(minCount)
    console.log(`✅ Дерево содержит ${actualCount} элементов (минимум ${minCount})`)
})

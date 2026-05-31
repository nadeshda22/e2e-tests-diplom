const path = require('path');
const fs = require('fs');
const { expect } = require('chai');
const MainPage = require('../pages/MainPage');
const ImportModal = require('../pages/ImportModal');
const PDFExporter = require('../pages/PDFExporter');
const DisciplineManager = require('../pages/DisciplineManager')
const screenshotsDir = path.resolve('reports/screenshots');
const {
    Given,
    When,
    Then,
    Before, And
} = require('@cucumber/cucumber');

let disciplineManager
Before(function () {

    disciplineManager =
        new DisciplineManager(this.browser)
})

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

// ========== ШАГИ ДЛЯ ТЕСТА 01  ==========

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
        await this.mainPage.takeScreenshot('title_verified'); });

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

// ========== ШАГИ ДЛЯ ТЕСТА 02  ==========

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

// ========== ШАГИ ДЛЯ ТЕСТА 03  ==========

When(
    'я открываю просмотрщик PDF',
    async function () {
        await this.pdfExporter.openPDFViewer();
    }
);

When(
    'я скачиваю PDF из просмотрщика',
    async function () {
        await this.pdfExporter.downloadPDFViewer();
    }
);

Then(
    'скачанный PDF в папке {string} совпадает с эталоном {string}',
    async function (downloadFolder, referenceFileName) {
        await this.pdfExporter.comparePdfFiles(downloadFolder, referenceFileName);
    }
);


// ========== ШАГИ ДЛЯ ТЕСТА 04  ==========

When('я нажимаю кнопку "Развернуть дерево элементов"', async function () {
    const disciplineManager = new DisciplineManager(this.browser)
    await disciplineManager.expandTree()
})


Then('дерево дисциплин содержит не менее {int} элементов', async function (minCount) {
    const disciplineManager = new DisciplineManager(this.browser)

    // Ждём раскрытия дерева
    const actualCount = await disciplineManager.waitForTreeExpanded(minCount, 10000)

    await this.browser.saveScreenshot(
        require('path').resolve('reports/screenshots', 'tree_expanded.png')
    )

    const { expect } = require('chai')
    expect(actualCount).to.be.at.least(minCount)
    console.log(`✅ Дерево содержит ${actualCount} элементов (минимум ${minCount})`)
})


// ========== ШАГИ ДЛЯ ТЕСТА 05  ==========

When('я нажимаю кнопку добавления элемента плана', async function () {
    await disciplineManager.openAddDialog()
})

When('я выбираю дисциплину с названием {string}', async function (name) {
    await disciplineManager.selectDisciplineType(name);
});

When('я выбираю раздел {string}', async function (section) {
    await disciplineManager.selectSection(section)

})

Then('дисциплина отображается в дереве', async function () {
    const exists =
        await disciplineManager.isDisciplineInTree(
            'Инновации в высшем образовании и современном образовании обучающихся'
        )

    if (!exists) {
        throw new Error('Дисциплина не найдена')
    }

});


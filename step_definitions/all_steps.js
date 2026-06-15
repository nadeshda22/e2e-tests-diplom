const path = require('path');
const fs = require('fs');
const { expect } = require('chai');
const MainPage = require('../pages/MainPage');
const ImportModal = require('../pages/ImportModal');
const PDFExporter = require('../pages/PDFExporter');
const DisciplineManager = require('../pages/DisciplineManager');
const { Given, When, Then, Before, After, AfterAll } = require('@cucumber/cucumber');

const screenshotsDir = path.resolve('reports/screenshots');
let disciplineManager = null;

// ========== ХУКИ ==========

Before(async function (scenario) {
    this.scenarioName = scenario.pickle.name;
    console.log(`\n🎬 Сценарий: ${this.scenarioName}`);
});

// Хук после каждого сценария - для скриншота при падении
After(async function (scenario) {
    if (scenario.result?.status === 'FAILED') {
        console.log(`❌ Сценарий упал: ${this.scenarioName}`);

        // Делаем скриншот ошибки
        if (this.mainPage) {
            await this.mainPage.takeScreenshot(`FAILED_${this.scenarioName}`);
        }
        if (disciplineManager) {
            await disciplineManager.takeScreenshot(`FAILED_${this.scenarioName}`);
        }
    }
});

// Очистка старых скриншотов
if (fs.existsSync(screenshotsDir)) {
    const files = fs.readdirSync(screenshotsDir);
    for (const file of files) {
        if (file.endsWith('.png')) {
            fs.unlinkSync(path.join(screenshotsDir, file));
        }
    }
    console.log('🗑️ Старые скриншоты удалены');
}

// ========== ШАГИ ДЛЯ ТЕСТА 01 ==========

When('я открываю главную страницу', async function () {
    await this.mainPage.open();
});

Then('заголовок страницы содержит {string}', async function (expectedText) {
    const title = await this.mainPage.getPageTitle();
    expect(title).to.include(expectedText);
    await this.mainPage.takeScreenshot('title_verified');
});

Given('приложение открыто по адресу {string}', async function (url) {
    this.mainPage = new MainPage(this.browser);
    this.importModal = new ImportModal(this.browser);
    this.pdfExporter = new PDFExporter(this.browser);

    if (!disciplineManager) {
        disciplineManager = new DisciplineManager(this.browser);
    } else {
        disciplineManager.browser = this.browser;
    }

    await this.browser.url(url);
});

// ========== ШАГИ ДЛЯ ТЕСТА 02 ==========

When('я нажимаю кнопку импорта', async function () {
    await this.mainPage.openImportMenu();
});

When('я загружаю файл {string}', async function (filePath) {
    await this.importModal.uploadFile(filePath);
});

Then('отображается номер специальности', async function () {
    const specialtyNumber = await this.mainPage.getSpecialtyNumber();
    expect(specialtyNumber).to.match(/\d{2}-\d{4}-\d{2}/);
    await this.mainPage.takeScreenshot('specialty_number_found');
});

// ========== ШАГИ ДЛЯ ТЕСТА 03 ==========

When('я открываю просмотрщик PDF', async function () {
    await this.pdfExporter.openPDFViewer();
});

When('я скачиваю PDF из просмотрщика', async function () {
    await this.pdfExporter.downloadPDFViewer();
});

Then('скачанный PDF в папке {string} совпадает с эталоном {string}', async function (downloadFolder, referenceFileName) {
    await this.pdfExporter.comparePdfFiles(downloadFolder, referenceFileName);
});

// ========== ШАГИ ДЛЯ ТЕСТА 04 ==========

When('я нажимаю кнопку "Развернуть дерево элементов"', async function () {
    await disciplineManager.expandTree();
});

Then('дерево дисциплин содержит не менее {int} элементов', async function (minCount) {
    const actualCount = await disciplineManager.waitForTreeExpanded(minCount, 10000);
    await disciplineManager.takeScreenshot(`tree_contains_${actualCount}_elements`);
    expect(actualCount).to.be.at.least(minCount);
    console.log(`✅ Дерево содержит ${actualCount} элементов (минимум ${minCount})`);
});

// ========== ШАГИ ДЛЯ ТЕСТА 05 ==========

When('я нажимаю кнопку добавления элемента плана', async function () {
    await disciplineManager.openAddDialog();
});

When('я выбираю дисциплину с названием {string}', async function (name) {
    await disciplineManager.selectDisciplineType(name);
});

When('я выбираю раздел {string}', async function (section) {
    await disciplineManager.selectSection(section);
});

Then('дисциплина отображается в дереве', async function () {
    const exists = await disciplineManager.isDisciplineInTree(
        'Инновации в высшем образовании и современном образовании обучающихся'
    );
    if (!exists) {
        throw new Error('Дисциплина не найдена');
    }
});

When('я открываю редактирование этой дисциплины', async function () {
    await disciplineManager.openEditDiscipline(
        'Инновации в высшем образовании и современном образовании обучающихся'
    );
});

When('я устанавливаю семестр {string}', async function (semester) {
    await disciplineManager.setSemester(semester);
});

When('я устанавливаю часы {string} в семестре {string} в {string}', async function (fieldType, semester, hours) {
    await disciplineManager.setHours(semester, fieldType, hours);
});

Then('поле часов {string} в семестре {string} должно содержать {string}', async function (fieldType, semester, expectedValue) {
    const currentValue = await disciplineManager.getHoursValue(semester, fieldType);
    const actual = String(currentValue !== undefined && currentValue !== null ? currentValue : '').trim();
    const expected = String(expectedValue).trim();
    if (actual !== expected) {
        throw new Error(`Ошибка валидации! Для семестра ${semester} поля "${fieldType}" ожидалось: "${expected}", а в поле сейчас: "${actual}"`);
    }
    console.log(`✅ Валидация успешна. Семестр ${semester}, поле "${fieldType}" содержит: "${actual}"`);
});

When('я сохраняю изменения', async function () {
    await disciplineManager.saveChanges();
});

When('я удаляю дисциплину {string}', async function (disciplineName) {
    await disciplineManager.deleteDiscipline(disciplineName);
});

Then('дисциплина {string} отсутствует в дереве', async function (disciplineName) {
    const exists = await disciplineManager.isDisciplineInTree(disciplineName);
    if (exists) {
        throw new Error(`Ошибка! Дисциплина "${disciplineName}" всё еще отображается в дереве после удаления`);
    }
    console.log(`✅ Успешно. Дисциплина "${disciplineName}" удалена и отсутствует в дереве.`);
});
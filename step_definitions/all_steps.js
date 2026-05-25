const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');
const path = require('path');
const fs = require('fs');

const screenshotsDir = path.resolve('reports/screenshots');

if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
    console.log(`📁 Создана папка: ${screenshotsDir}`);
} else {
    // Очищаем папку от старых скриншотов (удаляем только файлы, папка остаётся)
    const files = fs.readdirSync(screenshotsDir);
    let deletedCount = 0;
    for (const file of files) {
        const filePath = path.join(screenshotsDir, file);
        if (fs.statSync(filePath).isFile() && file.endsWith('.png')) {
            fs.unlinkSync(filePath);
            deletedCount++;
        }
    }
    if (deletedCount > 0) {
        console.log(`🗑️ Очищена папка: ${screenshotsDir} (удалено ${deletedCount} старых скриншотов)`);
    } else {
        console.log(`📁 Папка уже пуста: ${screenshotsDir}`);
    }
}

// Счётчик для нумерации скриншотов
let screenshotCounter = 0;

// Функция для сохранения скриншота
async function takeScreenshot(browser, name) {
    screenshotCounter++;
    const timestamp = Date.now();
    const filename = `${screenshotCounter}_${name}_${timestamp}.png`;
    const filepath = path.join(screenshotsDir, filename);
    await browser.saveScreenshot(filepath);
    console.log(`📸 Скриншот ${screenshotCounter}: ${filename}`);
}

// ========== GIVEN ==========
Given('приложение открыто по адресу {string}', async function (url) {
    this.url = url;
    await this.browser.url(this.url);
    await this.browser.waitForElementVisible('body', 5000);
    console.log(`✅ Страница открыта: ${url}`);
    await takeScreenshot(this.browser, '01_open_page');
});

// ========== SMOKE STEPS ==========
When('я открываю главную страницу', async function () {
    await this.browser.url(this.url);
    await this.browser.waitForElementVisible('body', 5000);
    await takeScreenshot(this.browser, '02_main_page_loaded');
});

Then('заголовок страницы содержит {string}', async function (expectedText) {
    const title = await this.browser.getTitle();
    console.log(`📄 Заголовок страницы: "${title}"`);
    expect(title).to.include(expectedText);
    await takeScreenshot(this.browser, '03_title_verified');
});

// ========== IMPORT STEPS ==========
When('я нажимаю кнопку импорта', async function () {
    console.log('🔘 Нажимаю кнопку импорта...');

    const trigger = '.ant-dropdown-trigger';
    await this.browser.waitForElementVisible(trigger, 5000);
    await this.browser.click(trigger);
    await this.browser.pause(500);

    const importMenuItem = 'li[data-menu-id*="import"]:not([data-menu-id*="importdb"])';
    await this.browser.waitForElementVisible(importMenuItem, 5000);
    await this.browser.click(importMenuItem);

    console.log('✅ Пункт "Импорт" нажат');
    await this.browser.pause(1000);
    await takeScreenshot(this.browser, '04_import_menu_clicked');
});

When('я загружаю файл {string}', async function (filePath) {
    const absolutePath = path.resolve(filePath);

    if (!fs.existsSync(absolutePath)) {
        await takeScreenshot(this.browser, 'error_file_not_found');
        throw new Error(`❌ Файл не найден: ${absolutePath}`);
    }
    console.log(`📁 Файл существует: ${absolutePath}`);

    const fileInput = 'input[type="file"]';

    // Делаем input видимым
    await this.browser.execute(function(selector) {
        const input = document.querySelector(selector);
        if (input) {
            input.style.display = 'block';
            input.style.opacity = '1';
            input.style.visibility = 'visible';
            input.style.position = 'fixed';
            input.style.top = '10px';
            input.style.left = '10px';
            input.style.zIndex = '999999';
            input.style.width = '300px';
            input.style.height = '30px';
        }
    }, fileInput);

    await this.browser.pause(500);

    // Устанавливаем файл
    try {
        await this.browser.setValue(fileInput, absolutePath);
        console.log('📁 setValue сработал');
    } catch (err) {
        console.log('⚠️ setValue ошибка:', err.message);

        await this.browser.execute(function(selector, filepath) {
            const input = document.querySelector(selector);
            if (input) {
                input.value = filepath;
                const event = new Event('change', { bubbles: true });
                input.dispatchEvent(event);
            }
        }, fileInput, absolutePath);
        console.log('📁 Файл установлен через execute');
    }

    console.log(`✅ Файл загружен: ${absolutePath}`);
    await this.browser.pause(5000);
    await takeScreenshot(this.browser, '05_file_uploaded');
});

Then('отображается номер специальности', async function () {
    console.log('🔍 Ищу номер специальности...');

    await this.browser.pause(2000);

    const selector = 'span.text-sm.font-semibold.whitespace-nowrap';

    try {
        await this.browser.waitForElementVisible(selector, 15000);
        const text = await this.browser.getText(selector);
        console.log(`✅ Номер специальности: "${text}"`);
        expect(text).to.match(/\d{2}-\d{4}-\d{2}/);
        await takeScreenshot(this.browser, '06_specialty_number_found');
    } catch (err) {
        await takeScreenshot(this.browser, 'error_specialty_not_found');
        throw new Error('❌ Номер специальности не найден');
    }
});
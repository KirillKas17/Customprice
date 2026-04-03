function ensureExcelEngine() {
if (typeof ExcelJS === 'undefined') {
showToast('error', 'Модуль Excel не загрузился. Проверьте доступ к CDN.');
return false;
}
return true;
}

function buildFileName(prefix) {
const stamp = getNowStamp().replace(/[: ]/g, '-');
return `${prefix}_${stamp}.xlsx`;
}

function downloadWorkbook(workbook, fileName) {
return workbook.xlsx.writeBuffer().then(buffer => {
const blob = new Blob([buffer], {
type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
});
const link = document.createElement('a');
link.href = URL.createObjectURL(blob);
link.download = fileName;
document.body.appendChild(link);
link.click();
setTimeout(() => {
URL.revokeObjectURL(link.href);
link.remove();
}, 0);
});
}

function applyWorksheetTheme(worksheet, title, subtitle, columnCount) {
worksheet.mergeCells(1, 1, 1, columnCount);
worksheet.getCell(1, 1).value = title;
worksheet.getCell(1, 1).font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
worksheet.getCell(1, 1).alignment = { vertical: 'middle', horizontal: 'left' };
worksheet.getCell(1, 1).fill = {
type: 'pattern',
pattern: 'solid',
fgColor: { argb: 'FFEA580C' }
};

worksheet.mergeCells(2, 1, 2, columnCount);
worksheet.getCell(2, 1).value = subtitle;
worksheet.getCell(2, 1).font = { size: 11, color: { argb: 'FF4B5563' } };
worksheet.getCell(2, 1).alignment = { vertical: 'middle', horizontal: 'left' };

const headerRow = worksheet.getRow(4);
headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
headerRow.fill = {
type: 'pattern',
pattern: 'solid',
fgColor: { argb: 'FF1F2937' }
};

worksheet.views = [{ state: 'frozen', ySplit: 4 }];
}

function applyBorders(row, from = 1, to = row.cellCount) {
for (let index = from; index <= to; index++) {
row.getCell(index).border = {
top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
};
}
}

function setCurrencyColumn(worksheet, colIndex) {
worksheet.getColumn(colIndex).numFmt = '#,##0.00 [$₽-419]';
}

function autosizeColumns(worksheet, minWidth = 12, maxWidth = 36) {
worksheet.columns.forEach(column => {
let width = minWidth;
column.eachCell({ includeEmpty: true }, cell => {
const value = cell.value ? String(cell.value) : '';
width = Math.max(width, Math.min(maxWidth, value.length + 2));
});
column.width = width;
});
}

function getPromoExportRows() {
return promos.flatMap(promo => promo.items.map((item, index) => ({
promoId: promo.id,
createdAt: promo.createdAt,
managerName: promo.managerName,
network: promo.network,
promoName: promo.promoName,
techStatus: getTechStatusLabel(promo.techStatus),
promoStatus: promo.status,
revision: promo.revision || 1,
positionNumber: index + 1,
itemName: item.name,
basePrice: item.basePrice,
promoPrice: item.promoPrice,
discount: item.discount,
startDate: item.startDate,
endDate: item.endDate,
managerComment: promo.resubmissionComment || '',
techComment: promo.techReturnComment || '',
loadedAt: promo.loadedAt || '',
completedAt: promo.taskCompletedAt || '',
processedBy: promo.processedBy || ''
})));
}

async function exportPromosWorkbook() {
if (!ensureExcelEngine()) return;

showToast('info', 'Готовлю Excel с промо...');
const workbook = new ExcelJS.Workbook();
workbook.creator = 'Promo Manager Pro';
workbook.created = new Date();

const summarySheet = workbook.addWorksheet('Реестр промо');
summarySheet.columns = [
{ header: 'ID', key: 'id' },
{ header: 'Дата создания', key: 'createdAt' },
{ header: 'Менеджер', key: 'managerName' },
{ header: 'Сеть', key: 'network' },
{ header: 'Акция', key: 'promoName' },
{ header: 'Статус техника', key: 'techStatus' },
{ header: 'Статус промо', key: 'status' },
{ header: 'Версия', key: 'revision' },
{ header: 'Позиций', key: 'itemsCount' },
{ header: 'Загружено', key: 'loadedAt' },
{ header: 'Задача выполнена', key: 'taskCompletedAt' },
{ header: 'Обработал', key: 'processedBy' },
{ header: 'Комментарий менеджера', key: 'managerComment' },
{ header: 'Комментарий техспециалиста', key: 'techComment' }
];
applyWorksheetTheme(summarySheet, 'Реестр промо-акций', `Выгружено: ${getNowStamp()}`, summarySheet.columns.length);
summarySheet.getRow(4).values = summarySheet.columns.map(col => col.header);

promos.forEach(promo => {
const row = summarySheet.addRow({
id: promo.id,
createdAt: promo.createdAt,
managerName: promo.managerName,
network: promo.network,
promoName: promo.promoName,
techStatus: getTechStatusLabel(promo.techStatus),
status: promo.status,
revision: promo.revision || 1,
itemsCount: promo.items.length,
loadedAt: promo.loadedAt || '',
taskCompletedAt: promo.taskCompletedAt || '',
processedBy: promo.processedBy || '',
managerComment: promo.resubmissionComment || promo.comment || '',
techComment: promo.techReturnComment || ''
});
applyBorders(row);
const statusCell = row.getCell(6);
statusCell.fill = {
type: 'pattern',
pattern: 'solid',
fgColor: { argb: promo.techStatus === 'loaded' ? 'FFD9F99D' : promo.techStatus === 'returned' ? 'FFFECACA' : promo.techStatus === 'in-progress' ? 'FFBFDBFE' : 'FFFDE68A' }
};
});

const itemsSheet = workbook.addWorksheet('Позиции промо');
itemsSheet.columns = [
{ header: 'ID промо', key: 'promoId' },
{ header: 'Дата создания', key: 'createdAt' },
{ header: 'Менеджер', key: 'managerName' },
{ header: 'Сеть', key: 'network' },
{ header: 'Акция', key: 'promoName' },
{ header: 'Статус техника', key: 'techStatus' },
{ header: 'Статус промо', key: 'promoStatus' },
{ header: 'Версия', key: 'revision' },
{ header: '№ позиции', key: 'positionNumber' },
{ header: 'Наименование', key: 'itemName' },
{ header: 'Базовая цена', key: 'basePrice' },
{ header: 'Акционная цена', key: 'promoPrice' },
{ header: 'Скидка %', key: 'discount' },
{ header: 'Дата начала', key: 'startDate' },
{ header: 'Дата окончания', key: 'endDate' },
{ header: 'Комментарий менеджера', key: 'managerComment' },
{ header: 'Комментарий техспециалиста', key: 'techComment' },
{ header: 'Загружено', key: 'loadedAt' },
{ header: 'Задача выполнена', key: 'completedAt' },
{ header: 'Обработал', key: 'processedBy' }
];
applyWorksheetTheme(itemsSheet, 'Позиции промо-акций', `Выгружено: ${getNowStamp()}`, itemsSheet.columns.length);
itemsSheet.getRow(4).values = itemsSheet.columns.map(col => col.header);

getPromoExportRows().forEach(item => {
const row = itemsSheet.addRow(item);
applyBorders(row);
});
setCurrencyColumn(itemsSheet, 11);
setCurrencyColumn(itemsSheet, 12);
itemsSheet.getColumn(13).numFmt = '0.0';

const historySheet = workbook.addWorksheet('История задач');
historySheet.columns = [
{ header: 'ID промо', key: 'promoId' },
{ header: 'Акция', key: 'promoName' },
{ header: 'Менеджер', key: 'managerName' },
{ header: 'Событие', key: 'eventType' },
{ header: 'Дата и время', key: 'eventAt' },
{ header: 'Кто выполнил', key: 'eventBy' },
{ header: 'Комментарий', key: 'eventComment' }
];
applyWorksheetTheme(historySheet, 'История обработки заявок', `Выгружено: ${getNowStamp()}`, historySheet.columns.length);
historySheet.getRow(4).values = historySheet.columns.map(col => col.header);

promos.forEach(promo => {
  (promo.taskEvents || []).forEach(event => {
    const row = historySheet.addRow({
      promoId: promo.id,
      promoName: promo.promoName,
      managerName: promo.managerName,
      eventType: event.type,
      eventAt: event.at,
      eventBy: event.by,
      eventComment: event.comment || ''
    });
    applyBorders(row);
  });
});

autosizeColumns(summarySheet);
autosizeColumns(itemsSheet);
autosizeColumns(historySheet);

await downloadWorkbook(workbook, buildFileName('promo_registry'));
showToast('success', 'Excel с промо выгружен');
}

async function exportBasePricesWorkbook() {
if (!ensureExcelEngine()) return;

showToast('info', 'Готовлю Excel с базовыми ценами...');
const workbook = new ExcelJS.Workbook();
workbook.creator = 'Promo Manager Pro';
workbook.created = new Date();

const priceSheet = workbook.addWorksheet('Базовые цены');
priceSheet.columns = [
{ header: 'SKU', key: 'sku' },
{ header: 'Наименование', key: 'name' },
{ header: 'Категория', key: 'category' },
...priceColumns.map(column => ({ header: priceColumnNames[column], key: column })),
{ header: 'Обновлено', key: 'updated' }
];

applyWorksheetTheme(priceSheet, 'Прайс базовых цен', `Выгружено: ${getNowStamp()}`, priceSheet.columns.length);
priceSheet.getRow(4).values = priceSheet.columns.map(col => col.header);

getFilteredBasePriceEntries().forEach(([sku, data]) => {
const row = priceSheet.addRow({
sku,
name: data.name,
category: getCategoryName(data.category),
'maria-ra': data.prices['maria-ra'],
federal: data.prices.federal,
local: data.prices.local,
distributors: data.prices.distributors,
gorod: data.prices.gorod,
rrc: data.prices.rrc,
rac: data.prices.rac,
updated: data.updated
});
applyBorders(row);
priceColumns.forEach((column, index) => {
const cell = row.getCell(index + 4);
cell.fill = {
type: 'pattern',
pattern: 'solid',
fgColor: { argb: column === 'rrc' || column === 'rac' ? 'FFFDE68A' : 'FFEEF2FF' }
};
});
});

for (let columnIndex = 4; columnIndex <= 10; columnIndex++) {
setCurrencyColumn(priceSheet, columnIndex);
}

const historySheet = workbook.addWorksheet('История изменений');
historySheet.columns = [
{ header: 'Дата и время', key: 'changedAt' },
{ header: 'Пользователь', key: 'changedBy' },
{ header: 'Тип', key: 'scope' },
{ header: 'Действие', key: 'action' },
{ header: 'SKU', key: 'sku' },
{ header: 'Товар', key: 'targetName' },
{ header: 'Канал', key: 'column' },
{ header: 'Старая цена', key: 'oldPrice' },
{ header: 'Новая цена', key: 'newPrice' },
{ header: 'Сводка', key: 'summary' },
{ header: 'Детали', key: 'details' }
];
applyWorksheetTheme(historySheet, 'История изменений прайса', `Выгружено: ${getNowStamp()}`, historySheet.columns.length);
historySheet.getRow(4).values = historySheet.columns.map(col => col.header);

priceVersionHistory.forEach(entry => {
const row = historySheet.addRow({
changedAt: entry.changedAt,
changedBy: entry.changedBy,
scope: entry.scope === 'channel' ? 'Канал' : 'Ячейка',
action: entry.action,
sku: entry.sku || '',
targetName: entry.targetName || '',
column: priceColumnNames[entry.column] || entry.column || '',
oldPrice: entry.oldPrice,
newPrice: entry.newPrice,
summary: entry.summary || '',
details: entry.details || ''
});
applyBorders(row);
});
setCurrencyColumn(historySheet, 8);
setCurrencyColumn(historySheet, 9);

autosizeColumns(priceSheet);
autosizeColumns(historySheet);

await downloadWorkbook(workbook, buildFileName('base_prices'));
showToast('success', 'Excel с базовыми ценами выгружен');
}

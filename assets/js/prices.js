// ==================== BASE PRICES ====================
function loadBasePrices() { filterBasePrices(); }

function refreshBasePrices() {
showToast('info', 'Обновление...');
setTimeout(() => {
loadBasePrices();
showToast('success', 'Обновлено');
}, 1000);
}

function getFilteredBasePriceEntries() {
const nameSearch = document.getElementById('priceNameSearch').value.toLowerCase();
const category = document.getElementById('priceCategory').value;

let filtered = Object.entries(basePricesData).filter(([sku, data]) => {
if (nameSearch && !data.name.toLowerCase().includes(nameSearch)) return false;
if (category && data.category !== category) return false;
return true;
});

filtered.sort((a, b) => {
const col = basePricesSort.column;
const dir = basePricesSort.direction === 'asc' ? 1 : -1;
if (col === 'name') return dir * a[1].name.localeCompare(b[1].name, 'ru');
if (col === 'category') return dir * a[1].category.localeCompare(b[1].category, 'ru');
if (priceColumns.includes(col)) {
return dir * ((a[1].prices[col] || 0) - (b[1].prices[col] || 0));
}
return 0;
});

return filtered;
}

function renderPriceCell(sku, col, data, selectedNetwork) {
const editable = currentRole === 'tech' && priceEditMode;
if (selectedNetwork) {
return `<td class="price-cell" data-sku="${sku}" data-col="${selectedNetwork}">
${editable ? `<input type="number" class="form-control price-input" value="${data.prices[selectedNetwork] || 0}" step="0.01">` : `${(data.prices[selectedNetwork] || 0).toFixed(2)}`}
</td>`;
}

return `<td class="price-cell" data-sku="${sku}" data-col="${col}">
${editable ? `<input type="number" class="form-control price-input" value="${data.prices[col] || 0}" step="0.01">` : `${(data.prices[col] || 0).toFixed(2)}`}
</td>`;
}

function filterBasePrices() {
const selectedNetwork = document.getElementById('priceNetwork').value;
const tableBody = document.getElementById('basePricesTableBody');
const priceCols = document.querySelectorAll('.price-col');
const selectTh = document.getElementById('priceSelectTh');
const bulkControls = document.getElementById('bulkEditControls');

priceCols.forEach(col => {
col.style.display = selectedNetwork && col.dataset.col !== selectedNetwork ? 'none' : 'table-cell';
});

if (currentRole === 'tech') {
selectTh.style.display = 'table-cell';
bulkControls.style.display = priceEditMode ? 'block' : 'none';
} else {
selectTh.style.display = 'none';
bulkControls.style.display = 'none';
}

const filtered = getFilteredBasePriceEntries();
tableBody.innerHTML = filtered.map(([sku, data]) => `
<tr class="${selectedPriceRows.includes(sku) ? 'highlight' : ''}">
${currentRole === 'tech' ? `<td><input type="checkbox" class="checkbox price-checkbox" value="${sku}" ${selectedPriceRows.includes(sku) ? 'checked' : ''} onchange="togglePriceRow('${sku}')"></td>` : ''}
<td><strong>${data.name}</strong><br><small style="color:#6b7280;">SKU ${sku}</small></td>
<td>${getCategoryName(data.category)}</td>
${selectedNetwork
? renderPriceCell(sku, selectedNetwork, data, selectedNetwork)
: priceColumns.map(col => renderPriceCell(sku, col, data, '')).join('')}
<td>${data.updated}</td>
</tr>
`).join('');
}

function toggleEditMode() {
priceEditMode = !priceEditMode;
document.getElementById('editPricesBtn').style.display = priceEditMode ? 'none' : 'inline-flex';
document.getElementById('savePricesBtn').style.display = priceEditMode ? 'inline-flex' : 'none';
document.getElementById('bulkEditControls').style.display = priceEditMode ? 'block' : 'none';
filterBasePrices();
}

function togglePriceRow(sku) {
if (selectedPriceRows.includes(sku)) {
selectedPriceRows = selectedPriceRows.filter(item => item !== sku);
} else {
selectedPriceRows.push(sku);
}
filterBasePrices();
}

function toggleSelectAllPrices() {
const selectAll = document.getElementById('selectAllPrices');
const checkboxes = document.querySelectorAll('.price-checkbox');
selectedPriceRows = selectAll.checked ? Array.from(checkboxes).map(cb => cb.value) : [];
filterBasePrices();
}

function sortBasePrices(column) {
if (basePricesSort.column === column) {
basePricesSort.direction = basePricesSort.direction === 'asc' ? 'desc' : 'asc';
} else {
basePricesSort.column = column;
basePricesSort.direction = 'asc';
}
document.querySelectorAll('.sort-indicator').forEach(el => el.textContent = '');
const indicator = document.getElementById(`sort-${column}`);
if (indicator) indicator.textContent = basePricesSort.direction === 'asc' ? '▲' : '▼';
filterBasePrices();
}

function updatePriceValue(sku, column, newPrice, meta) {
const data = basePricesData[sku];
if (!data || data.prices[column] === undefined) return false;

const oldPrice = data.prices[column];
if (oldPrice === newPrice || Number.isNaN(newPrice)) return false;

data.prices[column] = newPrice;
data.updated = meta.changedAt.split(' ')[0];
recordPriceHistory({
scope: meta.scope,
sku,
column,
oldPrice,
newPrice,
changedBy: meta.changedBy,
changedAt: meta.changedAt,
action: meta.action,
summary: meta.summary,
targetName: data.name,
details: meta.details
});
return true;
}

function applyProportionalUpdates(sku, percent, metaBase) {
['rrc', 'rac'].forEach(column => {
const current = basePricesData[sku].prices[column];
if (current === undefined) return;
const next = parseFloat((current * (1 + percent / 100)).toFixed(2));
updatePriceValue(sku, column, next, {
scope: 'channel',
changedBy: metaBase.changedBy,
changedAt: metaBase.changedAt,
action: 'proportional_update',
summary: `Пропорциональная корректировка ${priceColumnNames[column]}`,
details: metaBase.details
});
});
}

async function applyBulkChange() {
const percent = parseFloat(document.getElementById('bulkPercent').value);
const proportional = document.getElementById('proportionalChange').checked;
const selectedNetwork = document.getElementById('priceNetwork').value;
const mode = document.getElementById('bulkChangeMode').value;

if (Number.isNaN(percent)) {
showToast('error', 'Введите процент изменения');
return;
}

const changedBy = document.getElementById('userName').textContent;
const changedAt = getNowStamp();
let targets = [];

if (mode === 'channel') {
if (!selectedNetwork) {
showToast('warning', 'Для массового изменения по каналу сначала выберите канал продаж');
return;
}
targets = getFilteredBasePriceEntries().map(([sku]) => sku);
} else {
if (!selectedNetwork) {
showToast('warning', 'Для изменения выбранных SKU сначала выберите канал продаж');
return;
}
targets = [...selectedPriceRows];
}

if (targets.length === 0) {
showToast('warning', 'Нет выбранных позиций для изменения');
return;
}

let changesCount = 0;
targets.forEach(sku => {
const current = basePricesData[sku].prices[selectedNetwork];
const next = parseFloat((current * (1 + percent / 100)).toFixed(2));
const changed = updatePriceValue(sku, selectedNetwork, next, {
scope: 'channel',
changedBy,
changedAt,
action: mode === 'channel' ? 'channel_bulk_update' : 'selection_bulk_update',
summary: mode === 'channel' ? `Массовое изменение канала ${priceColumnNames[selectedNetwork]}` : `Изменение выбранных SKU в канале ${priceColumnNames[selectedNetwork]}`,
details: `Изменение на ${percent}% по каналу ${priceColumnNames[selectedNetwork]}`
});
if (changed) changesCount++;
if (changed && proportional) applyProportionalUpdates(sku, percent, { changedBy, changedAt, details: `Изменение на ${percent}%` });
});

showToast('success', `Изменения применены: ${changesCount} цен`);
selectedPriceRows = [];
filterBasePrices();
await syncStateToServer();
}

async function savePriceChanges() {
const inputs = document.querySelectorAll('.price-input');
const changedBy = document.getElementById('userName').textContent;
const changedAt = getNowStamp();
let changesCount = 0;

inputs.forEach(input => {
const cell = input.closest('.price-cell');
const sku = cell.dataset.sku;
const col = cell.dataset.col;
const newPrice = parseFloat(input.value);
const changed = updatePriceValue(sku, col, newPrice, {
scope: 'cell',
changedBy,
changedAt,
action: 'manual_update',
summary: `Ручная корректировка ячейки ${priceColumnNames[col]}`,
details: `Точечное изменение для ${basePricesData[sku].name} в канале ${priceColumnNames[col]}`
});
if (changed) changesCount++;
});

showToast('success', changesCount ? `Цены сохранены: ${changesCount} изменений` : 'Изменений не найдено');
toggleEditMode();
await syncStateToServer();
}

function showVersionHistory() {
const modalBody = document.getElementById('versionHistoryBody');
modalBody.innerHTML = `
<div class="mb-4">
<h3 class="text-lg font-bold text-gray-800 mb-3">Журнал изменений (${priceVersionHistory.length} записей)</h3>
<p class="text-sm text-gray-600">История хранит тип правки, канал, товар, автора и точное время изменения.</p>
</div>
<div class="max-h-96 overflow-y-auto mb-4">
${priceVersionHistory.map(version => {
const isIncrease = version.newPrice > version.oldPrice;
return `
<div class="version-history-item ${version.action === 'rollback' ? 'rollback' : ''}">
<div class="history-tag">${version.scope === 'channel' ? 'Канал' : 'Ячейка'}</div>
<div class="version-history-header">
<span class="version-history-user">${version.changedBy}</span>
<span class="version-history-date">${version.changedAt}</span>
</div>
<div class="version-history-details">
<strong>${version.targetName || basePricesData[version.sku]?.name || version.sku}</strong>
<br>
Канал: ${priceColumnNames[version.column] || version.column}
<br>
${version.summary || ''}
${version.details ? `<br>${version.details}` : ''}
<br>
<span class="version-history-change ${isIncrease ? 'increase' : 'decrease'}">${isIncrease ? '▲' : '▼'} ${version.oldPrice.toFixed(2)} ₽ → ${version.newPrice.toFixed(2)} ₽</span>
</div>
${version.scope === 'cell' && version.action !== 'rollback' ? `
<div class="mt-2">
<button type="button" class="btn-custom small danger" onclick="rollbackPrice(${version.id})">Откатить</button>
</div>` : ''}
</div>`;
}).join('')}
</div>`;
document.getElementById('versionHistoryModal').classList.add('active');
}

async function rollbackPrice(versionId) {
const version = priceVersionHistory.find(item => item.id === versionId);
if (!version) return;

if (!confirm(`Откатить изменение цены для "${basePricesData[version.sku]?.name || version.sku}"?\n\n${priceColumnNames[version.column] || version.column}: ${version.newPrice.toFixed(2)} ₽ → ${version.oldPrice.toFixed(2)} ₽`)) {
return;
}

updatePriceValue(version.sku, version.column, version.oldPrice, {
scope: 'cell',
changedBy: document.getElementById('userName').textContent,
changedAt: getNowStamp(),
action: 'rollback',
summary: `Откат изменения ${priceColumnNames[version.column] || version.column}`,
details: `Откат записи #${versionId}`
});
showToast('success', 'Изменение откатчено');
showVersionHistory();
filterBasePrices();
await syncStateToServer();
}

function getCategoryName(cat) {
return { dairy: 'Молочная продукция', bakery: 'Хлебобулочные', grocery: 'Бакалея', oil: 'Масла' }[cat] || cat;
}

function exportBasePrices() {
return exportBasePricesWorkbook();
}

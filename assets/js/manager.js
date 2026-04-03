// ==================== MANAGER FUNCTIONS ====================
function setupManagerView() {
const networkSelect = document.getElementById('networkSelect');
const filterNetwork = document.getElementById('filterNetwork');
const archiveNetwork = document.getElementById('archiveNetwork');

networkSelect.innerHTML = '<option value="">-- Выберите сеть --</option>';
networks[currentUser].forEach(network => {
networkSelect.innerHTML += `<option value="${network}">${network}</option>`;
});

filterNetwork.innerHTML = '<option value="my">Мои сети</option><option value="">Все сети</option>';
networks[currentUser].forEach(network => {
filterNetwork.innerHTML += `<option value="${network}">${network}</option>`;
});

archiveNetwork.innerHTML = '<option value="">Все сети</option>';
allNetworks.forEach(network => {
archiveNetwork.innerHTML += `<option value="${network}">${network}</option>`;
});
}

function onNetworkChange() {
currentNetwork = document.getElementById('networkSelect').value;
if (currentNetwork) addRow();
}

function startPromoRevision(promoId) {
const promo = getPromoById(promoId);
if (!promo) return;

editingPromoId = promoId;
document.getElementById('networkSelect').value = promo.network;
document.getElementById('promoName').value = promo.promoName;
document.getElementById('promoComment').value = '';
currentNetwork = promo.network;
clearTable();
promo.items.forEach(item => addRow(item.name, item.basePrice));

const rows = document.querySelectorAll('#promoTableBody tr');
rows.forEach((row, index) => {
const item = promo.items[index];
row.querySelector('.promo-price-input').value = item.promoPrice;
row.querySelector('.discount-input').value = item.discount;
row.querySelector('.date-start').value = item.startDate;
row.querySelector('.date-end').value = item.endDate;
});

showSection('createPromoSection');
updateNavTabs(document.querySelector('.nav-tab'));
showToast('info', 'Возврат загружен в форму. После исправления укажите комментарий и отправьте повторно.');
}

function addRow(name = '', basePrice = 0) {
const tbody = document.getElementById('promoTableBody');
const row = document.createElement('tr');
const today = new Date().toISOString().split('T')[0];
const nextMonth = new Date(); nextMonth.setMonth(nextMonth.getMonth() + 1);
const nextMonthStr = nextMonth.toISOString().split('T')[0];
row.innerHTML = `
<td><input type="checkbox" class="checkbox row-checkbox"></td>
<td><input type="text" class="name-input" value="${name}" placeholder="Наименование"></td>
<td><div class="base-price base-price-display">${basePrice > 0 ? basePrice.toFixed(2) : '-'}</div><input type="hidden" class="base-price-value" value="${basePrice}"></td>
<td><input type="number" class="promo-price-input" placeholder="0.00" step="0.01" oninput="calculateDiscount(this)"></td>
<td><input type="number" class="discount-input" placeholder="0" step="0.1" oninput="calculatePrice(this)"></td>
<td><input type="date" class="date-start" value="${today}"></td>
<td><input type="date" class="date-end" value="${nextMonthStr}"></td>
<td><button type="button" class="btn-custom small danger" onclick="deleteRow(this)" style="padding:6px 12px;">Удалить</button></td>
`;
tbody.appendChild(row);
}

function addBulkRows() {
const checkbox = document.getElementById('bulkRowCheckbox');
const countInput = document.getElementById('bulkRowCount');
let count = parseInt(countInput.value) || 0;

if (count < 1) count = 1;
if (count > 30) {
showToast('warning', 'Максимум 30 строк за раз');
count = 30;
countInput.value = 30;
}

for (let i = 0; i < count; i++) {
addRow();
}

showToast('success', `Добавлено ${count} строк`);
checkbox.checked = false;
toggleBulkRowInput();
}

function toggleBulkRowInput() {
const checkbox = document.getElementById('bulkRowCheckbox');
const countInput = document.getElementById('bulkRowCount');
countInput.disabled = !checkbox.checked;
}

function calculateDiscount(input) {
const row = input.closest('tr');
const basePrice = parseFloat(row.querySelector('.base-price-value').value) || 0;
const promoPrice = parseFloat(input.value) || 0;
const discountInput = row.querySelector('.discount-input');
if (basePrice > 0 && promoPrice > 0) {
const discount = ((basePrice - promoPrice) / basePrice * 100).toFixed(1);
discountInput.value = discount;
}
}

function calculatePrice(input) {
const row = input.closest('tr');
const basePrice = parseFloat(row.querySelector('.base-price-value').value) || 0;
const discount = parseFloat(input.value) || 0;
const promoPriceInput = row.querySelector('.promo-price-input');
if (basePrice > 0 && discount > 0) {
const promoPrice = (basePrice * (1 - discount / 100)).toFixed(2);
promoPriceInput.value = promoPrice;
}
}

function deleteRow(btn) { btn.closest('tr').remove(); }
function clearTable() { document.getElementById('promoTableBody').innerHTML = ''; }

function toggleSelectAll() {
const selectAll = document.getElementById('selectAll');
document.querySelectorAll('.row-checkbox').forEach(cb => cb.checked = selectAll.checked);
}

function applyDatesToAll() {
const tbody = document.getElementById('promoTableBody');
const rows = tbody.querySelectorAll('tr');

if (rows.length === 0) {
showToast('warning', 'Нет строк для применения дат');
return;
}

const firstRow = rows[0];
const startDate = firstRow.querySelector('.date-start').value;
const endDate = firstRow.querySelector('.date-end').value;

rows.forEach((row, index) => {
row.querySelector('.date-start').value = startDate;
row.querySelector('.date-end').value = endDate;
row.classList.add('highlight');
setTimeout(() => row.classList.remove('highlight'), 500);
});

showToast('success', `Даты применены ко всем ${rows.length} строкам`);
}

function bulkDelete() {
const checkboxes = document.querySelectorAll('.row-checkbox:checked');
if (checkboxes.length === 0) { showToast('warning', 'Выберите строки'); return; }
if (confirm(`Удалить ${checkboxes.length} строк?`)) {
checkboxes.forEach(cb => cb.closest('tr').remove());
showToast('success', `${checkboxes.length} строк удалено`);
}
}

async function savePromo() {
const network = document.getElementById('networkSelect').value;
const promoName = document.getElementById('promoName').value.trim();
const comment = document.getElementById('promoComment').value.trim();
if (!network) { showToast('error', 'Выберите сеть'); return; }
const rows = document.querySelectorAll('#promoTableBody tr');
const items = [];
rows.forEach(row => {
const name = row.querySelector('.name-input').value.trim();
if (name) {
items.push({
name: name,
basePrice: parseFloat(row.querySelector('.base-price-value').value) || 0,
promoPrice: parseFloat(row.querySelector('.promo-price-input').value) || 0,
discount: parseFloat(row.querySelector('.discount-input').value) || 0,
startDate: row.querySelector('.date-start').value,
endDate: row.querySelector('.date-end').value
});
}
});
if (items.length === 0) { showToast('error', 'Добавьте хотя бы одну позицию'); return; }
if (editingPromoId) {
const promo = getPromoById(editingPromoId);
if (!promo) {
editingPromoId = null;
showToast('error', 'Не удалось найти возвращённую акцию');
return;
}
if (promo.techStatus === 'returned' && !comment) {
showToast('error', 'Для повторной отправки после возврата нужен комментарий менеджера');
return;
}

promo.network = network;
promo.promoName = promoName || 'Без названия';
promo.comment = comment;
promo.items = items;
promo.techStatus = 'pending';
promo.status = 'pending';
promo.requiresManagerComment = false;
promo.resubmissionComment = comment;
promo.revision = (promo.revision || 1) + 1;
promo.returnedAt = null;
promo.returnedBy = null;
promo.loadedAt = null;
promo.processedBy = null;
promo.taskCompletedAt = null;
addTaskEvent(promo, 'resubmitted', comment);
showToast('success', `Исправленная акция отправлена повторно. Позиций: ${items.length}`);
} else {
promos.unshift({
id: getNextPromoId(),
manager: currentUser,
managerName: document.getElementById('userName').textContent,
network,
promoName: promoName || 'Без названия',
comment,
createdAt: formatDate(new Date()),
status: 'pending',
revision: 1,
requiresManagerComment: false,
resubmissionComment: '',
techReturnComment: '',
returnedAt: null,
returnedBy: null,
taskCompletedAt: null,
taskEvents: [{
type: 'created',
at: getNowStamp(),
by: document.getElementById('userName').textContent,
comment: comment || 'Новая заявка'
}],
items,
techStatus: 'pending',
loadedAt: null,
processedBy: null
});
showToast('success', `Промо сохранено! ${items.length} позиций отправлено`);
}
document.getElementById('promoTableBody').innerHTML = '';
document.getElementById('networkSelect').value = '';
document.getElementById('promoName').value = '';
document.getElementById('promoComment').value = '';
currentNetwork = null;
editingPromoId = null;
loadMyPromos();
checkAlerts();
await syncStateToServer();
}

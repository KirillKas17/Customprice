// ==================== MY PROMOS STATUS ====================
function loadMyPromos() {
const tbody = document.getElementById('myPromosTableBody');
const myPromos = promos.filter(p => p.manager === currentUser);

tbody.innerHTML = myPromos.map(promo => `
<tr>
<td>${promo.createdAt}</td>
<td>${promo.network}</td>
<td>
<strong>${promo.promoName}</strong>
${promo.revision > 1 ? `<div class="helper-text">Повторная отправка №${promo.revision - 1}</div>` : ''}
${promo.techReturnComment ? `<div class="helper-text text-red-500">Возврат: ${promo.techReturnComment}</div>` : ''}
${promo.resubmissionComment ? `<div class="helper-text text-sky-600">Комментарий менеджера: ${promo.resubmissionComment}</div>` : ''}
</td>
<td>${promo.items.length}</td>
<td><span class="status-badge ${getTechStatusClass(promo.techStatus)}">${getTechStatusLabel(promo.techStatus)}</span></td>
<td>${promo.loadedAt || '-'}</td>
<td class="flex flex-wrap gap-2">
<button type="button" class="btn-custom small" onclick="viewPromoDetails(${promo.id})">Просмотр</button>
${promo.techStatus === 'returned' ? `<button type="button" class="btn-custom small warning" onclick="startPromoRevision(${promo.id})">Исправить</button>` : ''}
</td>
</tr>
`).join('');
}

// ==================== ACTIVE PROMOS ====================
function loadActivePromos() {
const tbody = document.getElementById('activePromosTableBody');
const filterNetwork = document.getElementById('filterNetwork').value;
const filterStatus = document.getElementById('filterStatus').value;
const filterSku = document.getElementById('filterSku').value.toLowerCase();
const today = new Date();
let activeCount = 0, expiringCount = 0, expiredCount = 0, totalItems = 0;

const filteredPromos = promos.filter(p => {
if (filterNetwork === 'my' && p.manager !== currentUser) return false;
if (filterNetwork && filterNetwork !== 'my' && p.network !== filterNetwork) return false;
if (filterStatus && p.status !== filterStatus) return false;
if (filterSku && !p.items.some(i => i.name.toLowerCase().includes(filterSku))) return false;
return p.techStatus === 'loaded';
});

tbody.innerHTML = filteredPromos.flatMap(promo => promo.items.map(item => {
const endDate = new Date(item.endDate);
const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
let status = 'active';
let statusText = 'Активно';
if (daysLeft < 0) {
status = 'expired';
statusText = 'Просрочено';
expiredCount++;
} else if (daysLeft <= 3) {
status = 'expiring';
statusText = 'Заканчивается';
expiringCount++;
} else {
activeCount++;
}
totalItems++;

return `<tr>
<td><strong>${promo.network}</strong></td>
<td>${promo.promoName}</td>
<td>${item.name}</td>
<td>${item.basePrice.toFixed(2)}</td>
<td>${item.promoPrice.toFixed(2)}</td>
<td>${item.startDate} — ${item.endDate}</td>
<td><span class="${daysLeft <= 3 && daysLeft >= 0 ? 'status-badge expiring' : daysLeft < 0 ? 'status-badge expired' : ''}">${daysLeft < 0 ? 'Просрочено' : daysLeft + ' дн.'}</span></td>
<td><span class="status-badge ${status}">${statusText}</span></td>
</tr>`;
})).join('');

document.getElementById('statActive').textContent = activeCount;
document.getElementById('statExpiring').textContent = expiringCount;
document.getElementById('statExpired').textContent = expiredCount;
document.getElementById('statTotalItems').textContent = totalItems;
}

function applyFilters() { loadActivePromos(); }

// ==================== PROMOTIONAL PRICES (NEW) ====================
function sortPromoPrices(column) {
if (promoPricesSort.column === column) {
promoPricesSort.direction = promoPricesSort.direction === 'asc' ? 'desc' : 'asc';
} else {
promoPricesSort.column = column;
promoPricesSort.direction = 'asc';
}

document.querySelectorAll('.promo-price-sort').forEach(el => el.textContent = '');
const indicator = document.getElementById(`promo-sort-${column}`);
if (indicator) {
indicator.textContent = promoPricesSort.direction === 'asc' ? '▲' : '▼';
}
loadPromoPrices();
}

function loadPromoPrices() {
const tbody = document.getElementById('promoPricesTableBody');
const network = document.getElementById('promoPriceNetwork').value;
const manager = document.getElementById('promoPriceManager').value;
const search = document.getElementById('promoPriceSearch').value.toLowerCase();
const today = new Date();

const networkSelect = document.getElementById('promoPriceNetwork');
if (networkSelect.options.length === 1) {
networkSelect.innerHTML += '<option value="all">Все сети</option>';
allNetworks.forEach(net => {
networkSelect.innerHTML += `<option value="${net}">${net}</option>`;
});
}

const sourcePromos = promos.filter(promo => {
if (promo.techStatus !== 'loaded') return false;
if (network && network !== 'all' && promo.network !== network) return false;
if (manager && promo.manager !== manager) return false;
return true;
});

let allItems = [];
sourcePromos.forEach(promo => {
promo.items.forEach(item => {
const endDate = new Date(item.endDate);
const startDate = new Date(item.startDate);
const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
const isActive = startDate <= today && endDate >= today;

if (search && !item.name.toLowerCase().includes(search)) return;

allItems.push({
network: promo.network,
managerName: promo.managerName,
name: item.name,
basePrice: item.basePrice,
promoPrice: item.promoPrice,
discount: item.discount,
startDate: item.startDate,
endDate: item.endDate,
daysLeft,
isActive,
promoName: promo.promoName
});
});
});

const dir = promoPricesSort.direction === 'asc' ? 1 : -1;
allItems.sort((a, b) => {
if (promoPricesSort.column === 'basePrice' || promoPricesSort.column === 'promoPrice' || promoPricesSort.column === 'discount' || promoPricesSort.column === 'daysLeft') {
return dir * ((a[promoPricesSort.column] || 0) - (b[promoPricesSort.column] || 0));
}
return dir * String(a[promoPricesSort.column] || '').localeCompare(String(b[promoPricesSort.column] || ''), 'ru');
});

if (allItems.length === 0) {
tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: #6b7280;">Нет данных для выбранных фильтров</td></tr>';
return;
}

tbody.innerHTML = allItems.map(item => {
const statusClass = item.isActive ? 'active' : item.daysLeft < 0 ? 'expired' : 'expiring';
const statusText = item.isActive ? 'Активно' : item.daysLeft < 0 ? 'Просрочено' : 'Скоро начнётся';

return `
<tr>
<td><strong>${item.network}</strong><br><small style="color: #6b7280;">${item.managerName}</small></td>
<td><strong>${item.name}</strong><br><small style="color: #6b7280;">${item.promoName}</small></td>
<td>${item.basePrice.toFixed(2)} ₽</td>
<td>${item.promoPrice.toFixed(2)} ₽</td>
<td>${item.discount}%</td>
<td>${item.startDate} — ${item.endDate}</td>
<td class="${item.daysLeft <= 3 && item.daysLeft >= 0 ? 'text-orange-600 font-semibold' : item.daysLeft < 0 ? 'text-red-600 font-semibold' : ''}">${item.daysLeft < 0 ? 'Просрочено' : item.daysLeft + ' дн.'}</td>
<td><span class="status-badge ${statusClass}">${statusText}</span></td>
<td>${item.managerName}</td>
</tr>
`;
}).join('');
}

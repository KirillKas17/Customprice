// ==================== MODAL ====================
function getFilteredModalItems(promo) {
const search = (techTaskViewState.search || '').toLowerCase();
return promo.items.filter(item => !search || item.name.toLowerCase().includes(search));
}

function renderPromoModalTableRows(items) {
return items.map(item => `<tr>
<td><strong>${item.name}</strong></td>
<td>${item.basePrice.toFixed(2)}</td>
<td>${item.promoPrice.toFixed(2)}</td>
<td>${item.discount}%</td>
<td>${item.startDate} — ${item.endDate}</td>
</tr>`).join('');
}

function renderPromoModal(promoId, mode = 'details') {
const promo = getPromoById(promoId);
if (!promo) return;

techTaskViewState.promoId = promoId;
techTaskViewState.mode = mode;
const filteredItems = getFilteredModalItems(promo);
const pageSize = 5;
const totalPages = Math.max(Math.ceil(filteredItems.length / pageSize), 1);
if (techTaskViewState.page > totalPages) techTaskViewState.page = totalPages;
if (techTaskViewState.page < 1) techTaskViewState.page = 1;
const startIndex = (techTaskViewState.page - 1) * pageSize;
const pageItems = filteredItems.slice(startIndex, startIndex + pageSize);

document.getElementById('promoModalTitle').textContent = mode === 'work' || mode === 'return' ? 'Заявка технического специалиста' : 'Детали промо-акции';

const actionBlock = currentRole === 'tech' && (mode === 'work' || mode === 'return') ? `
<div class="modal-note">
Задача открыта в полном режиме: доступны поиск по позициям, страничная навигация и действия по заявке.
</div>
${mode === 'return' ? `
<div class="return-box">
<label class="block mb-2 font-semibold text-gray-700 text-sm">Комментарий для возврата менеджеру:</label>
<textarea id="returnComment" class="form-control" placeholder="Опишите, что нужно исправить"></textarea>
<p class="helper-text">Комментарий обязателен. Он будет виден менеджеру при повторной отправке.</p>
</div>` : ''}
<div class="flex flex-wrap gap-2 mt-4">
<button type="button" class="btn-custom small success" onclick="confirmLoad(${promo.id})">Загружено</button>
${mode === 'return'
? `<button type="button" class="btn-custom small danger" onclick="returnPromoToManager(${promo.id})">Подтвердить возврат</button><button type="button" class="btn-custom small" onclick="renderPromoModal(${promo.id}, 'work')">Назад к задаче</button>`
: `<button type="button" class="btn-custom small warning" onclick="renderPromoModal(${promo.id}, 'return')">Вернуть</button>`}
</div>
` : '';

document.getElementById('promoModalBody').innerHTML = `
<div class="mb-6">
<h3 class="text-xl font-bold text-gray-800 mb-2">${promo.network} — ${promo.promoName}</h3>
<p class="text-gray-600">Менеджер: ${promo.managerName} | Создано: ${promo.createdAt}</p>
${promo.comment ? `<p class="text-indigo-600 mt-3">${promo.comment}</p>` : ''}
${promo.techReturnComment ? `<p class="text-red-500 mt-3"><strong>Комментарий техспециалиста:</strong> ${promo.techReturnComment}</p>` : ''}
${promo.resubmissionComment ? `<p class="text-sky-600 mt-2"><strong>Комментарий менеджера:</strong> ${promo.resubmissionComment}</p>` : ''}
</div>
<div class="task-meta-grid">
<div class="task-meta-chip"><strong>Статус:</strong> ${getTechStatusLabel(promo.techStatus)}</div>
<div class="task-meta-chip"><strong>Повтор:</strong> ${promo.revision > 1 ? `Да, версия ${promo.revision}` : 'Нет'}</div>
<div class="task-meta-chip"><strong>Загружено:</strong> ${promo.loadedAt || 'Ещё нет'}</div>
<div class="task-meta-chip"><strong>Выполнено:</strong> ${promo.taskCompletedAt || 'Ещё нет'}</div>
<div class="task-meta-chip"><strong>Обработал:</strong> ${promo.processedBy || 'Не назначено'}</div>
</div>
<div class="modal-search-bar">
<input type="text" id="promoModalSearch" class="form-control" placeholder="Поиск по наименованию" value="${techTaskViewState.search}" oninput="updatePromoModalSearch(this.value)">
<div class="pagination-label">Позиций: ${filteredItems.length} из ${promo.items.length}</div>
</div>
<div class="table-container">
<table class="data-table">
<thead><tr><th>Наименование</th><th>Базовая цена</th><th>Акционная цена</th><th>Скидка</th><th>Период</th></tr></thead>
<tbody>
${pageItems.length ? renderPromoModalTableRows(pageItems) : '<tr><td colspan="5" style="text-align:center; padding: 30px; color: #6b7280;">Ничего не найдено</td></tr>'}
</tbody>
</table>
</div>
<div class="pagination-bar">
<div class="pagination-label">Страница ${techTaskViewState.page} из ${totalPages}</div>
<div class="flex gap-2">
<button type="button" class="btn-custom small" onclick="changePromoModalPage(-1)" ${techTaskViewState.page === 1 ? 'disabled' : ''}>Назад</button>
<button type="button" class="btn-custom small" onclick="changePromoModalPage(1)" ${techTaskViewState.page === totalPages ? 'disabled' : ''}>Далее</button>
</div>
</div>
${actionBlock}
${promo.loadedAt ? `<div class="mt-6 p-4 rounded-2xl bg-green-100 shadow-inner"><strong>Загружено:</strong> ${promo.loadedAt}<br><strong>Обработал:</strong> ${promo.processedBy}<br><strong>Задача выполнена:</strong> ${promo.taskCompletedAt || promo.loadedAt}</div>` : ''}
`;

document.getElementById('promoModal').classList.add('active');
}

function openPromoModal(promoId, mode = 'details') {
techTaskViewState = { promoId, page: 1, search: '', mode };
renderPromoModal(promoId, mode);
}

function viewPromoDetails(promoId) {
openPromoModal(promoId, 'details');
}

function updatePromoModalSearch(value) {
techTaskViewState.search = value;
techTaskViewState.page = 1;
renderPromoModal(techTaskViewState.promoId, techTaskViewState.mode);
}

function changePromoModalPage(step) {
techTaskViewState.page += step;
renderPromoModal(techTaskViewState.promoId, techTaskViewState.mode);
}

function closeModal(modalId) {
document.getElementById(modalId).classList.remove('active');
if (modalId === 'promoModal') {
techTaskViewState = { promoId: null, page: 1, search: '', mode: 'details' };
}
}

// ==================== ALERTS & TOASTS ====================
function checkAlerts() {
const today = new Date();
const alerts = [];
promos.forEach(promo => {
if (promo.manager === currentUser && promo.techStatus === 'loaded') {
promo.items.forEach(item => {
const endDate = new Date(item.endDate);
const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
if (daysLeft === 3) alerts.push({ type: 'warning', message: `Промо "${promo.promoName}" (${promo.network}) заканчивается через 3 дня!` });
else if (daysLeft < 0) alerts.push({ type: 'danger', message: `Промо "${promo.promoName}" (${promo.network}) просрочено!` });
});
}

if (promo.manager === currentUser && promo.techStatus === 'returned') {
alerts.push({ type: 'warning', message: `Акция "${promo.promoName}" возвращена техспециалистом. Нужен комментарий менеджера для повторной отправки.` });
}
});

if (currentRole === 'tech') {
const pendingCount = promos.filter(p => p.techStatus === 'pending').length;
if (pendingCount > 0) alerts.push({ type: 'info', message: `${pendingCount} заявок ожидают обработки` });
}

const container = document.getElementById('alertsContainer');
container.innerHTML = alerts.map((alert, index) => `
<div class="alert alert-${alert.type}" id="alert-${index}">
<span>${alert.message}</span>
<button class="alert-close" onclick="closeAlert(${index})">&times;</button>
</div>
`).join('');
}

function closeAlert(index) {
const alert = document.getElementById(`alert-${index}`);
if (alert) {
alert.style.animation = 'slideIn 0.3s ease reverse';
setTimeout(() => alert.remove(), 300);
}
}

function showToast(type, message) {
const container = document.getElementById('toastContainer');
const toast = document.createElement('div');
toast.className = `toast ${type}`;
toast.innerHTML = `<span>${message}</span>`;
container.appendChild(toast);
setTimeout(() => {
toast.style.animation = 'toastSlide 0.3s ease reverse';
setTimeout(() => toast.remove(), 300);
}, 4000);
}

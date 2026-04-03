// ==================== TECH SPECIALIST ====================
function setupTechView() {}

function renderTaskPreviewItems(promo) {
const previewItems = promo.items.slice(0, 2);
const hiddenText = getTaskPreviewText(promo.items);

return `
<div class="tech-task-items">
<h4 class="font-semibold text-gray-700 text-sm mb-3">Первые позиции:</h4>
${previewItems.map(item => `<div class="tech-item-row">
<span><strong>Наименование:</strong> ${item.name}</span>
<span>Базовая: ${item.basePrice.toFixed(2)}</span>
<span>Акционная: ${item.promoPrice.toFixed(2)}</span>
<span>${item.startDate} — ${item.endDate}</span>
</div>`).join('')}
${hiddenText ? `<div class="tech-preview-note">Показаны 2 позиции, ${hiddenText}</div>` : ''}
</div>
`;
}

function loadTechTasks() {
const container = document.getElementById('techTasksContainer');
const filterStatus = document.getElementById('techFilterStatus').value;
const filteredPromos = promos.filter(promo => !filterStatus || promo.techStatus === filterStatus);
let pending = 0;
let inProgress = 0;
let loaded = 0;
let returned = 0;

container.innerHTML = filteredPromos.map(promo => {
if (promo.techStatus === 'pending') pending++;
if (promo.techStatus === 'in-progress') inProgress++;
if (promo.techStatus === 'loaded') loaded++;
if (promo.techStatus === 'returned') returned++;

return `<div class="tech-task-card ${promo.techStatus === 'loaded' ? 'loaded' : ''}">
<div class="flex justify-between items-start mb-4">
<div>
<h3 class="font-bold text-gray-800">${promo.network} — ${promo.promoName}</h3>
<p class="text-gray-600 text-sm">Менеджер: ${promo.managerName} | Создано: ${promo.createdAt} | Позиций: ${promo.items.length}</p>
${promo.comment ? `<p class="text-indigo-600 text-sm mt-1">${promo.comment}</p>` : ''}
${promo.techReturnComment ? `<p class="text-red-500 text-sm mt-1"><strong>Последний возврат:</strong> ${promo.techReturnComment}</p>` : ''}
${promo.resubmissionComment ? `<p class="text-sky-600 text-sm mt-1"><strong>Комментарий менеджера:</strong> ${promo.resubmissionComment}</p>` : ''}
${getPromoReturnBadge(promo) ? `<span class="history-tag mt-2">${getPromoReturnBadge(promo)}</span>` : ''}
</div>
<span class="status-badge ${getTechStatusClass(promo.techStatus)}">${getTechStatusLabel(promo.techStatus)}</span>
</div>
${renderTaskPreviewItems(promo)}
<div class="flex flex-wrap gap-2">
${promo.techStatus === 'pending' ? `<button type="button" class="btn-custom small" onclick="startTaskFromCard(${promo.id})">В работу</button>` : ''}
${promo.techStatus === 'in-progress' ? `<button type="button" class="btn-custom small success" onclick="openPromoModal(${promo.id}, 'work')">Просмотр</button><button type="button" class="btn-custom small warning" onclick="openPromoModal(${promo.id}, 'return')">Вернуть</button>` : ''}
${promo.techStatus === 'loaded' ? `<span class="text-green-600 font-semibold">Загружено ${promo.loadedAt}</span><button type="button" class="btn-custom small" onclick="viewPromoDetails(${promo.id})">Просмотр</button>` : ''}
${promo.techStatus === 'returned' ? `<button type="button" class="btn-custom small warning" onclick="viewPromoDetails(${promo.id})">Просмотр возврата</button>` : ''}
</div>
</div>`;
}).join('');

document.getElementById('techStatPending').textContent = pending;
document.getElementById('techStatInProgress').textContent = inProgress;
document.getElementById('techStatDone').textContent = loaded;
document.getElementById('techStatTotal').textContent = pending + inProgress + loaded + returned;
document.getElementById('pendingBadge').textContent = pending;
}

async function startTaskFromCard(promoId) {
const promo = getPromoById(promoId);
if (!promo) return;
promo.techStatus = 'in-progress';
promo.status = 'pending';
promo.startedAt = getNowStamp();
promo.startedBy = document.getElementById('userName').textContent;
addTaskEvent(promo, 'started', 'Взято в работу');
loadTechTasks();
openPromoModal(promoId, 'work');
checkAlerts();
showToast('success', 'Заявка переведена в работу');
await syncStateToServer();
}

async function returnPromoToManager(promoId) {
const promo = getPromoById(promoId);
const commentField = document.getElementById('returnComment');
const comment = commentField ? commentField.value.trim() : '';

if (!promo) return;
if (!comment) {
showToast('error', 'Для возврата нужен обязательный комментарий технического специалиста');
return;
}

promo.techStatus = 'returned';
promo.status = 'returned';
promo.techReturnComment = comment;
promo.returnedAt = getNowStamp();
promo.returnedBy = document.getElementById('userName').textContent;
promo.requiresManagerComment = true;
promo.taskCompletedAt = null;
promo.loadedAt = null;
promo.processedBy = null;
addTaskEvent(promo, 'returned', comment);

closeModal('promoModal');
loadTechTasks();
checkAlerts();
showToast('warning', `Акция возвращена менеджеру ${promo.managerName}`);
await syncStateToServer();
}

async function confirmLoad(promoId) {
const promo = getPromoById(promoId);
if (!promo) return;

promo.techStatus = 'loaded';
promo.status = 'active';
promo.loadedAt = getNowStamp();
promo.taskCompletedAt = promo.loadedAt;
promo.processedBy = document.getElementById('userName').textContent;
promo.requiresManagerComment = false;
addTaskEvent(promo, 'loaded', 'Загрузка завершена');

closeModal('promoModal');
showToast('success', 'Промо загружено!');
loadTechTasks();
checkAlerts();
await syncStateToServer();
}

function loadTechHistory() {
const tbody = document.getElementById('techHistoryTableBody');
const dateFrom = document.getElementById('techHistoryFrom').value;
const dateTo = document.getElementById('techHistoryTo').value;
const manager = document.getElementById('techHistoryManager').value;
const loadedPromos = promos.filter(promo => {
if (promo.techStatus !== 'loaded') return false;
if (dateFrom && promo.loadedAt < dateFrom) return false;
if (dateTo && promo.loadedAt > `${dateTo} 23:59`) return false;
if (manager && promo.manager !== manager) return false;
return true;
});

tbody.innerHTML = loadedPromos.map(promo => `
<tr>
<td>${promo.loadedAt}</td>
<td>${promo.managerName}</td>
<td>${promo.network}</td>
<td>${promo.items.length}</td>
<td>${promo.taskCompletedAt || promo.loadedAt}</td>
<td><span class="status-badge loaded">Загружено</span></td>
</tr>
`).join('');
}

function exportTechHistory() {
showToast('info', 'Формирование...');
setTimeout(() => showToast('success', 'Отчёт загружен'), 1500);
}

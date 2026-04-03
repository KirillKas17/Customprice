let stateVersion = null;
let storageInitialized = false;
let storageMode = 'local';

function getSerializableState() {
return {
basePricesData,
priceVersionHistory,
promos
};
}

function applySerializableState(state) {
Object.keys(basePricesData).forEach(key => delete basePricesData[key]);
Object.assign(basePricesData, state.basePricesData || {});
priceVersionHistory = state.priceVersionHistory || [];
promos = state.promos || [];
}

function snapshotSerializableState() {
return JSON.parse(JSON.stringify(getSerializableState()));
}

async function fetchServerState() {
const response = await fetch('/api/state');
if (response.status === 404) return null;
if (!response.ok) throw new Error('state_fetch_failed');
return response.json();
}

async function initializeStorage() {
if (storageInitialized) return true;

try {
const serverState = await fetchServerState();
if (serverState && serverState.state) {
applySerializableState(serverState.state);
stateVersion = serverState.version;
storageMode = 'sqlite';
storageInitialized = true;
return true;
}

const seedResponse = await fetch('/api/state', {
method: 'PUT',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({
baseVersion: null,
updatedAt: getNowStamp(),
state: getSerializableState()
})
});

if (seedResponse.ok) {
const seedResult = await seedResponse.json();
stateVersion = seedResult.version;
storageMode = 'sqlite';
}
} catch (error) {
console.warn('SQLite storage unavailable, using local memory', error);
storageMode = 'local';
}

storageInitialized = true;
return storageMode === 'sqlite';
}

async function syncStateToServer() {
if (storageMode !== 'sqlite') return true;

const response = await fetch('/api/state', {
method: 'PUT',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({
baseVersion: stateVersion,
updatedAt: getNowStamp(),
state: getSerializableState()
})
});

if (response.ok) {
const result = await response.json();
stateVersion = result.version;
return true;
}

if (response.status === 409) {
const conflict = await response.json();
if (conflict.state) {
applySerializableState(conflict.state);
stateVersion = conflict.version;
}
showToast('error', 'Конфликт изменений: данные обновлены другим пользователем. Экран перезагружен на актуальную версию.');
refreshCurrentView();
return false;
}

showToast('error', 'Не удалось сохранить изменения в SQLite');
return false;
}

function refreshCurrentView() {
if (currentRole === 'manager') {
loadMyPromos();
loadActivePromos();
loadArchive();
filterBasePrices();
return;
}
loadTechTasks();
loadTechHistory();
loadPromoPrices();
filterBasePrices();
}

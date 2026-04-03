// ==================== ARCHIVE ====================
function loadArchive() {
const tbody = document.getElementById('archiveTableBody');
const dateFrom = document.getElementById('archiveDateFrom').value;
const dateTo = document.getElementById('archiveDateTo').value;
const network = document.getElementById('archiveNetwork').value;
const search = document.getElementById('archiveSearch').value.toLowerCase();
const filteredPromos = promos.filter(p => {
if (p.status !== 'expired' && p.status !== 'loaded') return false;
if (dateFrom && p.createdAt < dateFrom) return false;
if (dateTo && p.createdAt > dateTo) return false;
if (network && p.network !== network) return false;
if (search && !p.promoName.toLowerCase().includes(search) && !p.items.some(i => i.name.toLowerCase().includes(search))) return false;
return true;
});
tbody.innerHTML = filteredPromos.map(promo => `
<tr>
<td>${promo.createdAt}</td><td>${promo.network}</td><td>${promo.promoName}</td>
<td>${promo.items.length}</td><td>${promo.items[0]?.startDate} — ${promo.items[0]?.endDate}</td>
<td>${promo.managerName}</td>
<td><span class="status-badge ${promo.status === 'loaded' ? 'done' : 'archived'}">${promo.status === 'loaded' ? 'Загружено' : 'Архив'}</span></td>
<td><button type="button" class="btn-custom small" onclick="viewPromoDetails(${promo.id})">Просмотр</button></td>
</tr>
`).join('');
}

function exportArchive() { return exportPromosWorkbook(); }

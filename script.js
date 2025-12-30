// ===================================
// DATOS INICIALES (MOCK DATA)
// ===================================
const INITIAL_INVENTORY = [
    {
        id: 'PROD-001',
        name: 'Laptop Dell XPS 15',
        category: 'Electrónica',
        systemStock: 25,
        physicalCount: 0,
        location: 'Almacén A - Estante 1',
        lastUpdated: new Date().toISOString()
    },
    {
        id: 'PROD-002',
        name: 'Mouse Logitech MX Master',
        category: 'Electrónica',
        systemStock: 8,
        physicalCount: 0,
        location: 'Almacén A - Estante 2',
        lastUpdated: new Date().toISOString()
    },
    {
        id: 'PROD-003',
        name: 'Silla Ergonómica Premium',
        category: 'Muebles',
        systemStock: 15,
        physicalCount: 0,
        location: 'Almacén B - Zona 1',
        lastUpdated: new Date().toISOString()
    },
    {
        id: 'PROD-004',
        name: 'Teclado Mecánico RGB',
        category: 'Electrónica',
        systemStock: 5,
        physicalCount: 0,
        location: 'Almacén A - Estante 3',
        lastUpdated: new Date().toISOString()
    },
    {
        id: 'PROD-005',
        name: 'Monitor LG 27" 4K',
        category: 'Electrónica',
        systemStock: 12,
        physicalCount: 0,
        location: 'Almacén A - Estante 1',
        lastUpdated: new Date().toISOString()
    }
];

// ===================================
// ESTADO DE LA APLICACIÓN
// ===================================
class InventoryApp {
    constructor() {
        this.inventory = this.loadInventory();
        this.currentView = 'dashboard';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderDashboard();
        this.renderInventoryTable();
        this.renderCountMode();
        this.populateCategoryFilter();
    }

    // ===================================
    // PERSISTENCIA - LOCAL STORAGE
    // ===================================
    loadInventory() {
        const stored = localStorage.getItem('inventory');
        return stored ? JSON.parse(stored) : INITIAL_INVENTORY;
    }

    saveInventory() {
        localStorage.setItem('inventory', JSON.stringify(this.inventory));
    }

    // ===================================
    // EVENT LISTENERS
    // ===================================
    setupEventListeners() {
        // Navegación
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchView(e.target.closest('.nav-btn').dataset.view));
        });

        // Formulario de registro
        document.getElementById('product-form').addEventListener('submit', (e) => this.handleProductSubmit(e));
        document.getElementById('reset-form-btn').addEventListener('click', () => this.resetForm());

        // Búsqueda y filtros
        document.getElementById('search-input').addEventListener('input', (e) => this.filterInventory(e.target.value));
        document.getElementById('category-filter').addEventListener('change', (e) => this.filterByCategory(e.target.value));
        document.getElementById('count-search-input').addEventListener('input', (e) => this.filterCountItems(e.target.value));

        // Exportar PDF
        document.getElementById('export-pdf-btn').addEventListener('click', () => this.exportToPDF());

        // Modal
        document.getElementById('close-modal-btn').addEventListener('click', () => this.closeModal());
        document.getElementById('cancel-edit-btn').addEventListener('click', () => this.closeModal());
        document.getElementById('edit-form').addEventListener('submit', (e) => this.handleEditSubmit(e));
    }

    // ===================================
    // NAVEGACIÓN
    // ===================================
    switchView(viewName) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        
        document.getElementById(`${viewName}-view`).classList.add('active');
        document.querySelector(`[data-view="${viewName}"]`).classList.add('active');
        
        this.currentView = viewName;
        
        if (viewName === 'dashboard') this.renderDashboard();
        if (viewName === 'inventory') this.renderInventoryTable();
        if (viewName === 'count') this.renderCountMode();
    }

    // ===================================
    // DASHBOARD
    // ===================================
    renderDashboard() {
        const totalProducts = this.inventory.length;
        const totalStock = this.inventory.reduce((sum, item) => sum + item.systemStock, 0);
        const lowStock = this.inventory.filter(item => item.systemStock < 10).length;
        const countedItems = this.inventory.filter(item => item.physicalCount > 0).length;

        document.getElementById('total-products').textContent = totalProducts;
        document.getElementById('total-stock').textContent = totalStock;
        document.getElementById('low-stock').textContent = lowStock;
        document.getElementById('counted-items').textContent = countedItems;

        this.renderAlerts();
    }

    renderAlerts() {
        const container = document.getElementById('alerts-container');
        const lowStockItems = this.inventory.filter(item => item.systemStock < 10);

        if (lowStockItems.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted);">✅ No hay alertas de stock bajo</p>';
            return;
        }

        container.innerHTML = lowStockItems.map(item => `
            <div class="alert-item">
                <span style="font-size: 1.5rem;">⚠️</span>
                <div>
                    <strong>${item.name}</strong> (${item.id})
                    <br>
                    <small>Stock actual: ${item.systemStock} unidades - Ubicación: ${item.location}</small>
                </div>
            </div>
        `).join('');
    }

    // ===================================
    // INVENTARIO
    // ===================================
    renderInventoryTable(filteredData = null) {
        const data = filteredData || this.inventory;
        const tbody = document.getElementById('inventory-table-body');

        tbody.innerHTML = data.map(item => {
            const diff = item.physicalCount - item.systemStock;
            const diffClass = diff > 0 ? 'success' : diff < 0 ? 'danger' : 'secondary';
            const diffText = diff > 0 ? `+${diff}` : diff;

            return `
                <tr>
                    <td><strong>${item.id}</strong></td>
                    <td>${item.name}</td>
                    <td><span class="badge badge-${item.category.toLowerCase()}">${item.category}</span></td>
                    <td>${item.systemStock}</td>
                    <td>${item.physicalCount || '-'}</td>
                    <td><span style="color: var(--${diffClass}); font-weight: 600;">${item.physicalCount > 0 ? diffText : '-'}</span></td>
                    <td>${item.location}</td>
                    <td><small>${new Date(item.lastUpdated).toLocaleDateString()}</small></td>
                    <td>
                        <button class="btn btn-small btn-primary" onclick="app.editProduct('${item.id}')">✏️</button>
                        <button class="btn btn-small btn-danger" onclick="app.deleteProduct('${item.id}')">🗑️</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    filterInventory(searchTerm) {
        const filtered = this.inventory.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
        this.renderInventoryTable(filtered);
    }

    filterByCategory(category) {
        if (!category) {
            this.renderInventoryTable();
            return;
        }
        const filtered = this.inventory.filter(item => item.category === category);
        this.renderInventoryTable(filtered);
    }

    populateCategoryFilter() {
        const categories = [...new Set(this.inventory.map(item => item.category))];
        const select = document.getElementById('category-filter');
        
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            select.appendChild(option);
        });
    }

    // ===================================
    // MODO CONTEO
    // ===================================
    renderCountMode(filteredData = null) {
        const data = filteredData || this.inventory;
        const grid = document.getElementById('count-items-grid');

        grid.innerHTML = data.map(item => `
            <div class="count-card">
                <h3 style="margin-bottom: 0.5rem;">${item.name}</h3>
                <p style="color: var(--text-muted); margin-bottom: 1rem;"><strong>SKU:</strong> ${item.id}</p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                    <div>
                        <small style="color: var(--text-muted);">Stock Sistema</small>
                        <p style="font-size: 1.5rem; font-weight: 700; color: var(--primary);">${item.systemStock}</p>
                    </div>
                    <div>
                        <small style="color: var(--text-muted);">Conteo Real</small>
                        <p style="font-size: 1.5rem; font-weight: 700; color: var(--success);">${item.physicalCount || 0}</p>
                    </div>
                </div>
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Registrar Conteo:</label>
                    <input type="number" min="0" class="form-input" id="count-${item.id}" value="${item.physicalCount || 0}">
                </div>
                <button class="btn btn-success" style="width: 100%;" onclick="app.updateCount('${item.id}')">
                    <span class="btn-icon">✅</span>
                    Guardar Conteo
                </button>
                ${item.physicalCount > 0 ? `
                    <p style="margin-top: 1rem; padding: 0.75rem; background: ${item.physicalCount - item.systemStock >= 0 ? '#d1fae5' : '#fee2e2'}; border-radius: var(--radius-md); text-align: center; font-weight: 600;">
                        Diferencia: ${item.physicalCount - item.systemStock > 0 ? '+' : ''}${item.physicalCount - item.systemStock}
                    </p>
                ` : ''}
            </div>
        `).join('');
    }

    filterCountItems(searchTerm) {
        const filtered = this.inventory.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
        this.renderCountMode(filtered);
    }

    updateCount(productId) {
        const input = document.getElementById(`count-${productId}`);
        const count = parseInt(input.value) || 0;
        
        const product = this.inventory.find(p => p.id === productId);
        if (product) {
            product.physicalCount = count;
            product.lastUpdated = new Date().toISOString();
            this.saveInventory();
            this.renderCountMode();
            this.showToast('Conteo actualizado correctamente', 'success');
        }
    }

    // ===================================
    // CRUD PRODUCTOS
    // ===================================
    handleProductSubmit(e) {
        e.preventDefault();
        
        const newProduct = {
            id: document.getElementById('product-sku').value.trim(),
            name: document.getElementById('product-name').value.trim(),
            category: document.getElementById('product-category').value,
            systemStock: parseInt(document.getElementById('product-stock').value),
            physicalCount: 0,
            location: document.getElementById('product-location').value.trim(),
            lastUpdated: new Date().toISOString()
        };

        // Validar SKU único
        if (this.inventory.some(p => p.id === newProduct.id)) {
            this.showToast('El SKU ya existe. Use uno diferente.', 'error');
            return;
        }

        this.inventory.push(newProduct);
        this.saveInventory();
        this.resetForm();
        this.renderInventoryTable();
        this.renderDashboard();
        this.showToast('Producto registrado exitosamente', 'success');
    }

    resetForm() {
        document.getElementById('product-form').reset();
    }

    editProduct(productId) {
        const product = this.inventory.find(p => p.id === productId);
        if (!product) return;

        document.getElementById('edit-product-id').value = product.id;
        document.getElementById('edit-product-sku').value = product.id;
        document.getElementById('edit-product-name').value = product.name;
        document.getElementById('edit-product-category').value = product.category;
        document.getElementById('edit-product-stock').value = product.systemStock;
        document.getElementById('edit-product-location').value = product.location;

        document.getElementById('edit-modal').classList.add('active');
    }

    handleEditSubmit(e) {
        e.preventDefault();
        
        const productId = document.getElementById('edit-product-id').value;
        const product = this.inventory.find(p => p.id === productId);
        
        if (product) {
            product.name = document.getElementById('edit-product-name').value.trim();
            product.category = document.getElementById('edit-product-category').value;
            product.systemStock = parseInt(document.getElementById('edit-product-stock').value);
            product.location = document.getElementById('edit-product-location').value.trim();
            product.lastUpdated = new Date().toISOString();
            
            this.saveInventory();
            this.closeModal();
            this.renderInventoryTable();
            this.renderDashboard();
            this.showToast('Producto actualizado correctamente', 'success');
        }
    }

    deleteProduct(productId) {
        if (!confirm('¿Está seguro de eliminar este producto?')) return;
        
        this.inventory = this.inventory.filter(p => p.id !== productId);
        this.saveInventory();
        this.renderInventoryTable();
        this.renderDashboard();
        this.showToast('Producto eliminado', 'info');
    }

    closeModal() {
        document.getElementById('edit-modal').classList.remove('active');
    }

    // ===================================
    // EXPORTAR PDF
    // ===================================
    exportToPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Título
        doc.setFontSize(18);
        doc.text('Reporte de Inventario', 14, 20);
        
        doc.setFontSize(11);
        doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 14, 28);
        doc.text(`Total de Productos: ${this.inventory.length}`, 14, 34);

        // Tabla
        const tableData = this.inventory.map(item => [
            item.id,
            item.name,
            item.category,
            item.systemStock,
            item.physicalCount || '-',
            item.physicalCount > 0 ? (item.physicalCount - item.systemStock) : '-',
            item.location
        ]);

        doc.autoTable({
            startY: 40,
            head: [['SKU', 'Nombre', 'Categoría', 'Stock Sistema', 'Conteo Real', 'Diferencia', 'Ubicación']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [37, 99, 235] }
        });

        doc.save(`inventario_${new Date().toISOString().split('T')[0]}.pdf`);
        this.showToast('Reporte PDF generado exitosamente', 'success');
    }

    // ===================================
    // NOTIFICACIONES
    // ===================================
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// ===================================
// INICIALIZAR APLICACIÓN
// ===================================
const app = new InventoryApp();

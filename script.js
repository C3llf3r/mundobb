// ===================================
// DATOS INICIALES
// ===================================
const INITIAL_INVENTORY = [
    {
        id: 'BODY-001',
        category: 'Bodies',
        name: 'Body Blanco',
        observation: 'Stock disponible en almacén principal',
        quantity: 15,
        price: 12.99,
        photo: '',
        createdAt: new Date().toISOString()
    },
    {
        id: 'PIJ-001',
        category: 'Pijamas',
        name: 'Pijama Ositos',
        observation: 'Muy popular, considerar reposición',
        quantity: 8,
        price: 18.50,
        photo: '',
        createdAt: new Date().toISOString()
    }
];

// ===================================
// CLASE PRINCIPAL
// ===================================
class BabyStockApp {
    constructor() {
        this.inventory = this.loadInventory();
        this.currentView = 'dashboard';
        this.cameraStream = null;
        this.currentPhoto = '';
        this.initTheme();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderDashboard();
        this.renderInventory();
    }

    // ===================================
    // PERSISTENCIA
    // ===================================
    loadInventory() {
        const stored = localStorage.getItem('babystock_inventory');
        return stored ? JSON.parse(stored) : INITIAL_INVENTORY;
    }

    saveInventory() {
        localStorage.setItem('babystock_inventory', JSON.stringify(this.inventory));
    }

    // ===================================
    // EVENT LISTENERS
    // ===================================
    setupEventListeners() {
        // Navegación
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchView(e.target.closest('.nav-btn').dataset.view);
                this.closeMenu(); // Cerrar menú al cambiar de vista
            });
        });

        // Menú hamburguesa
        document.getElementById('hamburger-btn').addEventListener('click', () => this.toggleMenu());
        document.getElementById('nav-overlay').addEventListener('click', () => this.closeMenu());

        // Tema día/noche
        document.getElementById('theme-toggle').addEventListener('click', () => this.toggleTheme());

        // Formulario
        document.getElementById('product-form').addEventListener('submit', (e) => this.handleSubmit(e));
        document.getElementById('reset-form-btn').addEventListener('click', () => this.resetForm());
        document.getElementById('generate-sku-btn').addEventListener('click', () => this.generateSKU());
        document.getElementById('product-category').addEventListener('change', () => this.generateSKU());

        // Búsqueda y filtros
        document.getElementById('search-input').addEventListener('input', (e) => this.filterInventory(e.target.value));
        document.getElementById('category-filter').addEventListener('change', (e) => this.filterByCategory(e.target.value));

        // Foto
        document.getElementById('camera-btn').addEventListener('click', () => this.openCamera());
        document.getElementById('upload-btn').addEventListener('click', () => document.getElementById('file-input').click());
        document.getElementById('file-input').addEventListener('change', (e) => this.handleFileUpload(e));
        document.getElementById('remove-photo-btn').addEventListener('click', () => this.removePhoto());

        // Cámara modal
        document.getElementById('close-camera-btn').addEventListener('click', () => this.closeCamera());
        document.getElementById('cancel-camera-btn').addEventListener('click', () => this.closeCamera());
        document.getElementById('capture-btn').addEventListener('click', () => this.capturePhoto());

        // Exportar/Importar
        document.getElementById('export-json-btn').addEventListener('click', () => this.exportJSON());
        document.getElementById('import-json-btn').addEventListener('click', () => document.getElementById('import-json-input').click());
        document.getElementById('import-json-input').addEventListener('change', (e) => this.importJSON(e));
        document.getElementById('export-pdf-btn').addEventListener('click', () => this.exportPDF());
        document.getElementById('export-excel-btn').addEventListener('click', () => this.exportExcel());

        // Modal edición
        document.getElementById('close-edit-modal-btn').addEventListener('click', () => this.closeEditModal());
        document.getElementById('cancel-edit-btn').addEventListener('click', () => this.closeEditModal());
        document.getElementById('edit-form').addEventListener('submit', (e) => this.handleEdit(e));
    }

    // ===================================
    // TEMA DÍA/NOCHE
    // ===================================
    initTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
        }
    }

    toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        this.showToast(isDark ? 'Modo oscuro activado' : 'Modo claro activado', 'info');
    }

    // ===================================
    // MENÚ HAMBURGUESA
    // ===================================
    toggleMenu() {
        const nav = document.getElementById('nav-menu');
        const overlay = document.getElementById('nav-overlay');
        const hamburger = document.getElementById('hamburger-btn');

        nav.classList.toggle('active');
        overlay.classList.toggle('active');
        hamburger.classList.toggle('active');
    }

    closeMenu() {
        const nav = document.getElementById('nav-menu');
        const overlay = document.getElementById('nav-overlay');
        const hamburger = document.getElementById('hamburger-btn');

        nav.classList.remove('active');
        overlay.classList.remove('active');
        hamburger.classList.remove('active');
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
        if (viewName === 'inventory') this.renderInventory();
    }

    // ===================================
    // DASHBOARD
    // ===================================
    renderDashboard() {
        const totalProducts = this.inventory.length;
        const totalQuantity = this.inventory.reduce((sum, item) => sum + item.quantity, 0);
        const totalValue = this.inventory.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        const lowStock = this.inventory.filter(item => item.quantity < 5).length;

        document.getElementById('total-products').textContent = totalProducts;
        document.getElementById('total-quantity').textContent = totalQuantity;
        document.getElementById('total-value').textContent = `$${totalValue.toFixed(2)}`;
        document.getElementById('low-stock').textContent = lowStock;
    }

    // ===================================
    // INVENTARIO
    // ===================================
    renderInventory(filteredData = null) {
        const data = filteredData || this.inventory;
        const grid = document.getElementById('inventory-grid');

        if (data.length === 0) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">No hay productos</p>';
            return;
        }

        grid.innerHTML = data.map(item => `
            <div class="product-card">
                <div class="product-image">
                    ${item.photo ? `<img src="${item.photo}" alt="${item.name}">` : '📦'}
                </div>
                <div class="product-info">
                    <div class="product-sku">${item.id}</div>
                    <div class="product-category">${item.category}</div>
                    <div class="product-detail">${item.name || 'Sin nombre'}</div>
                    ${item.observation ? `<div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">📝 ${item.observation}</div>` : ''}
                    <div class="product-stats">
                        <div class="product-stat">
                            <div class="product-stat-label">Cantidad</div>
                            <div class="product-stat-value">${item.quantity}</div>
                        </div>
                        <div class="product-stat">
                            <div class="product-stat-label">Precio</div>
                            <div class="product-stat-value">$${item.price.toFixed(2)}</div>
                        </div>
                    </div>
                    <div class="product-actions">
                        <button class="btn btn-primary btn-small" onclick="app.editProduct('${item.id}')">✏️ Editar</button>
                        <button class="btn btn-danger btn-small" onclick="app.deleteProduct('${item.id}')">🗑️</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    filterInventory(searchTerm) {
        const filtered = this.inventory.filter(item =>
            item.detail.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
        this.renderInventory(filtered);
    }

    filterByCategory(category) {
        if (!category) {
            this.renderInventory();
            return;
        }
        const filtered = this.inventory.filter(item => item.category === category);
        this.renderInventory(filtered);
    }

    // ===================================
    // GENERACIÓN DE SKU
    // ===================================
    generateSKU() {
        const category = document.getElementById('product-category').value;
        if (!category) {
            this.showToast('Seleccione una categoría primero', 'info');
            return;
        }

        const prefixes = {
            'Bodies': 'BODY',
            'Pijamas': 'PIJ',
            'Conjuntos': 'CONJ',
            'Accesorios': 'ACC',
            'Calzado': 'CALZ',
            'Abrigos': 'ABR',
            'Otros': 'OTR'
        };

        const prefix = prefixes[category];
        const existingSKUs = this.inventory
            .filter(item => item.id.startsWith(prefix))
            .map(item => parseInt(item.id.split('-')[1]) || 0);

        const nextNumber = existingSKUs.length > 0 ? Math.max(...existingSKUs) + 1 : 1;
        const newSKU = `${prefix}-${String(nextNumber).padStart(3, '0')}`;

        document.getElementById('product-sku').value = newSKU;
    }

    // ===================================
    // MANEJO DE FOTOS
    // ===================================
    async openCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            this.cameraStream = stream;
            const video = document.getElementById('camera-video');
            video.srcObject = stream;
            document.getElementById('camera-modal').classList.add('active');
        } catch (error) {
            this.showToast('No se pudo acceder a la cámara', 'error');
            console.error(error);
        }
    }

    closeCamera() {
        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => track.stop());
            this.cameraStream = null;
        }
        document.getElementById('camera-modal').classList.remove('active');
    }

    capturePhoto() {
        const video = document.getElementById('camera-video');
        const canvas = document.getElementById('camera-canvas');
        const context = canvas.getContext('2d');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        const photoData = canvas.toDataURL('image/jpeg', 0.8);
        this.setPhoto(photoData);
        this.closeCamera();
        this.showToast('Foto capturada exitosamente', 'success');
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            this.setPhoto(e.target.result);
            this.showToast('Imagen cargada exitosamente', 'success');
        };
        reader.readAsDataURL(file);
    }

    setPhoto(photoData) {
        this.currentPhoto = photoData;
        document.getElementById('product-photo').value = photoData;
        document.getElementById('preview-image').src = photoData;
        document.getElementById('preview-image').style.display = 'block';
        document.querySelector('.photo-placeholder').style.display = 'none';
        document.getElementById('remove-photo-btn').style.display = 'inline-flex';
    }

    removePhoto() {
        this.currentPhoto = '';
        document.getElementById('product-photo').value = '';
        document.getElementById('preview-image').style.display = 'none';
        document.querySelector('.photo-placeholder').style.display = 'block';
        document.getElementById('remove-photo-btn').style.display = 'none';
    }

    // ===================================
    // CRUD
    // ===================================
    handleSubmit(e) {
        e.preventDefault();

        const newProduct = {
            id: document.getElementById('product-sku').value,
            category: document.getElementById('product-category').value,
            name: document.getElementById('product-name').value,
            observation: document.getElementById('product-observation').value,
            quantity: parseInt(document.getElementById('product-quantity').value) || 0,
            price: parseFloat(document.getElementById('product-price').value) || 0,
            photo: this.currentPhoto,
            createdAt: new Date().toISOString()
        };

        if (this.inventory.some(p => p.id === newProduct.id)) {
            this.showToast('El SKU ya existe', 'error');
            return;
        }

        this.inventory.push(newProduct);
        this.saveInventory();
        this.resetForm();
        this.renderInventory();
        this.renderDashboard();
        this.showToast('Producto agregado exitosamente', 'success');
    }

    resetForm() {
        document.getElementById('product-form').reset();
        this.removePhoto();
    }

    editProduct(productId) {
        const product = this.inventory.find(p => p.id === productId);
        if (!product) return;

        document.getElementById('edit-product-id').value = product.id;
        document.getElementById('edit-product-category').value = product.category;
        document.getElementById('edit-product-name').value = product.name || '';
        document.getElementById('edit-product-observation').value = product.observation || '';
        document.getElementById('edit-product-quantity').value = product.quantity;
        document.getElementById('edit-product-price').value = product.price;

        document.getElementById('edit-modal').classList.add('active');
    }

    handleEdit(e) {
        e.preventDefault();

        const productId = document.getElementById('edit-product-id').value;
        const product = this.inventory.find(p => p.id === productId);

        if (product) {
            product.category = document.getElementById('edit-product-category').value;
            product.name = document.getElementById('edit-product-name').value;
            product.observation = document.getElementById('edit-product-observation').value;
            product.quantity = parseInt(document.getElementById('edit-product-quantity').value) || 0;
            product.price = parseFloat(document.getElementById('edit-product-price').value) || 0;

            this.saveInventory();
            this.closeEditModal();
            this.renderInventory();
            this.renderDashboard();
            this.showToast('Producto actualizado', 'success');
        }
    }

    deleteProduct(productId) {
        if (!confirm('¿Eliminar este producto?')) return;

        this.inventory = this.inventory.filter(p => p.id !== productId);
        this.saveInventory();
        this.renderInventory();
        this.renderDashboard();
        this.showToast('Producto eliminado', 'info');
    }

    closeEditModal() {
        document.getElementById('edit-modal').classList.remove('active');
    }

    // ===================================
    // EXPORTAR JSON
    // ===================================
    exportJSON() {
        const dataStr = JSON.stringify(this.inventory, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `inventario_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        this.showToast('JSON exportado exitosamente', 'success');
    }

    // ===================================
    // IMPORTAR JSON
    // ===================================
    importJSON(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (Array.isArray(data)) {
                    this.inventory = data;
                    this.saveInventory();
                    this.renderInventory();
                    this.renderDashboard();
                    this.showToast('Inventario importado exitosamente', 'success');
                } else {
                    this.showToast('Formato JSON inválido', 'error');
                }
            } catch (error) {
                this.showToast('Error al leer el archivo', 'error');
            }
        };
        reader.readAsText(file);
    }

    // ===================================
    // EXPORTAR PDF
    // ===================================
    exportPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text('Inventario de Ropa de Bebé', 14, 20);

        doc.setFontSize(11);
        doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 14, 28);
        doc.text(`Total de Productos: ${this.inventory.length}`, 14, 34);

        const tableData = this.inventory.map(item => [
            item.id,
            item.category,
            item.name || '',
            item.quantity,
            `$${item.price.toFixed(2)}`,
            `$${(item.quantity * item.price).toFixed(2)}`
        ]);

        doc.autoTable({
            startY: 40,
            head: [['SKU', 'Categoría', 'Producto', 'Cant.', 'Precio', 'Total']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [37, 99, 235] }
        });

        doc.save(`inventario_${new Date().toISOString().split('T')[0]}.pdf`);
        this.showToast('PDF generado exitosamente', 'success');
    }

    // ===================================
    // EXPORTAR EXCEL
    // ===================================
    exportExcel() {
        const data = this.inventory.map(item => ({
            'SKU': item.id,
            'Categoría': item.category,
            'Producto': item.name || '',
            'Observación': item.observation || '',
            'Cantidad': item.quantity,
            'Precio': item.price,
            'Total': item.quantity * item.price,
            'Fecha Creación': new Date(item.createdAt).toLocaleDateString('es-ES')
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Inventario');

        XLSX.writeFile(wb, `inventario_${new Date().toISOString().split('T')[0]}.xlsx`);
        this.showToast('Excel generado exitosamente', 'success');
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
// INICIALIZAR
// ===================================
const app = new BabyStockApp();

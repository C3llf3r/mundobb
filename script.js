// ===================================
// DATOS INICIALES
// ===================================
const INITIAL_INVENTORY = [
    {
        id: 'ROP-001',
        category: 'Ropa',
        name: 'BODY BLANCO',
        color: 'BLANCO',
        size: '0-3 m',
        observation: 'Stock disponible en almacén principal',
        quantity: 15,
        price: 12.99,
        photo: '',
        createdAt: new Date().toISOString()
    },
    {
        id: 'ROP-002',
        category: 'Ropa',
        name: 'PIJAMA OSITOS',
        color: 'AZUL',
        size: '3-6 m',
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
    // UTILS & SEGURIDAD
    // ===================================
    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return String(unsafe)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    async compressImage(base64Str, maxWidth = 600, quality = 0.7) {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = base64Str;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = () => resolve(base64Str); // Fallback
        });
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
                const view = e.target.closest('.nav-btn').dataset.view;
                this.switchView(view);
                this.closeMenu();
            });
        });

        // Menú hamburguesa y Overlay
        const hamburgerBtn = document.getElementById('hamburger-btn');
        if (hamburgerBtn) hamburgerBtn.addEventListener('click', () => this.toggleMenu());

        const navOverlay = document.getElementById('nav-overlay');
        if (navOverlay) navOverlay.addEventListener('click', () => this.closeMenu());

        // nav-close-btn eliminado en nuevo diseño

        // Tema
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) themeToggle.addEventListener('click', () => this.toggleTheme());

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
        console.log('Toggle menu called');
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

        // Verificar estado del respaldo
        this.checkBackupStatus();
    }

    checkBackupStatus() {
        const lastBackup = localStorage.getItem('lastBackupDate');
        const exportSection = document.querySelector('.export-section');
        const existingAlert = document.getElementById('backup-alert');
        
        if (existingAlert) existingAlert.remove();

        const daysThreshold = 7;
        let showWarning = false;
        let message = '';

        if (!lastBackup) {
            showWarning = true;
            message = '⚠️ Nunca has realizado una copia de seguridad.';
        } else {
            const diffTime = Math.abs(new Date() - new Date(lastBackup));
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            if (diffDays > daysThreshold) {
                showWarning = true;
                message = `⚠️ Último respaldo hace ${diffDays} días.`;
            }
        }

        if (showWarning && exportSection) {
            const alertDiv = document.createElement('div');
            alertDiv.id = 'backup-alert';
            alertDiv.style.cssText = 'background: #fff3cd; color: #856404; padding: 0.75rem; border-radius: var(--radius-md); margin-bottom: 1rem; border: 1px solid #ffeeba; display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem;';
            alertDiv.innerHTML = `<span>${message}</span> <button class="btn btn-primary" style="padding: 0.25rem 0.5rem; font-size: 0.8rem; margin-left: auto;" onclick="app.exportJSON()">Respaldar ahora</button>`;
            
            // Insertar después del título "Reportes"
            const title = exportSection.querySelector('.section-title');
            if (title) {
                title.parentNode.insertBefore(alertDiv, title.nextSibling);
            }
        }
    }

    // ===================================
    // INVENTARIO
    // ===================================
    renderInventory(filteredData = null) {
        const data = filteredData || this.inventory;
        const grid = document.getElementById('inventory-grid');

        if (data.length === 0) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">No se encontraron productos.</p>';
            return;
        }

        grid.innerHTML = data.map(item => `
            <div class="product-card">
                <div class="product-image">
                    ${item.photo ? `<img src="${item.photo}" alt="${this.escapeHtml(item.name)}">` : '<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:var(--text-muted); background:var(--bg-tertiary);">Sin Imagen</div>'}
                </div>
                <div class="product-info">
                    <div class="product-sku">${this.escapeHtml(item.id)}</div>
                    <div class="product-category">${this.escapeHtml(item.category)}</div>
                    <div class="product-detail">${this.escapeHtml(item.name || 'Sin nombre')}</div>
                    <div style="font-size: 0.9rem; margin-bottom: 0.5rem; color: var(--text-secondary);">
                        Color: <strong>${this.escapeHtml(item.color || 'N/A')}</strong> | Talla: <strong>${this.escapeHtml(item.size || 'N/A')}</strong>
                    </div>
                    ${item.observation ? `<div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">${this.escapeHtml(item.observation)}</div>` : ''}
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
                    <div class="product-actions" style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                        <button class="btn btn-outline" style="flex:1;" onclick="app.editProduct('${this.escapeHtml(item.id)}')" aria-label="Editar">Editar</button>
                        <button class="btn btn-danger btn-outline" style="flex:1;" onclick="app.deleteProduct('${this.escapeHtml(item.id)}')" aria-label="Eliminar">Eliminar</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    filterInventory(searchTerm) {
        const term = searchTerm.toLowerCase();
        const filtered = this.inventory.filter(item =>
            (item.name && item.name.toLowerCase().includes(term)) ||
            (item.id && item.id.toLowerCase().includes(term)) ||
            (item.observation && item.observation.toLowerCase().includes(term)) ||
            (item.size && item.size.toLowerCase().includes(term))
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
            'Ropa': 'ROP',
            'Accesorios': 'ACC',
            'Otros': 'OTR'
        };

        const prefix = prefixes[category] || 'GEN';
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

    async capturePhoto() {
        const video = document.getElementById('camera-video');
        const canvas = document.getElementById('camera-canvas');
        const context = canvas.getContext('2d');

        // Tamaño deseado
        const size = 600;
        let w = video.videoWidth;
        let h = video.videoHeight;
        
        // Calcular recorte para 1:1 (centro)
        const minDim = Math.min(w, h);
        const sx = (w - minDim) / 2;
        const sy = (h - minDim) / 2;

        canvas.width = size;
        canvas.height = size;
        
        // Dibujar solo el cuadrado central y escalar a 600px
        context.drawImage(video, sx, sy, minDim, minDim, 0, 0, size, size);

        const rawPhoto = canvas.toDataURL('image/jpeg', 0.8);
        const compressedPhoto = await this.compressImage(rawPhoto);
        
        this.setPhoto(compressedPhoto);
        this.closeCamera();
        this.showToast('Foto capturada exitosamente', 'success');
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const compressed = await this.compressImage(e.target.result);
                this.setPhoto(compressed);
                this.showToast('Imagen cargada exitosamente', 'success');
            } catch (err) {
                console.error(err);
                this.showToast('Error procesando imagen', 'error');
            }
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

        try {
            const colorInput = document.getElementById('product-color').value.trim();

            const newProduct = {
                id: document.getElementById('product-sku').value,
                category: document.getElementById('product-category').value,
                name: document.getElementById('product-name').value.toUpperCase(),
                color: colorInput ? colorInput.toUpperCase() : 'N/A',
                size: document.getElementById('product-size').value,
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
        } catch (error) {
            console.error(error);
            this.showToast('Error al guardar: ' + error.message, 'error');
        }
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
        document.getElementById('edit-product-color').value = product.color || '';
        document.getElementById('edit-product-size').value = product.size || '';
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
            const colorInput = document.getElementById('edit-product-color').value.trim();

            product.category = document.getElementById('edit-product-category').value;
            product.name = document.getElementById('edit-product-name').value.toUpperCase();
            product.color = colorInput ? colorInput.toUpperCase() : 'N/A';
            product.size = document.getElementById('edit-product-size').value;
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
    // EXPORTAR JSON (ROBUSTO)
    // ===================================
    exportJSON() {
        try {
            const backupData = {
                metadata: {
                    version: "1.0",
                    appName: "BabyStock",
                    exportDate: new Date().toISOString(),
                    itemCount: this.inventory.length
                },
                items: this.inventory
            };

            const dataStr = JSON.stringify(backupData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            const dateStr = new Date().toISOString().split('T')[0];
            link.download = `babystock_backup_${dateStr}.json`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url); // Liberar memoria
            
            this.showToast('Respaldo exportado correctamente', 'success');
            
            // Guardar fecha de último respaldo
            localStorage.setItem('lastBackupDate', new Date().toISOString());
            this.renderDashboard(); // Actualizar alerta si existía
        } catch (error) {
            console.error(error);
            this.showToast('Error al exportar: ' + error.message, 'error');
        }
    }

    // ===================================
    // IMPORTAR JSON (VALIDADO)
    // ===================================
    importJSON(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Resetear el input para permitir cargar el mismo archivo dos veces si falla
        event.target.value = '';

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const rawData = JSON.parse(e.target.result);
                let itemsToImport = [];

                // 1. Detección de formato (Array antiguo vs Objeto nuevo)
                if (Array.isArray(rawData)) {
                    itemsToImport = rawData;
                } else if (rawData.items && Array.isArray(rawData.items)) {
                    itemsToImport = rawData.items;
                } else {
                    throw new Error('Formato de archivo no reconocido');
                }

                // 2. Validación y Sanitización (Schema Check)
                const validItems = itemsToImport.reduce((acc, item) => {
                    // Validar campos obligatorios
                    if (!item.id || !item.category) return acc;

                    // Sanitizar y tipar datos
                    const cleanItem = {
                        id: String(item.id).trim(),
                        category: String(item.category).trim(),
                        name: item.name ? String(item.name).trim() : 'Sin nombre',
                        color: item.color ? String(item.color).trim().toUpperCase() : '',
                        size: item.size ? String(item.size).trim() : '',
                        observation: item.observation ? String(item.observation).trim() : '',
                        // Asegurar que sean números positivos
                        quantity: Math.max(0, parseInt(item.quantity) || 0),
                        price: Math.max(0, parseFloat(item.price) || 0),
                        photo: item.photo || '', // Mantener base64 si existe
                        createdAt: item.createdAt || new Date().toISOString()
                    };

                    acc.push(cleanItem);
                    return acc;
                }, []);

                if (validItems.length === 0) {
                    throw new Error('El archivo no contiene productos válidos');
                }

                // 3. Confirmación
                if (confirm(`Se encontraron ${validItems.length} productos válidos.\n¿Desea reemplazar el inventario actual?`)) {
                    this.inventory = validItems;
                    this.saveInventory();
                    this.renderInventory();
                    this.renderDashboard();
                    this.showToast('Respaldo restaurado exitosamente', 'success');
                }

            } catch (error) {
                console.error(error);
                this.showToast('Error de importación: ' + error.message, 'error');
            }
        };
        reader.readAsText(file);
    }

    // ===================================
    // EXPORTAR PDF
    // ===================================
    exportPDF() {
        try {
            if (!window.jspdf) {
                alert('La librería PDF no se ha cargado correctamente. Recarga la página.');
                return;
            }
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
                item.color || '',
                item.size || '',
                item.quantity,
                `$${item.price.toFixed(2)}`,
                `$${(item.quantity * item.price).toFixed(2)}`
            ]);

            doc.autoTable({
                startY: 40,
                head: [['SKU', 'Cat.', 'Producto', 'Color', 'Talla', 'Cant.', 'Precio', 'Total']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [37, 99, 235] }
            });

            doc.save(`inventario_${new Date().toISOString().split('T')[0]}.pdf`);
            this.showToast('PDF generado exitosamente', 'success');
        } catch (error) {
            console.error(error);
            alert('Error al generar PDF: ' + error.message);
        }
    }

    // ===================================
    // EXPORTAR EXCEL
    // ===================================
    exportExcel() {
        try {
            if (typeof XLSX === 'undefined') {
                alert('La librería Excel no se ha cargado. Recarga la página.');
                return;
            }
            const data = this.inventory.map(item => ({
                'SKU': item.id,
                'Categoría': item.category,
                'Producto': item.name || '',
                'Color': item.color || '',
                'Talla': item.size || '',
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
        } catch (error) {
            console.error(error);
            alert('Error al generar Excel: ' + error.message);
        }
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
window.app = new BabyStockApp();

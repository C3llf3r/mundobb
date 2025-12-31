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
        createdAt: new Date().toISOString()
    }
];

// ===================================
// CLASE PRINCIPAL
// ===================================
class MundoBBStockApp {
    constructor() {
        this.inventory = this.loadInventory();
        this.currentView = 'dashboard';
        this.sortDirection = 1; // 1: Asc, -1: Desc
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
    autoFormatSize(input) {
        let value = input.value.toUpperCase().trim();
        // Si es solo números (ej: "3" o "12"), agregar "-M"
        if (/^\d+$/.test(value)) {
            value = `${value}-M`;
        }
        input.value = value;
    }

    formatCurrency(amount) {
        // Formato: CLP $1,500 (Sin decimales, coma para miles)
        return `CLP $${Math.round(amount).toLocaleString('en-US')}`;
    }

    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return String(unsafe)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // ===================================
    // PERSISTENCIA
    // ===================================
    loadInventory() {
        // Migración: Intentar leer nueva clave, si no existe, leer antigua
        const stored = localStorage.getItem('mundobbstock_inventory') || localStorage.getItem('babystock_inventory');
        return stored ? JSON.parse(stored) : INITIAL_INVENTORY;
    }

    saveInventory() {
        localStorage.setItem('mundobbstock_inventory', JSON.stringify(this.inventory));
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
        const filterHandler = () => this.filterInventory();
        document.getElementById('search-input').addEventListener('input', filterHandler);
        document.getElementById('category-filter').addEventListener('change', filterHandler);
        document.getElementById('qty-op').addEventListener('change', filterHandler);
        document.getElementById('qty-val').addEventListener('input', filterHandler);
        document.getElementById('total-op').addEventListener('change', filterHandler);
        document.getElementById('total-val').addEventListener('input', filterHandler);

        // Exportar CSV
        document.getElementById('export-csv-btn').addEventListener('click', () => this.exportCSV());

        // Exportar PDF (Modal)
        document.getElementById('export-pdf-btn').addEventListener('click', () => this.openPDFModal());
        document.getElementById('confirm-pdf-btn').addEventListener('click', () => this.generateCustomPDF());
        document.getElementById('cancel-pdf-btn').addEventListener('click', () => this.closePDFModal());
        document.getElementById('close-pdf-modal-btn').addEventListener('click', () => this.closePDFModal());

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
        document.getElementById('total-value').textContent = this.formatCurrency(totalValue);
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
    // INVENTARIO (LISTA / TABLA)
    // ===================================
    renderInventory(filteredData = null) {
        const data = filteredData || this.inventory;
        const tbody = document.getElementById('inventory-body');

        if (!tbody) return; // Protección si la vista no ha cargado

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-muted);">No se encontraron productos.</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(item => {
            const total = item.quantity * item.price;
            return `
            <tr>
                <td data-label="Producto">
                    <div style="font-weight: 700; font-size: 1rem; color: var(--text-primary); margin-bottom: 0.25rem;">${this.escapeHtml(item.name || 'Sin nombre')}</div>
                    <div style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.4;">
                        <span style="display:inline-block; margin-right:8px;">🆔 ${this.escapeHtml(item.id)}</span>
                        <span style="display:inline-block; margin-right:8px;">📂 ${this.escapeHtml(item.category)}</span>
                        <span style="display:inline-block; margin-right:8px;">🎨 ${this.escapeHtml(item.color)}</span>
                        <span style="display:inline-block;">📏 ${this.escapeHtml(item.size)}</span>
                    </div>
                </td>
                <td data-label="Cantidad" style="font-weight: 600; font-size: 1.1rem;">${item.quantity}</td>
                <td data-label="P. Unitario">${this.formatCurrency(item.price)}</td>
                <td data-label="P. Total" style="font-weight: 600; color: var(--primary);">${this.formatCurrency(total)}</td>
                <td data-label="Acciones">
                    <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                        <button class="btn btn-outline" style="padding: 0.4rem 0.8rem;" onclick="app.editProduct('${this.escapeHtml(item.id)}')" title="Editar">✏️ Editar</button>
                        <button class="btn btn-danger btn-outline" style="padding: 0.4rem 0.8rem;" onclick="app.deleteProduct('${this.escapeHtml(item.id)}')" title="Eliminar">🗑️</button>
                    </div>
                </td>
            </tr>
            `;
        }).join('');
    }

    sortInventory(field) {
        if (field === 'name') {
            this.sortDirection *= -1; // Alternar orden
            this.inventory.sort((a, b) => {
                const nameA = (a.name || '').toUpperCase();
                const nameB = (b.name || '').toUpperCase();
                if (nameA < nameB) return -1 * this.sortDirection;
                if (nameA > nameB) return 1 * this.sortDirection;
                return 0;
            });
            this.filterInventory(); // Re-renderizar manteniendo filtros
            this.showToast(`Ordenado por nombre ${this.sortDirection === 1 ? 'Asc' : 'Desc'}`, 'info');
        }
    }

    filterInventory() {
        const searchTerm = document.getElementById('search-input').value.toLowerCase();
        const categoryFilter = document.getElementById('category-filter').value;
        
        // Filtros Numéricos
        const qtyOp = document.getElementById('qty-op').value;
        const qtyVal = parseFloat(document.getElementById('qty-val').value);
        
        const totalOp = document.getElementById('total-op').value;
        const totalVal = parseFloat(document.getElementById('total-val').value);

        const filtered = this.inventory.filter(item => {
            // 1. Búsqueda Texto
            const matchesSearch = (
                (item.name && item.name.toLowerCase().includes(searchTerm)) ||
                (item.id && item.id.toLowerCase().includes(searchTerm)) ||
                (item.color && item.color.toLowerCase().includes(searchTerm))
            );
            if (!matchesSearch) return false;

            // 2. Categoría
            if (categoryFilter && item.category !== categoryFilter) return false;

            // 3. Cantidad
            if (!isNaN(qtyVal)) {
                if (qtyOp === 'gt' && item.quantity <= qtyVal) return false;
                if (qtyOp === 'lt' && item.quantity >= qtyVal) return false;
            }

            // 4. Precio Total
            const total = item.quantity * item.price;
            if (!isNaN(totalVal)) {
                if (totalOp === 'gt' && total <= totalVal) return false;
                if (totalOp === 'lt' && total >= totalVal) return false;
            }

            return true;
        });

        this.renderInventory(filtered);
    }

    // ===================================
    // EXPORTAR CSV
    // ===================================
    exportCSV() {
        if (this.inventory.length === 0) {
            this.showToast('No hay datos para exportar', 'error');
            return;
        }

        const headers = ['SKU', 'Categoría', 'Producto', 'Color', 'Talla', 'Observación', 'Cantidad', 'Precio Unitario', 'Precio Total', 'Fecha Creación'];
        
        const csvRows = [headers.join(',')];

        this.inventory.forEach(item => {
            const row = [
                item.id,
                item.category,
                `"${(item.name || '').replace(/"/g, '""')}"`, // Escapar comillas en CSV
                item.color || '',
                item.size || '',
                `"${(item.observation || '').replace(/"/g, '""')}"`,
                item.quantity,
                item.price.toFixed(2),
                (item.quantity * item.price).toFixed(2),
                item.createdAt
            ];
            csvRows.push(row.join(','));
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `inventario_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showToast('CSV generado exitosamente', 'success');
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

        // Configuración de Salida
        const targetSize = 350; // Resolución final 350x350 px
        
        // Algoritmo de Escalado: Alta Calidad (Bicúbico/Lanczos según navegador)
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';

        let w = video.videoWidth;
        let h = video.videoHeight;
        
        // Método: Recorte (Crop) 1:1 desde el centro
        const minDim = Math.min(w, h);
        const sx = (w - minDim) / 2;
        const sy = (h - minDim) / 2;

        canvas.width = targetSize;
        canvas.height = targetSize;
        
        // Ejecutar Recorte + Escalado
        context.drawImage(video, sx, sy, minDim, minDim, 0, 0, targetSize, targetSize);

        // Formato de salida: JPG
        const finalPhoto = canvas.toDataURL('image/jpeg', 0.8);
        
        this.setPhoto(finalPhoto);
        this.closeCamera();
        this.showToast('Foto capturada (350x350px)', 'success');
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
                    appName: "MundoBBStock",
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
            link.download = `mundobbstock_backup_${dateStr}.json`;
            
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
    // EXPORTAR PDF (PERSONALIZADO)
    // ===================================
    openPDFModal() {
        document.getElementById('pdf-options-modal').classList.add('active');
    }

    closePDFModal() {
        document.getElementById('pdf-options-modal').classList.remove('active');
    }

    generateCustomPDF() {
        try {
            if (!window.jspdf) {
                alert('La librería PDF no se ha cargado correctamente. Recarga la página.');
                return;
            }

            // 1. Identificar columnas seleccionadas
            const checkboxes = document.querySelectorAll('#pdf-options-modal input[type="checkbox"]:checked');
            const selectedKeys = Array.from(checkboxes).map(cb => cb.value);

            if (selectedKeys.length === 0) {
                this.showToast('Debes seleccionar al menos una columna', 'info');
                return;
            }

            this.closePDFModal();

            // 2. Definición de Columnas
            const columnDefs = {
                'id': { header: 'SKU', dataKey: 'id' },
                'category': { header: 'Cat.', dataKey: 'category' },
                'name': { header: 'Producto', dataKey: 'name' },
                'color': { header: 'Color', dataKey: 'color' },
                'size': { header: 'Talla', dataKey: 'size' },
                'quantity': { header: 'Cant.', dataKey: 'quantity' },
                'price': { header: 'Precio', isCurrency: true, dataKey: 'price' },
                'total': { header: 'Total', isCurrency: true, isComputed: true }
            };

            // 3. Construir Cabeceras y Cuerpo
            const headers = selectedKeys.map(key => columnDefs[key].header);
            
            const tableData = this.inventory.map(item => {
                return selectedKeys.map(key => {
                    const def = columnDefs[key];
                    let value = '';

                    if (key === 'total') {
                        value = item.quantity * item.price;
                    } else {
                        value = item[def.dataKey] || '';
                    }

                    if (def.isCurrency) {
                        return this.formatCurrency(value);
                    }
                    return value;
                });
            });

            // 4. Generar Documento
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            doc.setFontSize(18);
            doc.text('Inventario de Ropa de Bebé', 14, 20);

            doc.setFontSize(11);
            doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 14, 28);
            doc.text(`Total de Productos: ${this.inventory.length}`, 14, 34);

            doc.autoTable({
                startY: 40,
                head: [headers],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [37, 99, 235] }
            });

            doc.save(`reporte_inventario_${new Date().toISOString().split('T')[0]}.pdf`);
            this.showToast('PDF personalizado generado', 'success');

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
window.app = new MundoBBStockApp();

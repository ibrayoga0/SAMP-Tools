// SSRP Editor JavaScript
class SSRPEditor {
    constructor() {
        this.canvas = document.getElementById('mainCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentImage = null;
        this.imageScale = 1;
        this.imageX = 0;
        this.imageY = 0;
        this.fontSize = 14;
        this.rpTextNormal = '';
        this.rpTextSpecial = '';
        this.canvasWidth = 800;
        this.canvasHeight = 600;
        
        // Drag and drop variables
        this.isDraggingImage = false;
        this.isDraggingText = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.dragStartImageX = 0;
        this.dragStartImageY = 0;
        this.dragStartTextX = 0;
        this.dragStartTextY = 0;
        
        this.initializeEventListeners();
        this.updateCanvas();
        this.updateTextOverlay();
        this.loadDefaultImage();
    }

    loadDefaultImage() {
        const img = new Image();
        img.onload = () => {
            this.currentImage = img;
            this.resetImagePosition();
            this.updateCanvas();
        };
        img.src = 'images/ssrp-demo.jpg';
    }

    initializeEventListeners() {
        // Upload functionality
        const uploadArea = document.getElementById('uploadArea');
        const imageInput = document.getElementById('imageInput');
        
        uploadArea.addEventListener('click', () => imageInput.click());
        imageInput.addEventListener('change', (e) => this.handleImageUpload(e));

        // Canvas size controls
        const canvasWidthSlider = document.getElementById('canvasWidth');
        const canvasHeightSlider = document.getElementById('canvasHeight');
        const canvasWidthValue = document.getElementById('canvasWidthValue');
        const canvasHeightValue = document.getElementById('canvasHeightValue');
        
        canvasWidthSlider.addEventListener('input', (e) => {
            this.canvasWidth = parseInt(e.target.value);
            canvasWidthValue.textContent = this.canvasWidth;
            this.resizeCanvas();
        });
        
        canvasHeightSlider.addEventListener('input', (e) => {
            this.canvasHeight = parseInt(e.target.value);
            canvasHeightValue.textContent = this.canvasHeight;
            this.resizeCanvas();
        });

        // Zoom controls
        const zoomSlider = document.getElementById('zoomSlider');
        const zoomValue = document.getElementById('zoomValue');
        
        zoomSlider.addEventListener('input', (e) => {
            this.imageScale = parseFloat(e.target.value);
            zoomValue.textContent = this.imageScale.toFixed(1);
            this.updateCanvas();
        });

        // Text controls (normal and special)
        const rpTextNormalEl = document.getElementById('rpTextNormal');
        const rpTextSpecialEl = document.getElementById('rpTextSpecial');
        if (rpTextNormalEl) {
            rpTextNormalEl.addEventListener('input', (e) => {
                this.rpTextNormal = e.target.value;
                this.updateTextOverlay();
            });
        }
        if (rpTextSpecialEl) {
            rpTextSpecialEl.addEventListener('input', (e) => {
                this.rpTextSpecial = e.target.value;
                this.updateTextOverlay();
            });
        }

        const fontSizeSlider = document.getElementById('fontSize');
        const fontSizeValue = document.getElementById('fontSizeValue');
        
        fontSizeSlider.addEventListener('input', (e) => {
            this.fontSize = parseInt(e.target.value);
            fontSizeValue.textContent = this.fontSize;
            this.updateTextOverlay();
        });

        // Export and reset
        document.getElementById('exportImage').addEventListener('click', () => this.exportImage());
        document.getElementById('resetEditor').addEventListener('click', () => this.resetEditor());

        // Canvas drag and drop for image
        this.canvas.addEventListener('mousedown', (e) => this.handleCanvasMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleCanvasMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleCanvasMouseUp());
        this.canvas.addEventListener('mouseleave', () => this.handleCanvasMouseUp());

        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => this.handleCanvasTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleCanvasTouchMove(e));
        this.canvas.addEventListener('touchend', () => this.handleCanvasTouchEnd());

        // Text overlay drag and drop
        const textOverlay = document.getElementById('rpTextOverlay');
        textOverlay.addEventListener('mousedown', (e) => this.handleTextMouseDown(e));
        textOverlay.addEventListener('mousemove', (e) => this.handleTextMouseMove(e));
        textOverlay.addEventListener('mouseup', () => this.handleTextMouseUp());
        textOverlay.addEventListener('mouseleave', () => this.handleTextMouseUp());

        // Touch events for text on mobile
        textOverlay.addEventListener('touchstart', (e) => this.handleTextTouchStart(e));
        textOverlay.addEventListener('touchmove', (e) => this.handleTextTouchMove(e));
        textOverlay.addEventListener('touchend', () => this.handleTextTouchEnd());
    }

    resizeCanvas() {
        this.canvas.width = this.canvasWidth;
        this.canvas.height = this.canvasHeight;
        document.getElementById('canvasSizeDisplay').textContent = `${this.canvasWidth} × ${this.canvasHeight}`;
        
        if (this.currentImage) {
            this.resetImagePosition();
        }
        this.updateCanvas();
        
        // Ensure text overlay stays within canvas bounds and recalculate wrapping
        this.constrainTextPosition();
        this.updateTextOverlay();
    }

    constrainTextPosition() {
        const textOverlay = document.getElementById('rpTextOverlay');
        
        let left = parseInt(this.getTextOverlayStyle('left'));
        let top = parseInt(this.getTextOverlayStyle('top'));
        
        // Ensure text starts at proper position
        if (isNaN(left) || left < 0) left = 2;
        if (isNaN(top) || top < 0) top = 2;
        
        // Constrain to canvas bounds with extremely close edges
        const maxLeft = this.canvasWidth - 4; // 2px padding on each side
        const maxTop = this.canvasHeight - 40; // reduced for extremely close positioning
        
        if (left > maxLeft) left = maxLeft;
        if (top > maxTop) top = maxTop;
        
        this.setTextOverlayPosition(left, top);
    }

    handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.currentImage = img;
                this.resetImagePosition();
                this.updateCanvas();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    resetImagePosition() {
        if (!this.currentImage) return;
        
        // Center the image
        const imageWidth = this.currentImage.width * this.imageScale;
        const imageHeight = this.currentImage.height * this.imageScale;
        
        this.imageX = (this.canvasWidth - imageWidth) / 2;
        this.imageY = (this.canvasHeight - imageHeight) / 2;
        
        this.updateCanvas();
    }

    updateCanvas() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.currentImage) {
            // Draw image with current transform
            this.ctx.save();
            this.ctx.translate(this.imageX, this.imageY);
            this.ctx.scale(this.imageScale, this.imageScale);
            this.ctx.drawImage(this.currentImage, 0, 0);
            this.ctx.restore();
        }
    }

    processText(text) {
        if (!text) return '';
        
        // Split into lines and process each line (keep special marker if present)
        const lines = text.split('\n');
        
        return lines.map(line => {
            if (line.startsWith('*')) {
                return `<span class="special-text">${line}</span>`;
            }
            return line;
        }).join('\n');
    }

    // Measure-wrapping that preserves whole words
    wrapText(text, maxWidth, fontSize) {
        if (!text) return [];
        
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        
        const ctx = this.ctx;
        ctx.font = `${fontSize}px Inter`;
        
        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const testLine = currentLine ? currentLine + ' ' + word : word;
            const testWidth = ctx.measureText(testLine).width;
            if (testWidth > maxWidth && currentLine !== '') {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) lines.push(currentLine);
        return lines;
    }

    // Wrap with a first-line prefix reducing available width for the first line only
    wrapTextWithFirstLinePrefix(text, maxWidth, fontSize, firstLinePrefix) {
        if (!text) return [];
        const ctx = this.ctx;
        ctx.font = `${fontSize}px Inter`;
        const prefixWidth = ctx.measureText(firstLinePrefix).width;
        let remainingWidthForFirst = Math.max(0, maxWidth - prefixWidth);

        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        let isFirstLine = true;
        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const testLine = currentLine ? currentLine + ' ' + word : word;
            const testWidth = ctx.measureText(testLine).width;
            const limit = isFirstLine ? remainingWidthForFirst : maxWidth;
            if (testWidth > limit && currentLine !== '') {
                lines.push(currentLine);
                currentLine = word;
                isFirstLine = false;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) lines.push(currentLine);
        return lines;
    }

    updateTextOverlay() {
        const textOverlay = document.getElementById('rpTextOverlay');
        const wrapper = document.getElementById('canvasWrapper');

        const leftPx = parseInt(this.getTextOverlayStyle('left')) || 2;
        const availableWidth = Math.max(10, wrapper.clientWidth - leftPx - 2);

        // Build parts: each part is { text, special }
        const parts = [];

        // Special first: add '*' only once per original line, but style all wrapped segments as special
        const specialInput = this.rpTextSpecial ? this.rpTextSpecial.split('\n') : [];
        for (const rawLine of specialInput) {
            const line = rawLine.trim();
            if (!line) continue;
            const wrapped = this.wrapTextWithFirstLinePrefix(line, availableWidth, this.fontSize, '* ');
            wrapped.forEach((seg, idx) => {
                const text = idx === 0 ? `* ${seg}` : seg;
                parts.push({ text, special: true });
            });
        }

        // Normal after special
        const normalWrapped = this.wrapText(this.rpTextNormal, availableWidth, this.fontSize);
        normalWrapped.forEach(seg => parts.push({ text: seg, special: false }));

        const html = (parts.length ? parts : [{ text: 'RP Action Text', special: false }])
            .map(p => p.special ? `<span class="special-text">${p.text}</span>` : p.text)
            .join('<br>');

        textOverlay.innerHTML = html;
        textOverlay.style.fontSize = `${this.fontSize}px`;
        textOverlay.style.width = `${availableWidth}px`;
        if (!this.rpTextNormal && !this.rpTextSpecial) {
            textOverlay.style.top = '2px';
        }
    }

    getTextOverlayStyle(property) {
        const textOverlay = document.getElementById('rpTextOverlay');
        return window.getComputedStyle(textOverlay)[property];
    }

    setTextOverlayPosition(x, y) {
        const textOverlay = document.getElementById('rpTextOverlay');
        const wrapper = document.getElementById('canvasWrapper');
        
        // Constrain position within canvas bounds with extremely close edges
        const maxLeft = this.canvasWidth - 4;
        const maxTop = this.canvasHeight - 40;
        
        x = Math.max(2, Math.min(x, maxLeft));
        y = Math.max(2, Math.min(y, maxTop));
        
        textOverlay.style.left = `${x}px`;
        textOverlay.style.top = `${y}px`;
        
        // Update overlay width to avoid overflow and match wrapping
        const availableWidth = Math.max(10, wrapper.clientWidth - x - 2);
        textOverlay.style.width = `${availableWidth}px`;
    }

    // Canvas drag and drop handlers
    handleCanvasMouseDown(e) {
        if (!this.currentImage) return;
        
        this.isDraggingImage = true;
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;
        this.dragStartImageX = this.imageX;
        this.dragStartImageY = this.imageY;
        this.canvas.style.cursor = 'grabbing';
    }

    handleCanvasMouseMove(e) {
        if (!this.isDraggingImage) return;
        
        const deltaX = e.clientX - this.dragStartX;
        const deltaY = e.clientY - this.dragStartY;
        
        this.imageX = this.dragStartImageX + deltaX;
        this.imageY = this.dragStartImageY + deltaY;
        
        this.updateCanvas();
    }

    handleCanvasMouseUp() {
        if (this.isDraggingImage) {
            this.isDraggingImage = false;
            this.canvas.style.cursor = 'grab';
        }
    }

    // Touch handlers for canvas
    handleCanvasTouchStart(e) {
        if (!this.currentImage) return;
        
        e.preventDefault();
        const touch = e.touches[0];
        this.isDraggingImage = true;
        this.dragStartX = touch.clientX;
        this.dragStartY = touch.clientY;
        this.dragStartImageX = this.imageX;
        this.dragStartImageY = this.imageY;
    }

    handleCanvasTouchMove(e) {
        if (!this.isDraggingImage) return;
        
        e.preventDefault();
        const touch = e.touches[0];
        const deltaX = touch.clientX - this.dragStartX;
        const deltaY = touch.clientY - this.dragStartY;
        
        this.imageX = this.dragStartImageX + deltaX;
        this.imageY = this.dragStartImageY + deltaY;
        
        this.updateCanvas();
    }

    handleCanvasTouchEnd() {
        this.isDraggingImage = false;
    }

    // Text drag and drop handlers
    handleTextMouseDown(e) {
        this.isDraggingText = true;
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;
        this.dragStartTextX = parseInt(this.getTextOverlayStyle('left'));
        this.dragStartTextY = parseInt(this.getTextOverlayStyle('top'));
        e.preventDefault();
    }

    handleTextMouseMove(e) {
        if (!this.isDraggingText) return;
        
        const deltaX = e.clientX - this.dragStartX;
        const deltaY = e.clientY - this.dragStartY;
        
        const newX = this.dragStartTextX + deltaX;
        const newY = this.dragStartTextY + deltaY;
        
        this.setTextOverlayPosition(newX, newY);
        this.updateTextOverlay();
    }

    handleTextMouseUp() {
        this.isDraggingText = false;
    }

    // Touch handlers for text
    handleTextTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.isDraggingText = true;
        this.dragStartX = touch.clientX;
        this.dragStartY = touch.clientY;
        this.dragStartTextX = parseInt(this.getTextOverlayStyle('left'));
        this.dragStartTextY = parseInt(this.getTextOverlayStyle('top'));
    }

    handleTextTouchMove(e) {
        if (!this.isDraggingText) return;
        
        e.preventDefault();
        const touch = e.touches[0];
        const deltaX = touch.clientX - this.dragStartX;
        const deltaY = touch.clientY - this.dragStartY;
        
        const newX = this.dragStartTextX + deltaX;
        const newY = this.dragStartTextY + deltaY;
        
        this.setTextOverlayPosition(newX, newY);
        this.updateTextOverlay();
    }

    handleTextTouchEnd() {
        this.isDraggingText = false;
    }

    async exportImage() {
        if (!this.currentImage) {
            alert('Please upload an image first');
            return;
        }

        try {
            const canvasWrapper = document.getElementById('canvasWrapper');
            
            // Capture exactly what is visible without resizing
            const exportCanvas = await html2canvas(canvasWrapper, {
                backgroundColor: null,
                scale: window.devicePixelRatio || 1,
                logging: false,
                useCORS: true
            });

            const randomNum = Math.floor(Math.random() * 9000) + 1000;
            const filename = `samp-tools-${randomNum}.png`;

            const link = document.createElement('a');
            link.download = filename;
            link.href = exportCanvas.toDataURL('image/png');
            link.click();

        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed. Please try again.');
        }
    }

    resetEditor() {
        if (confirm('Are you sure you want to reset the editor? This will clear all changes.')) {
            this.currentImage = null;
            this.imageScale = 1;
            this.imageX = 0;
            this.imageY = 0;
            this.fontSize = 14;
            this.rpTextNormal = '';
            this.rpTextSpecial = '';
            this.canvasWidth = 800;
            this.canvasHeight = 600;
            
            // Reset UI
            document.getElementById('zoomSlider').value = 1;
            document.getElementById('zoomValue').textContent = '1.0';
            const rpTextNormalEl = document.getElementById('rpTextNormal');
            const rpTextSpecialEl = document.getElementById('rpTextSpecial');
            if (rpTextNormalEl) rpTextNormalEl.value = '';
            if (rpTextSpecialEl) rpTextSpecialEl.value = '';
            document.getElementById('fontSize').value = 14;
            document.getElementById('fontSizeValue').textContent = '14';
            document.getElementById('imageInput').value = '';
            document.getElementById('canvasWidth').value = 800;
            document.getElementById('canvasHeight').value = 600;
            document.getElementById('canvasWidthValue').textContent = '800';
            document.getElementById('canvasHeightValue').textContent = '600';
            document.getElementById('canvasSizeDisplay').textContent = '800 × 600';
            
            // Reset text position to default with extremely close boundaries
            const textOverlay = document.getElementById('rpTextOverlay');
            textOverlay.style.left = '2px';
            textOverlay.style.top = '2px';
            
            this.resizeCanvas();
            this.updateCanvas();
            this.updateTextOverlay();
            this.loadDefaultImage(); // Load default image on reset
            
            alert('Editor reset successfully!');
        }
    }
}

// Initialize the editor when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new SSRPEditor();
});

// Desktop mode request function for mobile users
function requestDesktopMode() {
    // Try to request fullscreen on mobile
    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log('Fullscreen request failed:', err);
        });
    }
    
    // Show instructions for manual desktop mode
    alert('To enable desktop mode:\n\n1. Rotate your device to landscape\n2. Or use your browser\'s "Request Desktop Site" option\n3. Or access from a desktop computer for best results');
    
    // Hide the notification after user interaction
    const notification = document.getElementById('mobileNotification');
    if (notification) {
        notification.style.display = 'none';
    }
} 
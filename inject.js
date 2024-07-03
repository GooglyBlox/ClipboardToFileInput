(function() {
    'use strict';

    if (window.fileInputInterceptorActive) {
        return;
    }
    window.fileInputInterceptorActive = true;

    let isBrowseButtonClicked = false;
    let dragEnterCounter = 0;
    let clipboardData = null;
    let lastShowOverlayTime = 0;
    const DEBOUNCE_DELAY = 200;
    const originalStyles = {};

    function createOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'custom-file-upload-overlay';
        overlay.style.cssText = `
            position: fixed; left: 0; top: 0; width: 100%; height: 100%;
            background-color: rgba(15, 17, 17, 0.7); display: flex;
            justify-content: center; align-items: center; z-index: 10000;
            backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
        `;
        return overlay;
    }

    function removeOverlay(overlay) {
        if (overlay && overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
    }

    function applyButtonStyles(button) {
        button.style.cssText = `
            padding: 16px 32px; margin: 0 10px; border: none; border-radius: 50px;
            cursor: pointer; background: #085592; color: #e8e6e3; font-weight: 500;
            transition: all 0.3s ease; font-size: 16px; text-transform: uppercase;
            box-shadow: rgba(0, 0, 0, 0.1) 0px 4px 6px, rgba(0, 0, 0, 0.08) 0px 1px 3px;
        `;

        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-2px)';
            button.style.boxShadow = '0 7px 14px rgba(0, 0, 0, 0.12), 0 3px 6px rgba(0, 0, 0, 0.08)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)';
        });

        button.addEventListener('click', () => {
            button.style.transform = 'translateY(1px)';
            button.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)';
        });
    }

    function createImagePreviewElement() {
        const imagePreview = document.createElement('img');
        imagePreview.style.cssText = `
            max-width: 100%; max-height: 400px; height: auto; border-radius: 10px;
            object-fit: contain; margin-bottom: 30px; display: block; margin: 0 auto;
            box-shadow: rgba(0, 0, 0, 0.1) 0px 15px 30px;
        `;
        return imagePreview;
    }

    function createTextLabelElement(text) {
        const label = document.createElement('div');
        label.textContent = text;
        label.style.cssText = `
            color: #c8c3bc; text-align: center; margin-bottom: 20px;
            text-transform: uppercase; letter-spacing: 1px;
        `;
        return label;
    }

    function applyDragOverStyles(element) {
        originalStyles.border = element.style.border;
        originalStyles.backgroundColor = element.style.backgroundColor;

        element.style.border = '3px dashed #2196F3';
        element.style.backgroundColor = 'rgba(33, 150, 243, 0.1)';
        element.style.transition = 'all 0.3s ease';
    }

    function removeDragOverStyles(element) {
        element.style.border = originalStyles.border;
        element.style.backgroundColor = originalStyles.backgroundColor;
    }

    function generateRandomString(length) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    async function dataURLtoBlob(dataurl) {
        const arr = dataurl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const res = await fetch(dataurl);
        return await res.blob();
    }

    async function showCustomFileUploadOverlay(fileInput) {
        const currentTime = Date.now();
        if (currentTime - lastShowOverlayTime < DEBOUNCE_DELAY) {
            return;
        }
        lastShowOverlayTime = currentTime;

        let existingOverlay = document.getElementById('custom-file-upload-overlay');
        if (existingOverlay) {
            removeOverlay(existingOverlay);
        }

        existingOverlay = createOverlay();
        document.body.appendChild(existingOverlay);

        const container = document.createElement('div');
        container.style.cssText = `
            padding: 40px; background-color: #0f1111; border-radius: 20px; text-align: center;
            position: relative; overflow: hidden;
        `;
        
        const backgroundEffect = document.createElement('div');
        backgroundEffect.style.cssText = `
            position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
            background: linear-gradient(45deg, #0a6ab6, #145ea8);
            transform: rotate(-45deg); opacity: 0.1; z-index: -1;
        `;
        container.appendChild(backgroundEffect);

        const imagePreview = createImagePreviewElement();
        const imageLabel = createTextLabelElement("Image Preview");
        imageLabel.style.color = '#c8c3bc';
        imagePreview.style.display = 'none';
        imageLabel.style.display = 'none';

        container.append(imageLabel, imagePreview);

        const pasteButton = document.createElement('button');
        pasteButton.textContent = 'Paste File';
        applyButtonStyles(pasteButton);
        pasteButton.onclick = async () => {
            if (clipboardData) {
                await pasteFileIntoInput(fileInput, clipboardData);
                fileInput.dispatchEvent(new Event('change', { bubbles: true }));
                fileInput.dispatchEvent(new Event('input', { bubbles: true }));
                removeOverlay(existingOverlay);
            }
        };
        pasteButton.style.display = 'none';

        const browseButton = document.createElement('button');
        browseButton.textContent = 'Browse Files';
        browseButton.dataset.browseFiles = 'true';
        applyButtonStyles(browseButton);
        browseButton.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            isBrowseButtonClicked = true;
            removeOverlay(existingOverlay);
            setTimeout(() => {
                fileInput.click();
                setTimeout(() => {
                    isBrowseButtonClicked = false;
                }, 100);
            }, 0);
        };

        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex; justify-content: center; align-items: center; margin-top: 30px;
        `;

        buttonContainer.appendChild(pasteButton);
        buttonContainer.appendChild(browseButton);

        container.appendChild(buttonContainer);
        existingOverlay.appendChild(container);

        window.top.postMessage({ type: 'REQUEST_CLIPBOARD_HELPER', frameId: window.frameElement ? window.frameElement.id : 'top' }, '*');

        setupDragAndDropEvents(container, fileInput);
        
        existingOverlay.onclick = (event) => {
            if (event.target === existingOverlay) {
                removeOverlay(existingOverlay);
            }
        };

        const escapeHandler = (event) => {
            if (event.key === 'Escape') {
                removeOverlay(existingOverlay);
                document.removeEventListener('keydown', escapeHandler);
            }
        };

        document.addEventListener('keydown', escapeHandler);
    }

    function updateOverlayWithClipboardData() {
        const overlay = document.getElementById('custom-file-upload-overlay');
        if (!overlay) return;

        const pasteButton = overlay.querySelector('button');
        const imagePreview = overlay.querySelector('img');
        const imageLabel = overlay.querySelector('div[style*="color: #c8c3bc"]');

        if (clipboardData && (clipboardData.mimeType.startsWith('image/') || clipboardData.mimeType === 'text/plain')) {
            pasteButton.style.display = 'inline-block';
        } else {
            pasteButton.style.display = 'none';
        }

        if (clipboardData && clipboardData.mimeType.startsWith('image/')) {
            imagePreview.src = clipboardData.fileDataUrl;
            imagePreview.style.display = 'block';
            // imageLabel.style.display = 'block';
        } else {
            imagePreview.style.display = 'none';
            // imageLabel.style.display = 'none';
        }
    }

    function handleFileInputInteraction(event) {
        const fileInput = event.target.closest('input[type="file"]');
        if (fileInput && !isBrowseButtonClicked) {
            event.preventDefault();
            event.stopPropagation();
            showCustomFileUploadOverlay(fileInput);
        }
    }

    function setupDragAndDropEvents(container, fileInput) {
        const handleDragEvents = (event, handler) => {
            event.stopPropagation();
            event.preventDefault();
            handler(event, container);
        };

        const handleDrop = async (event) => {
            event.stopPropagation();
            event.preventDefault();
            dragEnterCounter = 0;
            removeDragOverStyles(container);
            const files = event.dataTransfer.files;
        
            if (files.length > 0) {
                fileInput.files = files;
                fileInput.dispatchEvent(new Event('change', { bubbles: true }));
                fileInput.dispatchEvent(new Event('input', { bubbles: true }));
                removeOverlay(document.getElementById('custom-file-upload-overlay'));
            }
        };

        container.addEventListener('dragover', (event) => handleDragEvents(event, handleDragOver));
        container.addEventListener('dragenter', (event) => handleDragEvents(event, handleDragEnter));
        container.addEventListener('dragleave', (event) => handleDragEvents(event, handleDragLeave));
        container.addEventListener('drop', (event) => handleDrop(event));
    }

    function handleDragEnter(event, container) {
        dragEnterCounter++;
        if (dragEnterCounter === 1) {
            applyDragOverStyles(container);
        }
    }

    function handleDragLeave(event, container) {
        dragEnterCounter--;
        if (dragEnterCounter === 0) {
            removeDragOverStyles(container);
        }
    }

    function handleDragOver(event) {
        event.dataTransfer.dropEffect = 'copy';
    }

    async function pasteFileIntoInput(fileInput, data) {
        try {
            const blob = await dataURLtoBlob(data.fileDataUrl);
            let fileExtension;
            if (data.mimeType === 'image/webp') {
                fileExtension = 'webp';
            } else if (data.mimeType === 'text/plain') {
                fileExtension = 'txt';
            } else {
                fileExtension = data.mimeType.split('/')[1] || 'bin';
            }
            const fileName = `pasted-file-${generateRandomString(6)}.${fileExtension}`;
            const file = new File([blob], fileName, { type: data.mimeType });
    
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
    
            fileInput.files = dataTransfer.files;
    
            fileInput.dispatchEvent(new Event('change', { bubbles: true }));
            fileInput.dispatchEvent(new Event('input', { bubbles: true }));
    
            removeOverlay(document.getElementById('custom-file-upload-overlay'));
        } catch (error) {
            console.error("Error pasting file into input:", error);
        }
    }

    function setupFileInputListeners(root = document) {
        root.addEventListener('click', handleFileInputInteraction, true);
    }

    setupFileInputListeners();

    window.addEventListener('message', function(event) {
        if (event.data && event.data.type === 'CLIPBOARD_DATA') {
            clipboardData = event.data.clipboardData;
            updateOverlayWithClipboardData();
        }
    });

    const originalShowPicker = HTMLInputElement.prototype.showPicker;
    HTMLInputElement.prototype.showPicker = function() {
        if (this.type === 'file') {
            showCustomFileUploadOverlay(this);
        } else {
            return originalShowPicker.apply(this, arguments);
        }
    };

    document.addEventListener('click', function(event) {
        if (event.target.type === 'file' && !isBrowseButtonClicked) {
            event.preventDefault();
            event.stopPropagation();
            showCustomFileUploadOverlay(event.target);
        }
    }, true);

    console.log('Consistent overlay file input interceptor is active!');
})();
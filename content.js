// --- Global Variables ---
let isBrowseButtonClicked = false;
let dragEnterCounter = 0;
let clipboardData = null;
let lastShowOverlayTime = 0;
const DEBOUNCE_DELAY = 200;
const originalStyles = {};

// --- Utility Functions ---
function createOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'custom-file-upload-overlay';
    overlay.style.cssText = `
        position: fixed; left: 0; top: 0; width: 100%; height: 100%;
        background-color: rgba(15, 17, 17, 0.7); display: flex;
        justify-content: center; align-items: center; z-index: 10000;
        backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
    `;

    const styleLink = document.createElement('link');
    styleLink.rel = 'stylesheet';
    styleLink.href = chrome.runtime.getURL('css/styles.css');
    overlay.appendChild(styleLink);

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

function triggerDefaultFileDialog(inputElement) {
    setTimeout(() => inputElement.click(), 100);
}

async function dataURLtoBlob(dataurl) {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const res = await fetch(dataurl);
    return await res.blob();
}

// --- Overlay Functions ---
async function showCustomFileUploadOverlay(fileInput) {
    const currentTime = Date.now();
    if (currentTime - lastShowOverlayTime < DEBOUNCE_DELAY) {
        return;
    }
    lastShowOverlayTime = currentTime;

    if (isBrowseButtonClicked) {
        isBrowseButtonClicked = false;
        return;
    }
    
    let existingOverlay = document.getElementById('custom-file-upload-overlay');
    if (existingOverlay) {
        removeOverlay(existingOverlay);
    }

    existingOverlay = createOverlay();
    document.body.appendChild(existingOverlay);
    setupCloseOverlayEvents(existingOverlay);

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
    pasteButton.onclick = () => {
        if (clipboardData) {
            pasteFileIntoInput(fileInput, clipboardData);
        }
    };

    const browseButton = document.createElement('button');
    browseButton.textContent = 'Browse Files';
    applyButtonStyles(browseButton);
    browseButton.onclick = () => {
        isBrowseButtonClicked = true;
        removeOverlay(existingOverlay);
        triggerDefaultFileDialog(fileInput);
    };

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: flex; justify-content: center; align-items: center; margin-top: 30px;
    `;

    fileInput.addEventListener('change', () => {
        isBrowseButtonClicked = false;
        clipboardData = null;
    }, { once: true });

    if (!clipboardData && !isBrowseButtonClicked) {
        openClipboardHelper();
    }

    buttonContainer.appendChild(pasteButton);
    buttonContainer.appendChild(browseButton);

    const clipboardMessage = document.createElement('div');
    clipboardMessage.style.cssText = `
        color: #f54e42; text-align: center;
        display: none; margin-bottom: 20px;
    `;
    clipboardMessage.textContent = 'Awaiting image from clipboard...';

    container.appendChild(clipboardMessage);
    container.append(buttonContainer);
    existingOverlay.appendChild(container);
    fadeInOverlay(existingOverlay);
    setupDragAndDropEvents(container, fileInput, imagePreview);
    existingOverlay.onclick = () => {
        clipboardData = null;
        removeOverlay(existingOverlay);
    };

    await new Promise(resolve => {
        const checkClipboardData = () => {
            if (clipboardData) {
                resolve();
            } else {
                setTimeout(checkClipboardData, 100);
            }
        };
        checkClipboardData();
    });

    if (clipboardData && clipboardData.mimeType.startsWith('image/')) {
        imagePreview.src = clipboardData.fileDataUrl;
        imagePreview.style.display = 'block';
        imageLabel.style.display = 'block';
    } else {
        imagePreview.style.display = 'none';
        imageLabel.style.display = 'none';
    }
}

function fadeInOverlay(overlay) {
    overlay.style.opacity = '0';
    setTimeout(() => {
        overlay.style.transition = 'opacity 0.5s ease';
        overlay.style.opacity = '1';
    }, 0);
}

function setupCloseOverlayEvents(overlay) {
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            removeOverlay(overlay);
        }
    });

    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
            removeOverlay(overlay);
        }
    });
}

// --- Drag and Drop Functions ---
function setupDragAndDropEvents(container, fileInput, imagePreview) {
    const handleDragEvents = (event, handler) => {
        event.stopPropagation();
        event.preventDefault();
        handler(event, container);
    };

    const handleDrop = (event) => {
        event.stopPropagation();
        event.preventDefault();
        dragEnterCounter = 0;
        removeDragOverStyles(container);
        const files = event.dataTransfer.files;
    
        if (files.length > 0) {
            prepareFilesForUpload(fileInput, files);
            removeOverlay(document.getElementById('custom-file-upload-overlay'));
        }
    };

    container.addEventListener('dragover', (event) => handleDragEvents(event, handleDragOver));
    container.addEventListener('dragenter', (event) => handleDragEvents(event, handleDragEnter));
    container.addEventListener('dragleave', (event) => handleDragEvents(event, handleDragLeave));
    container.addEventListener('drop', (event) => handleDrop(event));

    const buttons = container.querySelectorAll('button');
    buttons.forEach((button) => {
        button.addEventListener('dragover', (event) => handleDragEvents(event, handleDragOver));
        button.addEventListener('dragenter', (event) => handleDragEvents(event, handleDragEnter));
        button.addEventListener('dragleave', (event) => handleDragEvents(event, handleDragLeave));
        button.addEventListener('drop', (event) => handleDrop(event));
    });
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

function prepareFilesForUpload(fileInput, files) {
    const fileList = new DataTransfer();
    for (const file of files) {
        fileList.items.add(file);
    }
    fileInput.files = fileList.files;
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));
}

// --- Clipboard Functions ---
function openClipboardHelper() {
    chrome.runtime.sendMessage({ action: "openClipboardHelper" });
}

async function pasteFileIntoInput(fileInput, data) {
    try {
        const blob = await dataURLtoBlob(data.fileDataUrl);
        let fileExtension;
        if (data.mimeType === 'image/webp') {
            fileExtension = 'webp';
        } else {
            fileExtension = data.mimeType.split('/')[1] || 'bin';
        }
        const fileName = `pasted-file-${generateRandomString(6)}.${fileExtension}`;
        const file = new File([blob], fileName, { type: data.mimeType });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput.files = dataTransfer.files;
        fileInput.dispatchEvent(new Event('change', { bubbles: true }));
        removeOverlay(document.getElementById('custom-file-upload-overlay'));

        console.log('Uploaded file base64 URL:', data.fileDataUrl);
    } catch (error) {
        console.error("Error pasting file into input:", error);
    }
}

// --- Event Handlers ---
function shouldPreventDefault(fileInput) {
    return !isBrowseButtonClicked;
}

// --- Event Listeners ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.fileDataUrl && request.mimeType) {
        clipboardData = {
            fileDataUrl: request.fileDataUrl,
            mimeType: request.mimeType
        };
        sendResponse({ success: true });
    } else {
        sendResponse({ success: false, error: 'No file data provided.' });
    }
    return true;
});

document.addEventListener('focusin', (event) => {
    if (event.target.tagName.toLowerCase() === 'input' && event.target.type === 'file' && !event.target.hasAttribute('webkitdirectory')) {
        console.debug('Focusin event:', event);
        event.preventDefault();
        showCustomFileUploadOverlay(event.target);
    }
}, true);

document.addEventListener('paste', async (event) => {
    const activeElement = document.activeElement;
    if (activeElement.tagName.toLowerCase() === 'input' && activeElement.type === 'file') {
        console.debug('Paste event:', event);
        const result = await pasteFileIntoInput(activeElement);
        if (result.success) {
            event.preventDefault();
        } else {
            console.error(result.error);
        }
    }
});

document.addEventListener("click", async (event) => {
    const fileInput = findFileInput(event.target);

    if (fileInput) {
        if (isBrowseButtonClicked) {
            isBrowseButtonClicked = false;
            return;
        }

        event.preventDefault();
        await showCustomFileUploadOverlay(fileInput);
    }
});

function findFileInput(element) {
    if (element.tagName.toLowerCase() === 'input' && element.type === 'file') {
        return element;
    }

    if (element.tagName.toLowerCase() === 'label' && element.control && element.control.type === 'file') {
        return element.control;
    }

    let currentElement = element;
    while (currentElement) {
        if (currentElement.tagName.toLowerCase() === 'label' && currentElement.control && currentElement.control.type === 'file') {
            return currentElement.control;
        }
        currentElement = currentElement.parentElement;
    }

    const allFileInputs = document.querySelectorAll('input[type="file"]:not([webkitdirectory])');
    for (const fileInput of allFileInputs) {
        if (fileInput.offsetParent === null) {
            return fileInput;
        }
    }

    return null;
}

const fileInputSelector = 'input[type="file"]:not([webkitdirectory])';

function handleNewFileInput(fileInput) {
    if (!fileInputWeakMap.has(fileInput)) {
        const customFileUploadHandled = {
            value: true,
            writable: true
        };
        const showPickerOriginal = {
            value: fileInput.showPicker,
            writable: true
        };
        fileInputWeakMap.set(fileInput, {
            customFileUploadHandled,
            showPickerOriginal
        });

        fileInput.addEventListener('click', (event) => {
            if (shouldPreventDefault(fileInput)) {
                event.preventDefault();
                showCustomFileUploadOverlay(fileInput).catch(error => {
                    console.error("Error in showCustomFileUploadOverlay:", error);
                });
            }
        });

        fileInput.addEventListener('paste', async (event) => {
            try {
                const result = await pasteFileIntoInput(fileInput);
                if (result.success) {
                    event.preventDefault();
                } else {
                    console.error(result.error);
                }
            } catch (error) {
                console.error("Error in pasteFileIntoInput:", error);
            }
        });

        fileInput.addEventListener('change', () => {
            clipboardData = null;
        });
    }
}

Object.defineProperty(HTMLInputElement.prototype, 'showPicker', {
    configurable: true,
    enumerable: true,
    writable: true,
    value: function() {
        if (this.type === 'file') {
            showCustomFileUploadOverlay(this).catch(error => {
                console.error("Error in showCustomFileUploadOverlay:", error);
            });
        } else if (typeof this.__showPickerOriginal === 'function') {
            this.__showPickerOriginal();
        }
    }
});

if (!HTMLInputElement.prototype.__showPickerOriginal) {
    HTMLInputElement.prototype.__showPickerOriginal = HTMLInputElement.prototype.showPicker;
}

const fileInputWeakMap = new WeakMap();

const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.matches(fileInputSelector)) {
                    handleNewFileInput(node);
                }

                const fileInputs = node.querySelectorAll ? node.querySelectorAll(fileInputSelector) : [];
                fileInputs.forEach((fileInput) => {
                    handleNewFileInput(fileInput);
                });
            }
        });
    });
});

observer.observe(document.body, { childList: true, subtree: true }); 
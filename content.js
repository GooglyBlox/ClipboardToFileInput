// Dear user:
// When I wrote this code, only god and I knew how it worked.
// Now, only god knows it!
// Will go back to clean up my code a little later.

// --- Global Variables ---
const originalStyles = {};
let isBrowseButtonClicked = false;
let dragEnterCounter = 0;
let clipboardData = null;


// --- Utility Functions ---
function createOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'custom-file-upload-overlay';
    Object.assign(overlay.style, {
        position: 'fixed', left: '0', top: '0', width: '100%', height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex',
        justifyContent: 'center', alignItems: 'center', zIndex: '10000'
    });
    return overlay;
}

function removeOverlay(overlay) {
    if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
    }
}

function applyButtonStyles(button) {
    Object.assign(button.style, {
        padding: '10px 20px', marginRight: '10px', border: 'none', borderRadius: '5px',
        cursor: 'pointer', background: '#007BFF', color: 'white', fontWeight: 'bold',
        transition: 'background-color 0.3s ease'
    });

    button.onmouseenter = () => button.style.backgroundColor = '#0056b3';
    button.onmouseleave = () => button.style.backgroundColor = '#007BFF';
}

function createImagePreviewElement() {
    const imagePreview = document.createElement('img');
    Object.assign(imagePreview.style, {
        maxWidth: '600px',
        maxHeight: '600px',
        height: 'auto',
        borderRadius: '5px',
        border: '1px solid #ccc',
        padding: '5px',
        backgroundColor: '#f8f8f8',
        objectFit: 'contain',
        marginBottom: '10px',
        display: 'block',
        margin: '0 auto'
    });
    return imagePreview;
}

function createTextLabelElement(text) {
    const label = document.createElement('div');
    label.textContent = text;
    Object.assign(label.style, {
        color: '#000',
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: '10px'
    });
    return label;
}

function applyDragOverStyles(element) {
    originalStyles.border = element.style.border;
    originalStyles.backgroundColor = element.style.backgroundColor;

    Object.assign(element.style, {
        border: '2px dashed #007bff',
        backgroundColor: 'rgba(0, 123, 255, 0.1)'
    });
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
    setTimeout(() => {
        inputElement.click();
    }, 100);
}

async function dataURLtoBlob(dataurl) {
    var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1];
    
    const res = await fetch(dataurl);
    return await res.blob();
}

// --- Overlay Functions ---
async function showCustomFileUploadOverlay(fileInput) {
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
    Object.assign(container.style, {
        padding: '20px', background: 'white', borderRadius: '10px', textAlign: 'center',
        boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)'
    });

    const pasteButton = document.createElement('button');
    pasteButton.textContent = 'Paste File';
    applyButtonStyles(pasteButton);
    pasteButton.onclick = () => {
        if (clipboardData) {
            pasteFileIntoInput(fileInput, clipboardData);
        } else {
            openClipboardHelper();
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

    fileInput.addEventListener('change', () => {
        isBrowseButtonClicked = false;
    }, { once: true });


    const imagePreview = createImagePreviewElement();
    const imageLabel = createTextLabelElement("Image Preview");

    imagePreview.style.display = 'none';
    imageLabel.style.display = 'none';

    container.appendChild(imageLabel);

    if (clipboardData && clipboardData.mimeType.startsWith('image/')) {
        imagePreview.src = clipboardData.fileDataUrl;
        imagePreview.style.display = 'block';
        imageLabel.style.display = 'block';
    }

    if (!clipboardData && !isBrowseButtonClicked) {
        openClipboardHelper();
    }

    const clipboardMessage = document.createElement('div');
    Object.assign(clipboardMessage.style, {
        color: 'red',
        fontWeight: 'bold',
        textAlign: 'center',
        display: 'none',
        marginBottom: '10px'
    });
    clipboardMessage.textContent = 'Awaiting image from clipboard...';

    container.appendChild(clipboardMessage);
    container.append(imageLabel, imagePreview, pasteButton, browseButton);
    existingOverlay.append(container);
    fadeInOverlay(existingOverlay);
    setupDragAndDropEvents(container, fileInput, imagePreview);
    existingOverlay.onclick = () => {
        clipboardData = null;
        removeOverlay(existingOverlay);
    };
}

function fadeInOverlay(overlay) {
    overlay.style.opacity = '0';
    setTimeout(() => {
        overlay.style.transition = 'opacity 0.5s ease';
        overlay.style.opacity = '1';
    }, 0);
}

function setupCloseOverlayEvents(overlay) {
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            removeOverlay(overlay);
        }
    });

    overlay.addEventListener('click', function(event) {
        if (event.target === overlay) {
            removeOverlay(overlay);
        }
    });
}

function removeOverlayImmediately() { // really just a second way for me to remove the overlay, its messy but I'll put in the work to clean it up later
    const overlay = document.getElementById('custom-file-upload-overlay');
    if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
    } else {
        console.error('Overlay not found');
    }
}


// --- Drag and Drop Functions ---
function setupDragAndDropEvents(container, fileInput, imagePreview) {
    container.addEventListener('dragover', handleDragOver, false);
    container.addEventListener('dragenter', event => handleDragEnter(event, container), false);
    container.addEventListener('dragleave', event => handleDragLeave(event, container), false);
    container.addEventListener('drop', event => handleDrop(event, fileInput, container, imagePreview), false);

    let buttons = container.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('dragover', handleDragOver, false);
        button.addEventListener('dragenter', event => handleDragEnter(event, container), false);
        button.addEventListener('dragleave', event => handleDragLeave(event, container), false);
        button.addEventListener('drop', event => handleDrop(event, fileInput, container, imagePreview), false);
    });
}

function handleDragEnter(event, container) {
    event.stopPropagation();
    event.preventDefault();
    dragEnterCounter++;
    if (dragEnterCounter === 1) {
        applyDragOverStyles(container);
    }
}

function handleDragLeave(event, container) {
    event.stopPropagation();
    event.preventDefault();
    dragEnterCounter--;
    if (dragEnterCounter === 0) {
        removeDragOverStyles(container);
    }
}

function handleDragOver(event) {
    event.stopPropagation();
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
}

function handleDrop(event, fileInput, container, imagePreview) {
    event.stopPropagation();
    event.preventDefault();
    dragEnterCounter = 0;
    removeDragOverStyles(container);
    const files = event.dataTransfer.files;

    if (files.length > 0) {
        if (files[0].type.startsWith('image/')) {
            const imageSrc = URL.createObjectURL(files[0]);

            imagePreview.src = imageSrc;
            imagePreview.style.display = 'block';
            container.appendChild(imagePreview);
        } else {
            // ¯\_(ツ)_/¯
        }

        prepareFilesForUpload(fileInput, files);
        removeOverlayImmediately();
    }
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
    const blob = await dataURLtoBlob(data.fileDataUrl);
    const fileExtension = data.mimeType.split('/')[1] || 'bin';
    const fileName = `pasted-file-${generateRandomString(6)}.${fileExtension}`;
    const file = new File([blob], fileName, { type: data.mimeType });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    fileInput.files = dataTransfer.files;
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    removeOverlayImmediately();

    console.log('Uploaded file base64 URL:', data.fileDataUrl);
}

// --- Event Handlers ---
function shouldPreventDefault(fileInput) {
    return !isBrowseButtonClicked;
}


// --- Event Listeners ---
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
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


document.addEventListener('focusin', function(event) {
    if (event.target.tagName.toLowerCase() === 'input' && event.target.type === 'file' && !event.target.hasAttribute('webkitdirectory')) {
        console.debug('Focusin event:', event);
        event.preventDefault();
        showCustomFileUploadOverlay(event.target);
    }
}, true);

document.addEventListener('paste', async function(event) {
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
    let target;
  
    if (event.target.matches("input[type=file]:not([webkitdirectory])")) {
        target = event.target;
    } else {
        const path = event.path || (event.composedPath && event.composedPath());
        if (path && path[0].matches("input[type=file]:not([webkitdirectory])")) {
        target = path[0];
        }
    }
  
    if (target) {
        handleNewFileInput(target);
    }
  });


function handleNewFileInput(fileInput) {
    if (!fileInput.__customFileUploadHandled) {
        fileInput.__customFileUploadHandled = true;

        fileInput.addEventListener('click', (event) => {
            if (shouldPreventDefault(fileInput)) {
                event.preventDefault();
                showCustomFileUploadOverlay(fileInput);
            }
        });

        fileInput.addEventListener('paste', async (event) => {
            const result = await pasteFileIntoInput(fileInput);
            if (result.success) {
                event.preventDefault();
            } else {
                console.error(result.error);
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
            handleNewFileInput(this);
            if (typeof this.__showPickerOriginal === 'function') {
                this.__showPickerOriginal();
            }
        } else if (typeof this.__showPickerOriginal === 'function') {
            this.__showPickerOriginal();
        }
    }
});

if (!HTMLInputElement.prototype.__showPickerOriginal) {
    HTMLInputElement.prototype.__showPickerOriginal = HTMLInputElement.prototype.showPicker;
}

const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.matches('input[type="file"]')) {
                    handleNewFileInput(node);
                }

                const fileInputs = node.querySelectorAll ? node.querySelectorAll('input[type="file"]') : [];
                fileInputs.forEach((fileInput) => {
                    handleNewFileInput(fileInput);
                });
            }
        });
    });
});

observer.observe(document.body, { childList: true, subtree: true });
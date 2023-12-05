// --- Global Variables ---
const originalStyles = {};
let isBrowseButtonClicked = false;
let dragEnterCounter = 0;


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

function createSpacerElement(height) {
    const spacer = document.createElement('div');
    spacer.style.height = height + 'px';
    return spacer;
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


function applyFileReadyStyles(element) {
    Object.assign(element.style, {
        border: '2px solid #28a745',
        backgroundColor: 'rgba(40, 167, 69, 0.1)'
    });
}

function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

function isHidden(element) {
    const style = window.getComputedStyle(element);
    return style.display === 'none' || style.visibility === 'hidden';
}

function triggerDefaultFileDialog(inputElement) {
    setTimeout(() => {
        inputElement.click();
    }, 100);
}


function preventDefaultClickHandler(event) {
    event.preventDefault();
}

function handleFileInput(fileInput) {
    fileInput.addEventListener('click', (event) => {
        if (!isBrowseButtonClicked) {
            event.preventDefault();
        } else {
            isBrowseButtonClicked = false;
        }
    });

    showCustomFileUploadOverlay(fileInput);
}

function findNearestFileInput(element) {
    let currentElement = element;
    let searchDepth = 0;
    const maxDepth = 5;

    while (currentElement && searchDepth < maxDepth) {
        if (currentElement.tagName.toLowerCase() === 'input' && currentElement.type === 'file' && !currentElement.hasAttribute('webkitdirectory')) {
            return currentElement;
        }
        let sibling = currentElement.previousElementSibling;
        while (sibling) {
            if (sibling.tagName.toLowerCase() === 'input' && sibling.type === 'file' && !sibling.hasAttribute('webkitdirectory')) {
                return sibling;
            }
            sibling = sibling.previousElementSibling;
        }
        currentElement = currentElement.parentElement;
        searchDepth++;
    }
    return null;
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
    pasteButton.onclick = async () => {
        const result = await pasteFileIntoInput(fileInput, existingOverlay);
        if (result.success) {
            removeOverlay(existingOverlay);
        } else {
            clipboardMessage.textContent = result.error || 'Error pasting file from clipboard';
            clipboardMessage.style.display = 'block';
        }
    };

    const browseButton = document.createElement('button');
    browseButton.textContent = 'Browse Files';
    applyButtonStyles(browseButton);
    browseButton.onclick = () => {
        isBrowseButtonClicked = true;
        removeOverlay(existingOverlay);
        fileInput.click();
    };

    const imagePreview = createImagePreviewElement();
    const imageLabel = createTextLabelElement("Image Preview");

    container.insertBefore(imagePreview, container.firstChild);

    const clipboardMessage = document.createElement('div');
    Object.assign(clipboardMessage.style, {
        color: 'red',
        fontWeight: 'bold',
        textAlign: 'center',
        display: 'none',
        marginBottom: '10px'
    });
    clipboardMessage.textContent = 'No valid clipboard data found';

    container.appendChild(clipboardMessage);

    const clipboardResult = await getClipboardImage();
    if (clipboardResult.url) {
        imagePreview.src = clipboardResult.url;
        imagePreview.style.display = 'block';
        container.insertBefore(imageLabel, imagePreview);
        const spacer = createSpacerElement(20);
        container.insertBefore(spacer, imagePreview.nextSibling);
    } else {
        console.error(clipboardResult.error);
        clipboardMessage.textContent = clipboardResult.error;
        clipboardMessage.style.display = 'block';
        imagePreview.style.display = 'none';
        imageLabel.style.display = 'none';
    }

    container.append(pasteButton, browseButton);
    existingOverlay.append(container);
    fadeInOverlay(existingOverlay);
    setupDragAndDropEvents(container, fileInput, imagePreview);
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

function removeOverlayImmediately() {
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
async function getClipboardImage() {
    try {
        const clipboardItems = await navigator.clipboard.read();
        for (const item of clipboardItems) {
            if (item.types.includes('image/png')) {
                const blob = await item.getType('image/png');
                return { url: URL.createObjectURL(blob), error: null };
            }
        }
    } catch (error) {
        console.error('Error reading clipboard data:', error);
        return { url: null, error: 'Error reading clipboard data. Are you trying to paste a file from your system?' };
    }
    return { url: null, error: 'No valid clipboard data found' };
}


async function pasteFileIntoInput(fileInput, overlay) {
    try {
        const clipboardItems = await navigator.clipboard.read();
        const result = await processClipboardItems(clipboardItems, fileInput);
        if (!result.success) {
            const clipboardMessage = overlay.querySelector('div');
            clipboardMessage.style.display = 'block';
        }
        console.debug('Paste result:', result);
        return { success: true };
    } catch (error) {
        console.error('Error pasting file from clipboard:', error);
        return { success: false, error: error.message };
    }
}

async function processClipboardItems(clipboardItems, inputElement) {
    if (!clipboardItems.length) {
        return { success: false, error: 'No items in clipboard' };
    }

    for (const item of clipboardItems) {
        const types = item.types || [];
        for (const type of types) {
            if (type.startsWith('image/')) {
                const blob = await item.getType(type);
                let fileName = 'clipboard-file';

                if (item.name) {
                    fileName = item.name;
                } else {
                    const extension = type.split('/')[1];
                    const randomString = generateRandomString(6);
                    fileName = `clipboard-file-${randomString}.${extension}`;
                }

                const file = new File([blob], fileName, { type: type });
                const fileList = new DataTransfer();
                fileList.items.add(file);
                inputElement.files = fileList.files;
                inputElement.dispatchEvent(new Event('change', { bubbles: true }));

                return { success: true };
            } else if (type === 'text/html') {
                const html = await item.getType(type);
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const imgElement = doc.querySelector('img');
                if (imgElement && imgElement.src && imgElement.src.startsWith('data:image/')) {
                    const imageUrl = imgElement.src;
                    const blob = await fetch(imageUrl).then(response => response.blob());
                    const extension = imageUrl.split(';')[0].split('/')[1];
                    const fileName = `clipboard-file.${extension}`;

                    const file = new File([blob], fileName, { type: `image/${extension}` });
                    const fileList = new DataTransfer();
                    fileList.items.add(file);
                    inputElement.files = fileList.files;
                    inputElement.dispatchEvent(new Event('change', { bubbles: true }));

                    return { success: true };
                }
            } else if (type.startsWith('text/')) {
                const textData = await item.getType(type);
                const extension = type.split('/')[1];
                const randomString = generateRandomString(6);
                const fileName = `clipboard-text-${randomString}.${extension}`;

                const blob = new Blob([textData], { type: type });
                const file = new File([blob], fileName, { type: type });
                const fileList = new DataTransfer();
                fileList.items.add(file);
                inputElement.files = fileList.files;
                inputElement.dispatchEvent(new Event('change', { bubbles: true }));

                return { success: true };
            } else if (type === 'application/pdf') {
                const pdfData = await item.getType(type);
                const randomString = generateRandomString(6);
                const fileName = `clipboard-file-${randomString}.pdf`;

                const blob = new Blob([pdfData], { type: 'application/pdf' });
                const file = new File([blob], fileName, { type: 'application/pdf' });
                const fileList = new DataTransfer();
                fileList.items.add(file);
                inputElement.files = fileList.files;
                inputElement.dispatchEvent(new Event('change', { bubbles: true }));

                return { success: true };
            }
        }
    }

    return { success: false, error: 'No readable file found in clipboard items' };
}


// --- Event Handlers ---
function handleFileInputInteraction(fileInput) {
    fileInput.addEventListener('click', (event) => {
        if (shouldPreventDefault(fileInput)) {
            event.preventDefault();
            showCustomFileUploadOverlay(fileInput);
        } 
    });
}

function shouldPreventDefault(fileInput) {
    return !isBrowseButtonClicked;
}


// --- Event Listeners ---
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

document.addEventListener('click', function(event) {
    if (event.target.tagName.toLowerCase() === 'input' && event.target.type === 'file' && !event.target.hasAttribute('webkitdirectory')) {
        handleFileInputInteraction(event.target);
    }
}, true);

const observer = new MutationObserver(mutations => {
    console.debug('Mutation observed:', mutations);
    mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase() === 'input' && node.type === 'file') {
                if (isHidden(node)) {
                    node.addEventListener('focus', () => handleFileInput(node));
                } else {
                    node.addEventListener('focus', () => showCustomFileUploadOverlay(node));
                }
            }
        });
    });
});

observer.observe(document.body, { childList: true, subtree: true });
let isBrowseButtonClicked = false;

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

function showCustomFileUploadOverlay(fileInput) {
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
    pasteButton.onclick = () => pasteFileIntoInput(fileInput, existingOverlay);

    const browseButton = document.createElement('button');
    browseButton.textContent = 'Browse Files';
    applyButtonStyles(browseButton);
    browseButton.onclick = () => {
        isBrowseButtonClicked = true;
        removeOverlay(existingOverlay);
        fileInput.click();
    };

    container.append(pasteButton, browseButton);
    existingOverlay.append(container);
    fadeInOverlay(existingOverlay);
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

function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

async function pasteFileIntoInput(fileInput, overlay) {
    try {
        const clipboardItems = await navigator.clipboard.read();
        const result = await processClipboardItems(clipboardItems, fileInput);
        if (result.success) {
            removeOverlay(overlay);
            console.debug('Pasting file into input:', fileInput);
        }
        console.debug('Paste result:', result);
        return result;
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


function triggerDefaultFileDialog(inputElement) {
    setTimeout(() => {
        inputElement.click();
    }, 100);
}


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

function isHidden(element) {
    const style = window.getComputedStyle(element);
    return style.display === 'none' || style.visibility === 'hidden';
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

function shouldPreventDefault(fileInput) {
    return !isBrowseButtonClicked;
}

function handleFileInputInteraction(fileInput) {
    fileInput.addEventListener('click', (event) => {
        if (shouldPreventDefault(fileInput)) {
            event.preventDefault();
            showCustomFileUploadOverlay(fileInput);
        } 
    });
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
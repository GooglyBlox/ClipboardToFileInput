async function readClipboard() {
    try {
        const clipboardItems = await navigator.clipboard.read();
        console.log('Clipboard items retrieved:', clipboardItems);

        if (clipboardItems.length === 0) {
            chrome.runtime.sendMessage({ closeTab: true });
            return;
        }
        for (const clipboardItem of clipboardItems) {
            console.log('Processing clipboard item:', clipboardItem);
            for (const type of clipboardItem.types) {
                console.log('Found type in clipboard item:', type);
                if (type.startsWith('image/') || type === 'application/octet-stream') {
                    const blob = await clipboardItem.getType(type);
                    console.log('Blob retrieved:', blob);
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        console.log('Blob converted to Data URL:', reader.result);
                        let mimeType = type;
                        if (type === 'application/octet-stream' && blob.type === 'image/webp') {
                            mimeType = 'image/webp';
                        }
                        chrome.runtime.sendMessage({ fileDataUrl: reader.result, mimeType: mimeType }, (response) => {
                            if (chrome.runtime.lastError) {
                                console.error(`Error in sending message: ${chrome.runtime.lastError.message}`);
                            } else {
                                console.log('Message sent to background script, response:', response);
                                chrome.runtime.sendMessage({ closeTab: true });
                            }
                        });
                    };
                    reader.onerror = (error) => {
                        console.error('Error reading blob:', error);
                        chrome.runtime.sendMessage({ closeTab: true });
                    };
                    reader.readAsDataURL(blob);
                    return;
                } else if (type === 'text/plain') {
                    const text = await clipboardItem.getType(type);
                    console.log('Text retrieved:', text);
                    const blob = new Blob([text], { type: 'text/plain' });
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        console.log('Text converted to Data URL:', reader.result);
                        chrome.runtime.sendMessage({ fileDataUrl: reader.result, mimeType: 'text/plain' }, (response) => {
                            if (chrome.runtime.lastError) {
                                console.error(`Error in sending message: ${chrome.runtime.lastError.message}`);
                            } else {
                                console.log('Message sent to background script, response:', response);
                                chrome.runtime.sendMessage({ closeTab: true });
                            }
                        });
                    };
                    reader.onerror = (error) => {
                        console.error('Error reading text:', error);
                        chrome.runtime.sendMessage({ closeTab: true });
                    };
                    reader.readAsDataURL(blob);
                    return;
                }
            }
        }
        chrome.runtime.sendMessage({ closeTab: true });
    } catch (error) {
        console.error('Error accessing clipboard:', error);
        if (error.message.includes("Document is not focused")) {
            chrome.runtime.sendMessage({ closeTab: true });
        } else {
            const errorMessage = document.createElement('div');
            errorMessage.textContent = 'An error occurred while accessing the clipboard.';
            errorMessage.style.cssText = `
                color: #F44336; font-weight: 500; text-align: center; margin-top: 20px;
                font-size: 18px;
            `;
            document.body.appendChild(errorMessage);
        }
    }
}

readClipboard();
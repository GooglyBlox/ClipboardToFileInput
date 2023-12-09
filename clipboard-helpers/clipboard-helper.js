async function readClipboard() {
    try {
        const clipboardItems = await navigator.clipboard.read();
        console.log('Clipboard items retrieved:', clipboardItems);
        for (const clipboardItem of clipboardItems) {
            console.log('Processing clipboard item:', clipboardItem);
            for (const type of clipboardItem.types) {
                console.log('Found type in clipboard item:', type);
                const blob = await clipboardItem.getType(type);
                console.log('Blob retrieved:', blob);
                const reader = new FileReader();
                reader.onloadend = () => {
                    console.log('Blob converted to Data URL:', reader.result);
                    chrome.runtime.sendMessage({ fileDataUrl: reader.result, mimeType: type }, (response) => {
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
                };
                reader.readAsDataURL(blob);
                return;
            }
        }
    } catch (error) {
        console.error('Error accessing clipboard:', error);
        if (error.message.includes("Document is not focused")) { // this is so hacky but this error is so unnecessary
            chrome.runtime.sendMessage({ closeTab: true });
        } else {
            // document.dispatchEvent(new CustomEvent('clipboardAccessFailed')); -- not too necessary right now, will maybe handle logic for this another time
        }
    }
}

readClipboard();

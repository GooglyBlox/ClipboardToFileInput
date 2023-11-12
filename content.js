document.addEventListener('paste', (event) => {
    let clipboardData = event.clipboardData || window.clipboardData;
    let activeElement = document.activeElement;

    if (activeElement.tagName === 'INPUT' && activeElement.type === 'file') {
        if (clipboardData.items) {
            for (let i = 0; i < clipboardData.items.length; i++) {
                if (clipboardData.items[i].kind === 'file') {
                    let file = clipboardData.items[i].getAsFile();

                    let dataTransfer = new DataTransfer();
                    dataTransfer.items.add(file);

                    activeElement.files = dataTransfer.files;

                    event.preventDefault();
                }
            }
        }
    }
});

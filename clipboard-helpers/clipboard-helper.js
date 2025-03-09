/**
 * Reads clipboard content and sends it to the background script
 */
async function readClipboard() {
  try {
    const clipboardItems = await navigator.clipboard.read();
    console.log("Clipboard items retrieved:", clipboardItems);

    if (clipboardItems.length === 0) {
      closeHelperWindow();
      return;
    }

    for (const clipboardItem of clipboardItems) {
      console.log("Processing clipboard item:", clipboardItem);

      // Try image types first
      for (const type of clipboardItem.types) {
        console.log("Found type in clipboard item:", type);

        if (type.startsWith("image/") || type === "application/octet-stream") {
          const imageBlob = await clipboardItem.getType(type);
          await processImageBlob(imageBlob, type);
          return;
        }
      }

      // Try text as fallback
      if (clipboardItem.types.includes("text/plain")) {
        const text = await clipboardItem.getType("text/plain");
        await processTextContent(text);
        return;
      }
    }

    // No suitable content found
    closeHelperWindow();
  } catch (error) {
    handleClipboardError(error);
  }
}

/**
 * Processes image blob from clipboard
 * @param {Blob} blob - The image blob
 * @param {string} type - The content type
 */
async function processImageBlob(blob, type) {
  console.log("Processing image blob:", blob);

  try {
    // Fix MIME type for WebP images sometimes detected as octet-stream
    let mimeType = type;
    if (type === "application/octet-stream" && blob.type === "image/webp") {
      mimeType = "image/webp";
    }

    const dataUrl = await blobToDataURL(blob);
    console.log("Image converted to Data URL");

    // Send data URL to background script
    sendToBackgroundScript(dataUrl, mimeType);
  } catch (error) {
    console.error("Error processing image:", error);
    closeHelperWindow();
  }
}

/**
 * Processes text content from clipboard
 * @param {Blob} textBlob - The text content as blob
 */
async function processTextContent(textBlob) {
  console.log("Processing text content");

  try {
    const textContent = await textBlob.text();
    console.log(
      "Text retrieved:",
      textContent.substring(0, 100) + (textContent.length > 100 ? "..." : "")
    );

    const blob = new Blob([textContent], { type: "text/plain" });
    const dataUrl = await blobToDataURL(blob);

    // Send data URL to background script
    sendToBackgroundScript(dataUrl, "text/plain");
  } catch (error) {
    console.error("Error processing text:", error);
    closeHelperWindow();
  }
}

/**
 * Converts a blob to a data URL
 * @param {Blob} blob - The blob to convert
 * @returns {Promise<string>} A promise that resolves to a data URL
 */
function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(blob);
  });
}

/**
 * Sends clipboard data to the background script
 * @param {string} dataUrl - The data URL
 * @param {string} mimeType - The MIME type
 */
function sendToBackgroundScript(dataUrl, mimeType) {
  chrome.runtime.sendMessage(
    { fileDataUrl: dataUrl, mimeType: mimeType },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error(
          `Error in sending message: ${chrome.runtime.lastError.message}`
        );
      } else {
        console.log("Message sent to background script, response:", response);
      }
      closeHelperWindow();
    }
  );
}

/**
 * Closes the helper window
 */
function closeHelperWindow() {
  chrome.runtime.sendMessage({ closeTab: true });
}

/**
 * Handles clipboard access errors
 * @param {Error} error - The error
 */
function handleClipboardError(error) {
  console.error("Error accessing clipboard:", error);

  if (error.message.includes("Document is not focused")) {
    closeHelperWindow();
  } else {
    const errorMessage = document.createElement("div");
    errorMessage.textContent =
      "An error occurred while accessing the clipboard.";
    errorMessage.style.cssText = `
            color: #F44336; font-weight: 500; text-align: center; margin-top: 20px;
            font-size: 18px; padding: 12px; background-color: rgba(244, 67, 54, 0.1);
            border-radius: 4px;
        `;
    document.body.appendChild(errorMessage);

    // Close the window after 3 seconds on error
    setTimeout(closeHelperWindow, 3000);
  }
}

// Initialize clipboard reading
readClipboard();

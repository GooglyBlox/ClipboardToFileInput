(function () {
  "use strict";

  // Prevent multiple injections
  if (window.fileInputInterceptorActive) {
    return;
  }
  window.fileInputInterceptorActive = true;

  // Constants
  const DEBOUNCE_DELAY = 200;
  const OVERLAY_ID = "custom-file-upload-overlay";

  // State variables
  let isBrowseButtonClicked = false;
  let dragEnterCounter = 0;
  let clipboardData = null;
  let lastShowOverlayTime = 0;
  let originalStyles = {};

  /**
   * Creates the overlay container for the file upload dialog
   * @returns {HTMLElement} The created overlay element
   */
  function createOverlay() {
    const overlay = document.createElement("div");
    overlay.id = OVERLAY_ID;
    overlay.style.cssText = `
            position: fixed; left: 0; top: 0; width: 100%; height: 100%;
            background-color: rgba(15, 17, 17, 0.85); display: flex;
            justify-content: center; align-items: center; z-index: 10000;
            backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px);
            transition: opacity 0.3s ease;
        `;
    return overlay;
  }

  /**
   * Creates the content container within the overlay
   * @returns {HTMLElement} The created container element
   */
  function createContentContainer() {
    const container = document.createElement("div");
    container.style.cssText = `
            padding: 40px; background-color: #0f1111; border-radius: 16px; 
            text-align: center; position: relative; overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            width: 90%; max-width: 500px;
        `;

    // Add a subtle background effect
    const backgroundEffect = document.createElement("div");
    backgroundEffect.style.cssText = `
            position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
            background-color: #145ea8; opacity: 0.05; z-index: -1;
        `;
    container.appendChild(backgroundEffect);

    return container;
  }

  /**
   * Removes the overlay from the DOM
   * @param {HTMLElement} overlay - The overlay element to remove
   */
  function removeOverlay(overlay) {
    if (overlay && overlay.parentNode) {
      overlay.style.opacity = "0";
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      }, 300);
    }
  }

  /**
   * Applies styles to buttons to maintain consistent UI
   * @param {HTMLElement} button - The button element to style
   * @param {string} type - The type of button (primary or secondary)
   */
  function applyButtonStyles(button, type = "primary") {
    const baseStyles = `
            padding: 14px 28px; margin: 0 10px; border: none; border-radius: 8px;
            cursor: pointer; font-weight: 500; transition: all 0.2s ease; 
            font-size: 16px; text-transform: uppercase;
        `;

    if (type === "primary") {
      button.style.cssText =
        baseStyles +
        `
                background: #085592; color: #e8e6e3;
                box-shadow: rgba(0, 0, 0, 0.1) 0px 4px 6px, rgba(0, 0, 0, 0.08) 0px 1px 3px;
            `;
    } else {
      button.style.cssText =
        baseStyles +
        `
                background: #292929; color: #e8e6e3;
                box-shadow: rgba(0, 0, 0, 0.06) 0px 2px 4px, rgba(0, 0, 0, 0.05) 0px 1px 2px;
            `;
    }

    // Add hover and click effects
    button.addEventListener("mouseenter", () => {
      button.style.transform = "translateY(-2px)";
      if (type === "primary") {
        button.style.boxShadow =
          "0 6px 12px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08)";
      } else {
        button.style.boxShadow =
          "0 4px 8px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.06)";
      }
    });

    button.addEventListener("mouseleave", () => {
      button.style.transform = "translateY(0)";
      if (type === "primary") {
        button.style.boxShadow =
          "0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)";
      } else {
        button.style.boxShadow =
          "0 2px 4px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.05)";
      }
    });

    button.addEventListener("mousedown", () => {
      button.style.transform = "translateY(1px)";
      button.style.boxShadow =
        "0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)";
    });

    button.addEventListener("mouseup", () => {
      button.style.transform = "translateY(0)";
      if (type === "primary") {
        button.style.boxShadow =
          "0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)";
      } else {
        button.style.boxShadow =
          "0 2px 4px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.05)";
      }
    });
  }

  /**
   * Creates an image preview element for the overlay
   * @returns {HTMLElement} The created image preview element
   */
  function createImagePreviewElement() {
    const imagePreview = document.createElement("img");
    imagePreview.style.cssText = `
            max-width: 100%; max-height: 300px; height: auto; border-radius: 8px;
            object-fit: contain; margin-bottom: 24px; display: none;
            border: 1px solid rgba(255, 255, 255, 0.1);
        `;
    return imagePreview;
  }

  /**
   * Creates a text preview element for displaying file info
   * @returns {HTMLElement} The created text preview element
   */
  function createTextPreviewElement() {
    const textPreview = document.createElement("div");
    textPreview.style.cssText = `
            padding: 12px; background-color: #1a1a1a; border-radius: 8px;
            font-family: monospace; color: #e8e6e3; text-align: left;
            max-height: 200px; overflow-y: auto; margin-bottom: 24px;
            display: none; word-break: break-all; font-size: 14px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        `;
    return textPreview;
  }

  /**
   * Creates a text label element
   * @param {string} text - The text content of the label
   * @returns {HTMLElement} The created text label element
   */
  function createTextLabelElement(text) {
    const label = document.createElement("div");
    label.textContent = text;
    label.style.cssText = `
            color: #c8c3bc; text-align: center; margin-bottom: 16px;
            font-size: 16px; font-weight: 500;
        `;
    return label;
  }

  /**
   * Creates a file info element to display file details
   * @returns {HTMLElement} The created file info element
   */
  function createFileInfoElement() {
    const fileInfo = document.createElement("div");
    fileInfo.style.cssText = `
            color: #a0a0a0; font-size: 14px; margin-bottom: 20px;
            display: none;
        `;
    return fileInfo;
  }

  /**
   * Creates a drop zone indicator for drag and drop
   * @returns {HTMLElement} The created drop zone element
   */
  function createDropZoneElement() {
    const dropZone = document.createElement("div");
    dropZone.textContent = "Drop files here";
    dropZone.style.cssText = `
            border: 2px dashed #444; border-radius: 8px; padding: 40px;
            margin-bottom: 20px; color: #888; display: flex;
            justify-content: center; align-items: center; font-size: 18px;
            transition: all 0.3s ease;
        `;
    return dropZone;
  }

  /**
   * Applies drag-over styles to an element
   * @param {HTMLElement} element - The element to style
   */
  function applyDragOverStyles(element) {
    originalStyles.border = element.style.border;
    originalStyles.backgroundColor = element.style.backgroundColor;

    element.style.border = "2px dashed #085592";
    element.style.backgroundColor = "rgba(8, 85, 146, 0.1)";
    element.style.transition = "all 0.3s ease";
  }

  /**
   * Removes drag-over styles from an element
   * @param {HTMLElement} element - The element to restore
   */
  function removeDragOverStyles(element) {
    element.style.border = originalStyles.border;
    element.style.backgroundColor = originalStyles.backgroundColor;
  }

  /**
   * Generates a random string for unique file names
   * @param {number} length - The desired string length
   * @returns {string} A random string
   */
  function generateRandomString(length) {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    return result;
  }

  /**
   * Converts a data URL to a Blob object
   * @param {string} dataurl - The data URL to convert
   * @returns {Promise<Blob>} A promise that resolves to a Blob
   */
  async function dataURLtoBlob(dataurl) {
    try {
      const arr = dataurl.split(",");
      const mime = arr[0].match(/:(.*?);/)[1];
      const res = await fetch(dataurl);
      return await res.blob();
    } catch (error) {
      console.error("Error converting dataURL to Blob:", error);
      throw error;
    }
  }

  /**
   * Gets the appropriate file extension based on mime type
   * @param {string} mimeType - The mime type of the file
   * @returns {string} The file extension
   */
  function getFileExtension(mimeType) {
    const mimeToExt = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/gif": "gif",
      "image/webp": "webp",
      "image/svg+xml": "svg",
      "image/bmp": "bmp",
      "text/plain": "txt",
      "application/pdf": "pdf",
      "application/json": "json",
      "application/xml": "xml",
      "application/zip": "zip",
    };

    return mimeToExt[mimeType] || mimeType.split("/")[1] || "bin";
  }

  /**
   * Formats a file size into a human-readable string
   * @param {number} bytes - The file size in bytes
   * @returns {string} Formatted file size
   */
  function formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  /**
   * Creates and shows the custom file upload overlay
   * @param {HTMLInputElement} fileInput - The file input element
   */
  async function showCustomFileUploadOverlay(fileInput) {
    const currentTime = Date.now();
    if (currentTime - lastShowOverlayTime < DEBOUNCE_DELAY) {
      return;
    }
    lastShowOverlayTime = currentTime;

    // Remove any existing overlay
    let existingOverlay = document.getElementById(OVERLAY_ID);
    if (existingOverlay) {
      removeOverlay(existingOverlay);
    }

    // Create a new overlay
    existingOverlay = createOverlay();
    document.body.appendChild(existingOverlay);

    // Fade in the overlay
    setTimeout(() => {
      existingOverlay.style.opacity = "1";
    }, 10);

    // Create the content container
    const container = createContentContainer();
    existingOverlay.appendChild(container);

    // Add title
    const title = document.createElement("h2");
    title.textContent = "Upload File";
    title.style.cssText = `
            color: #e8e6e3; margin-top: 0; margin-bottom: 24px;
            font-size: 24px; font-weight: 500;
        `;
    container.appendChild(title);

    // Create file preview elements
    const imagePreview = createImagePreviewElement();
    const textPreview = createTextPreviewElement();
    const fileInfo = createFileInfoElement();

    // Create a drop zone for drag and drop
    const dropZone = createDropZoneElement();
    dropZone.textContent = "Drag & drop files here or use buttons below";

    // Add elements to container
    container.appendChild(dropZone);
    container.appendChild(fileInfo);
    container.appendChild(imagePreview);
    container.appendChild(textPreview);

    // Create buttons
    const buttonContainer = document.createElement("div");
    buttonContainer.style.cssText = `
    display: flex; justify-content: center; align-items: center; 
    margin-top: 20px; flex-wrap: wrap; gap: 10px;
`;

    // Paste Button
    const pasteButton = document.createElement("button");
    pasteButton.textContent = "Paste File";
    pasteButton.title = "Paste file from clipboard";
    applyButtonStyles(pasteButton, "primary");
    pasteButton.style.display = "none"; // Hidden until clipboard data is available
    pasteButton.onclick = async () => {
      if (clipboardData) {
        try {
          await pasteFileIntoInput(fileInput, clipboardData);
          removeOverlay(existingOverlay);
        } catch (error) {
          console.error("Error pasting file:", error);
          showErrorMessage(container, "Failed to paste file from clipboard");
        }
      }
    };

    // Browse Button
    const browseButton = document.createElement("button");
    browseButton.textContent = "Browse Files";
    browseButton.title = "Select files from your device";
    browseButton.dataset.browseFiles = "true";
    applyButtonStyles(browseButton, "secondary");
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
      }, 50);
    };

    // Cancel Button
    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Cancel";
    cancelButton.title = "Cancel file upload";
    applyButtonStyles(cancelButton, "secondary");
    cancelButton.style.backgroundColor = "#383838";
    cancelButton.onclick = () => {
      removeOverlay(existingOverlay);
    };

    // Add buttons to container
    buttonContainer.appendChild(pasteButton);
    buttonContainer.appendChild(browseButton);
    buttonContainer.appendChild(cancelButton);
    container.appendChild(buttonContainer);

    // Add help text
    const helpText = document.createElement("div");
    helpText.textContent = "Press ESC or click outside to cancel";
    helpText.style.cssText = `
    color: #888; margin-top: 16px; font-size: 12px;
`;
    container.appendChild(helpText);

    // Request clipboard data from background script
    window.top.postMessage(
      {
        type: "REQUEST_CLIPBOARD_HELPER",
        frameId: window.frameElement ? window.frameElement.id : "top",
      },
      "*"
    );

    // Setup drag and drop events
    setupDragAndDropEvents(container, dropZone, fileInput, existingOverlay);

    // Close overlay when clicking outside
    existingOverlay.onclick = (event) => {
      if (event.target === existingOverlay) {
        removeOverlay(existingOverlay);
      }
    };

    // Close overlay when pressing ESC key
    const escapeHandler = (event) => {
      if (event.key === "Escape") {
        removeOverlay(existingOverlay);
        document.removeEventListener("keydown", escapeHandler);
      }
    };

    document.addEventListener("keydown", escapeHandler);
  }

  /**
   * Shows an error message in the overlay
   * @param {HTMLElement} container - The container element
   * @param {string} message - The error message to display
   */
  function showErrorMessage(container, message) {
    const existingError = container.querySelector(".error-message");
    if (existingError) {
      existingError.textContent = message;
      return;
    }

    const errorMessage = document.createElement("div");
    errorMessage.className = "error-message";
    errorMessage.textContent = message;
    errorMessage.style.cssText = `
    color: #ff6b6b; margin-top: 16px; font-size: 14px;
    padding: 8px; border-radius: 4px; background-color: rgba(255, 107, 107, 0.1);
`;

    container.appendChild(errorMessage);

    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (errorMessage.parentNode) {
        errorMessage.style.opacity = "0";
        setTimeout(() => {
          if (errorMessage.parentNode) {
            errorMessage.parentNode.removeChild(errorMessage);
          }
        }, 300);
      }
    }, 5000);
  }

  /**
   * Updates the overlay with clipboard data
   */
  function updateOverlayWithClipboardData() {
    const overlay = document.getElementById(OVERLAY_ID);
    if (!overlay) return;

    const container = overlay.querySelector("div");
    const pasteButton = container.querySelector("button:nth-child(1)");
    const imagePreview = container.querySelector("img");
    const textPreview = container.querySelector(
      'div[style*="font-family: monospace"]'
    );
    const fileInfo = container.querySelector('div[style*="color: #a0a0a0"]');

    if (!clipboardData) {
      return;
    }

    // Show paste button for valid clipboard data
    if (
      clipboardData.mimeType.startsWith("image/") ||
      clipboardData.mimeType === "text/plain"
    ) {
      pasteButton.style.display = "inline-block";
    }

    // Update file info
    fileInfo.style.display = "block";
    const extension = getFileExtension(clipboardData.mimeType);
    const fileName = `pasted-file.${extension}`;

    // Estimate file size from data URL
    const dataSize = clipboardData.fileDataUrl.length * 0.75; // Rough estimate of base64 decoded size
    fileInfo.textContent = `File: ${fileName} (${formatFileSize(dataSize)})`;

    // Update preview based on file type
    if (clipboardData.mimeType.startsWith("image/")) {
      imagePreview.src = clipboardData.fileDataUrl;
      imagePreview.style.display = "block";
      textPreview.style.display = "none";
    } else if (clipboardData.mimeType === "text/plain") {
      try {
        // Decode the base64 data URL to get the text content
        const base64Content = clipboardData.fileDataUrl.split(",")[1];
        const decodedText = atob(base64Content);

        // Limit preview to first 500 characters
        const limitedText =
          decodedText.length > 500
            ? decodedText.substring(0, 500) + "..."
            : decodedText;

        textPreview.textContent = limitedText;
        textPreview.style.display = "block";
        imagePreview.style.display = "none";
      } catch (error) {
        console.error("Error displaying text preview:", error);
      }
    }
  }

  /**
   * Sets up drag and drop events for file uploading
   * @param {HTMLElement} container - The overlay container
   * @param {HTMLElement} dropZone - The drop zone element
   * @param {HTMLInputElement} fileInput - The file input element
   * @param {HTMLElement} overlay - The overlay element to remove on success
   */
  function setupDragAndDropEvents(container, dropZone, fileInput, overlay) {
    // Track drag enter/leave events
    const trackDragEnter = () => {
      dragEnterCounter++;
      if (dragEnterCounter === 1) {
        applyDragOverStyles(dropZone);
        dropZone.textContent = "Release to upload";
      }
    };

    const trackDragLeave = () => {
      dragEnterCounter--;
      if (dragEnterCounter === 0) {
        removeDragOverStyles(dropZone);
        dropZone.textContent = "Drag & drop files here or use buttons below";
      }
    };

    // Handle drop event
    const handleFileDrop = async (event) => {
      event.preventDefault();
      event.stopPropagation();
      dragEnterCounter = 0;
      removeDragOverStyles(dropZone);

      const files = event.dataTransfer.files;
      if (files.length === 0) return;

      // Check if multiple files are allowed
      if (files.length > 1 && !fileInput.multiple) {
        const fileInfo = container.querySelector(
          'div[style*="color: #a0a0a0"]'
        );
        fileInfo.textContent = `Only one file can be uploaded. Using: ${files[0].name}`;
        fileInfo.style.display = "block";
        fileInfo.style.color = "#ff9800";
      }

      // Transfer files to the input
      fileInput.files = files;
      fileInput.dispatchEvent(new Event("change", { bubbles: true }));
      fileInput.dispatchEvent(new Event("input", { bubbles: true }));

      // Close the overlay
      removeOverlay(overlay);
    };

    // Add event listeners
    dropZone.addEventListener("dragenter", (e) => {
      e.preventDefault();
      e.stopPropagation();
      trackDragEnter();
    });

    dropZone.addEventListener("dragleave", (e) => {
      e.preventDefault();
      e.stopPropagation();
      trackDragLeave();
    });

    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = "copy";
    });

    dropZone.addEventListener("drop", handleFileDrop);
  }

  /**
   * Pastes file data from clipboard into a file input
   * @param {HTMLInputElement} fileInput - The file input element
   * @param {Object} data - The clipboard data object
   */
  async function pasteFileIntoInput(fileInput, data) {
    try {
      const blob = await dataURLtoBlob(data.fileDataUrl);
      const extension = getFileExtension(data.mimeType);
      const fileName = `pasted-file-${generateRandomString(6)}.${extension}`;
      const file = new File([blob], fileName, { type: data.mimeType });

      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);

      fileInput.files = dataTransfer.files;
      fileInput.dispatchEvent(new Event("change", { bubbles: true }));
      fileInput.dispatchEvent(new Event("input", { bubbles: true }));
    } catch (error) {
      console.error("Error pasting file into input:", error);
      throw error;
    }
  }

  /**
   * Handles file input click events
   * @param {Event} event - The click event
   */
  function handleFileInputInteraction(event) {
    const fileInput = event.target.closest('input[type="file"]');
    if (fileInput && !isBrowseButtonClicked) {
      event.preventDefault();
      event.stopPropagation();
      showCustomFileUploadOverlay(fileInput);
    }
  }

  // Set up event listeners for file inputs
  function setupFileInputListeners(root = document) {
    root.addEventListener("click", handleFileInputInteraction, true);
  }

  // Initialize event listeners
  setupFileInputListeners();

  // Listen for clipboard data from content script
  window.addEventListener("message", function (event) {
    if (event.data && event.data.type === "CLIPBOARD_DATA") {
      clipboardData = event.data.clipboardData;
      updateOverlayWithClipboardData();
    }
  });

  // Override the browser's native file picker
  const originalShowPicker = HTMLInputElement.prototype.showPicker;
  if (originalShowPicker) {
    HTMLInputElement.prototype.showPicker = function () {
      if (this.type === "file") {
        showCustomFileUploadOverlay(this);
      } else {
        return originalShowPicker.apply(this, arguments);
      }
    };
  }

  // Intercept direct clicks on file inputs
  document.addEventListener(
    "click",
    function (event) {
      if (event.target.type === "file" && !isBrowseButtonClicked) {
        event.preventDefault();
        event.stopPropagation();
        showCustomFileUploadOverlay(event.target);
      }
    },
    true
  );
})();

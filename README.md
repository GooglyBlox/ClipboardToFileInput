# 📋 ClipboardToFileInput

![License](https://img.shields.io/badge/license-CC%20BY--NC--SA%204.0-lightgrey?style=flat-square)
![Open Source Love](https://img.shields.io/badge/Open%20Source-%E2%9D%A4-red?style=flat-square)
![Contributions Welcome](https://img.shields.io/badge/Contributions-Welcome-brightgreen?style=flat-square)
![Issues](https://img.shields.io/github/issues/GooglyBlox/ClipboardToFileInput?style=flat-square)
![Stars](https://img.shields.io/github/stars/GooglyBlox/ClipboardToFileInput?style=social)

## 🚀 Overview
ClipboardToFileInput is a Chrome extension that enables pasting clipboard content directly into file input fields on web pages. It's designed to address the inconvenience of not being able to do this natively in Google Chrome, a feature that OperaGX already offers.

Our goal is to release this on the Google Chrome Web Store soon! Once it's production-ready, the link will be available here. This extension will always remain open source, and updates on the Chrome Web Store version will be reflected in this repository.

## ⚠️ Notice
**This extension CANNOT read your file system.** This means that pasting items from your file system is not possible due to Chrome's restrictive extension permissions. You can only paste content copied from within your browser or other applications.

Additionally, copying and pasting GIFs will likely not work. This is a long-standing [Chromium issue](https://issues.chromium.org/issues/40357537), which is beyond our control.

## 🎥 Preview
![Demo](https://github.com/GooglyBlox/ClipboardToFileInput/blob/main/images/preview.gif?raw=true)

## 🛠 Installation
1. Clone this repository or [download the ZIP file](https://github.com/GooglyBlox/ClipboardToFileInput/releases).
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable Developer Mode.
4. Click 'Load unpacked' and select the extension directory.

## 💡 Usage
1. Copy any file to your clipboard.
2. Click on any file input field.
3. Click `Paste` to paste your clipboard content (accept clipboard permissions if prompted).
4. Click `Browse Files` to input files from your filesystem instead of clipboard.
5. Drag and Drop files from your file system to the overlay box for ease-of-upload from your file manager.

## 🐞 Submit Issues
Your feedback is invaluable! If you encounter any issues or have suggestions for improvements, please submit them through the GitHub Issues page.

### How to Submit an Issue
1. Navigate to the [Issues section](https://github.com/GooglyBlox/ClipboardToFileInput/issues) of this repository.
2. Before creating a new issue, please check if an issue has already been filed for your concern.
3. If your issue is new, click on `New Issue`.
4. Provide a descriptive title for your issue.
5. In the description box, clearly explain the issue or suggestion. Include steps to reproduce the issue, if applicable. Note which websites the extension isn't functioning on.
6. Attach screenshots or any relevant files that would help us understand the issue better.
7. Submit the issue.

Your contributions help make this extension better for everyone. Thank you!

## 🤝 Contributing
Contributions are welcome! Please fork the repository and submit a pull request with your changes.

## 📜 License
[![CC BY-NC-SA 4.0][cc-by-nc-sa-shield]][cc-by-nc-sa]

This work is licensed under a
[Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License][cc-by-nc-sa].

[![CC BY-NC-SA 4.0][cc-by-nc-sa-image]][cc-by-nc-sa]

[cc-by-nc-sa]: http://creativecommons.org/licenses/by-nc-sa/4.0/
[cc-by-nc-sa-image]: https://licensebuttons.net/l/by-nc-sa/4.0/88x31.png
[cc-by-nc-sa-shield]: https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg

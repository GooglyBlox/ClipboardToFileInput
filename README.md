# ClipboardToFileInput

## Overview
ClipboardToFileInput is a Chrome extension that enables pasting clipboard content directly into file input fields on web pages. It was made solely because it was extremely inconvenient not being able to do so on Google Chrome natively, since OperaGX is able to do so natively. The goal is to put this on the Google Chrome Web Store soon! Once I'm confident this is production-ready, I'll put it up and attach a link to this repository. The extension will always stay open source, and updates on the Chrome Web Store version will be reflected in this repository.

## ⚠️NOTICE
This extension CANNOT read your file system. That means that pasting items from your file system is not possible (due to Chrome's restrictive extension permissions). You can only paste what was copied from within your browser.

## Preview
![Demo](https://github.com/GooglyBlox/ClipboardToFileInput/blob/main/images/preview.gif?raw=true)

## Installation
1. Clone this repository or [download the ZIP file](https://github.com/GooglyBlox/ClipboardToFileInput/releases).
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable Developer Mode.
4. Click 'Load unpacked' and select the extension directory.

## Usage
- Copy any file to your clipboard.
- Click on any file input field.
- Click `Paste` to paste your clipboard content (accept clipboard permissions if prompted).
- Click `Browse Files` to input files from your filesystem instead of clipboard.

## Submit Issues

Feedback is greatly appreciated! If you encounter any issues or have suggestions for improvements, please submit them through the GitHub Issues page.

### How to Submit an Issue
1. Navigate to the [Issues section](https://github.com/GooglyBlox/ClipboardToFileInput/issues) of this repository.
2. Before creating a new issue, please check to see if an issue has already been filed for your concern.
3. If your issue is new, click on `New Issue`.
4. Provide a descriptive title for your issue.
5. In the description box, clearly explain the issue or suggestion. Include steps to reproduce the issue, if applicable. Be sure to note which websites the extension isn't functioning on.
6. Feel free to attach screenshots or any relevant files that would help us understand the issue better.
7. Submit the issue.

Your feedback really helps me make this better for everyone. Thank you for your contributions!

## Contributing
Contributions are welcome. Please fork the repository and submit a pull request with your changes.

## License
Shield: [![CC BY-NC-SA 4.0][cc-by-nc-sa-shield]][cc-by-nc-sa]

This work is licensed under a
[Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License][cc-by-nc-sa].

[![CC BY-NC-SA 4.0][cc-by-nc-sa-image]][cc-by-nc-sa]

[cc-by-nc-sa]: http://creativecommons.org/licenses/by-nc-sa/4.0/
[cc-by-nc-sa-image]: https://licensebuttons.net/l/by-nc-sa/4.0/88x31.png
[cc-by-nc-sa-shield]: https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg

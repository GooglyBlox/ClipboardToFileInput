/**
 * Clipboard access helper script
 * Displays information to users when clipboard permissions are needed
 */
document.addEventListener("DOMContentLoaded", function () {
  setTimeout(function () {
    const infoText = document.querySelector(".info-text");
    if (infoText) {
      infoText.style.display = "block";
      infoText.style.opacity = "0";

      setTimeout(() => {
        infoText.style.transition = "opacity 0.5s ease";
        infoText.style.opacity = "1";
      }, 50);
    }
  }, 500);

  setTimeout(function () {
    chrome.runtime.sendMessage({ closeTab: true });
  }, 30000);
});

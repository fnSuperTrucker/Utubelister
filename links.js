function createLinkElement(url) {
  const li = document.createElement('li');
  const a = document.createElement('a');
  a.href = url;
  a.textContent = url;
  a.onclick = function(event) {
    event.preventDefault();
    chrome.tabs.query({ url: "https://www.youtube.com/*" }, function(tabs) {
      try {
        if (tabs.length > 0) {
          // Update existing YouTube tab
          chrome.tabs.update(tabs[0].id, { url: url }, function() {
            if (chrome.runtime.lastError) {
              console.error("Error updating tab:", chrome.runtime.lastError);
              // Fallback to opening in new tab if update fails
              chrome.tabs.create({ url: url });
            }
          });
        } else {
          // Open in new tab if no YouTube tab exists
          chrome.tabs.create({ url: url }, function() {
            if (chrome.runtime.lastError) {
              console.error("Error creating tab:", chrome.runtime.lastError);
            }
          });
        }
      } catch (error) {
        console.error("An error occurred while handling link click:", error);
        // If all else fails, try to open in a new window
        window.open(url, '_blank');
      }
    });
  };
  li.appendChild(a);
  return li;
}

function updateList() {
  chrome.storage.local.get('links', data => {
    const list = document.getElementById('linkList');
    list.innerHTML = '';
    if (data.links && Array.isArray(data.links)) {
      data.links.reverse().forEach(url => {
        list.appendChild(createLinkElement(url));
      });
    } else {
      const noLinks = document.createElement('li');
      noLinks.textContent = "No links found yet.";
      list.appendChild(noLinks);
    }
  });
}

// Refresh every 1.5 seconds
setInterval(updateList, 1500);
updateList();

// Handle window opening
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "updateLinks") updateList();
});

document.getElementById('clearButton').addEventListener('click', () => {
  if (confirm('Are you sure you want to clear all links?')) {
    chrome.storage.local.set({ links: [] }, () => {
      updateList();
      chrome.runtime.sendMessage({ action: "clearLinks" });
    });
  }
});
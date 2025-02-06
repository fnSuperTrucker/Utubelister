function createLinkElement(url) {
  const li = document.createElement('li');
  const a = document.createElement('a');
  a.href = url;
  a.textContent = url;
  a.onclick = function(event) {
    event.preventDefault();
    chrome.tabs.query({ url: "https://www.youtube.com/*" }, function(tabs) {
      if (tabs.length > 0) {
        // Update existing YouTube tab
        chrome.tabs.update(tabs[0].id, { url: url });
      } else {
        // Open in new tab if no YouTube tab exists
        chrome.tabs.create({ url: url });
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
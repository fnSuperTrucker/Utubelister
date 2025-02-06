const platforms = {
  rumble: {
    container: [
      '[data-testid="chat-panel"]',
      '.chat-container',
      '#chat-scroll',
      '.livestream-chat',
      '#chat-history-list' // Updated selector for Rumble chat
    ],
    messages: '.chat-history--row, .js-chat-history-item' // Updated selector for messages
  },
  odysee: {
    container: [
      '.livestream-chat',
      '.chat-window',
      '#chat-content'
    ],
    messages: '.comment, .message-item, .chat-line'
  },
  pilled: {
    container: [
      '#stream-chat',
      '.chat-box',
      '#chat-box'
    ],
    messages: '.message, .chat-line, .message-content'
  }
};

const youtubeRegex = /https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/gi;
let currentPlatform = null;

function detectPlatform() {
  const host = window.location.hostname;
  if (host.includes('rumble')) return platforms.rumble;
  if (host.includes('odysee')) return platforms.odysee;
  if (host.includes('pilled')) return platforms.pilled;
  return null;
}

function scanChat() {
  console.log('Scanning chat for links...');
  if (!currentPlatform) currentPlatform = detectPlatform();
  if (!currentPlatform) {
    console.log('No platform detected');
    return;
  }

  const container = currentPlatform.container
    .map(sel => document.querySelector(sel))
    .find(el => el);

  if (!container) {
    console.warn('Chat container not found with selector:', currentPlatform.container);
    return;
  }

  console.log('Chat container found:', container);
  const messages = container.querySelectorAll(currentPlatform.messages);
  
  if (messages.length === 0) {
    console.log('No messages found in the chat');
  } else {
    console.log(`Found ${messages.length} messages`);
  }
  
  messages.forEach(msg => {
    if (msg.dataset.processed) return;
    console.log('Processing message:', msg.textContent);
    const links = [...msg.textContent.matchAll(youtubeRegex)]
      .map(m => m[0]);
    
    if (links.length) {
      console.log('Found links:', links);
      chrome.storage.local.get({links: []}, data => {
        if (Array.isArray(data.links)) {
          const newLinks = [...new Set([...data.links, ...links])];
          chrome.storage.local.set({links: newLinks.slice(-100)}, function() {
            if (chrome.runtime.lastError) {
              console.error("Error setting storage: ", chrome.runtime.lastError);
            } else {
              console.log("Links updated in storage");
              chrome.runtime.sendMessage({action: "updateLinks"});
            }
          });
        } else {
          console.error("Stored links are not an array");
        }
      });
    }
    msg.dataset.processed = true;
  });
}

// Initialize
setInterval(scanChat, 1500);


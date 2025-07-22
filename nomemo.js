// Quote functionality
let autoRefreshTimer;
let secretPosition = 5; // Position 5 (middle) is the secret trigger

const fallbackQuotes = [
  {
    text: 'The only way to do great work is to love what you do.',
    author: 'Steve Jobs',
  },
  {
    text: 'Innovation distinguishes between a leader and a follower.',
    author: 'Steve Jobs',
  },
  {
    text: "Life is what happens to you while you're busy making other plans.",
    author: 'John Lennon',
  },
  {
    text: 'The future belongs to those who believe in the beauty of their dreams.',
    author: 'Eleanor Roosevelt',
  },
  {
    text: 'It is during our darkest moments that we must focus to see the light.',
    author: 'Aristotle',
  },
  {
    text: 'The way to get started is to quit talking and begin doing.',
    author: 'Walt Disney',
  },
  {
    text: "Don't let yesterday take up too much of today.",
    author: 'Will Rogers',
  },
  { text: 'You learn more from failure than from success.', author: 'Unknown' },
  {
    text: "If you are working on something exciting that you really care about, you don't have to be pushed.",
    author: 'Steve Jobs',
  },
];

async function loadNewQuotes() {
  const grid = document.getElementById('quotes-grid');
  grid.innerHTML = '';

  for (let i = 0; i < 9; i++) {
    const card = document.createElement('div');
    card.className = 'quote-card';
    card.innerHTML = `
                    <div class="quote-text">Loading...</div>
                    <div class="quote-author"></div>
                `;

    if (i === secretPosition - 1) {
      card.classList.add('secret');
      card.onclick = switchToChat;
    }

    grid.appendChild(card);

    // Load quote for this card
    try {
      const response = await fetch(
        'https://quotegarden.herokuapp.com/api/v3/quotes/random'
      );
      const data = await response.json();
      card.querySelector(
        '.quote-text'
      ).textContent = `"${data.data.quoteText}"`;
      card.querySelector(
        '.quote-author'
      ).textContent = `— ${data.data.quoteAuthor}`;
    } catch (error) {
      const fallback = fallbackQuotes[i];
      card.querySelector('.quote-text').textContent = `"${fallback.text}"`;
      card.querySelector('.quote-author').textContent = `— ${fallback.author}`;
    }

    // Small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

function toggleAutoRefresh() {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer);
    autoRefreshTimer = null;
  } else {
    autoRefreshTimer = setInterval(loadNewQuotes, 60000);
  }
}

function switchToChat() {
  document.getElementById('quote-mode').classList.add('hidden');
  document.getElementById('chat-mode').classList.remove('hidden');
  document.body.classList.add('chat-mode');
}

function switchToQuotes() {
  document.getElementById('chat-mode').classList.add('hidden');
  document.getElementById('quote-mode').classList.remove('hidden');
  document.body.classList.remove('chat-mode');
  // Randomize secret position for next time
  secretPosition = Math.floor(Math.random() * 9) + 1;
}

// Your existing chat code
let ROOM = '',
  FROM = '';
let POLLING = false;
let POLL_TIMER = null;
let AUTO_POLL_END = 0;

function url(room, from) {
  return `http://localhost:8000/nomemo.php?room=${encodeURIComponent(
    room
  )}&from=${encodeURIComponent(from)}`;
}

function join() {
  ROOM = document.getElementById('room').value.trim();
  FROM = document.getElementById('from').value.trim();
  if (!ROOM || !FROM) {
    alert('Please enter both room and name');
    return;
  }
  document.getElementById('info').style.display = 'none';
  document.getElementById('chat').classList.remove('hidden');
  document.getElementById('input').classList.remove('hidden');
  document.getElementById('poll-controls').classList.remove('hidden');
  loadHistory();
  pollOnce();
}

function send() {
  const input = document.getElementById('msg');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';

  const ts = Date.now();
  const msg = { from: FROM, msg: text, ts };

  resetAutoPollTimeout();
  appendMsg(msg);

  const key = `nomemo-chat-${ROOM}-${FROM}`;
  let stored = JSON.parse(localStorage.getItem(key) || '[]');
  stored.push(msg);
  localStorage.setItem(key, JSON.stringify(stored));

  fetch(url(ROOM, FROM), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: text,
  });
}

function clearChat() {
  if (!ROOM || !FROM) return;
  const key = `nomemo-chat-${ROOM}-${FROM}`;
  localStorage.removeItem(key);
  const msg = { from: FROM, msg: '[cleared]', ts: Date.now() };
  appendMsg(msg);
  fetch(url(ROOM, FROM), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: msg.msg,
  });
}

function loadHistory() {
  const key = `nomemo-chat-${ROOM}-${FROM}`;
  const stored = JSON.parse(localStorage.getItem(key) || '[]');
  for (const m of stored) appendMsg(m);
}

async function pollOnce() {
  const key = `nomemo-chat-${ROOM}-${FROM}`;
  let stored = JSON.parse(localStorage.getItem(key) || '[]');

  try {
    const res = await fetch(url(ROOM, FROM));
    const msgs = await res.json();

    for (const m of msgs) {
      if (
        stored.some(
          (existing) => existing.ts === m.ts && existing.from === m.from
        )
      )
        continue;
      stored.push(m);
      appendMsg(m);
      resetAutoPollTimeout();
    }

    localStorage.setItem(key, JSON.stringify(stored));
  } catch (e) {
    console.warn('Polling error:', e);
  }
}

function startAutoPoll() {
  resetAutoPollTimeout();
  if (!POLLING) {
    POLLING = true;
    runPollLoop();
  }
}

function resetAutoPollTimeout() {
  AUTO_POLL_END = Date.now() + 42000;
  updatePollStatus();
}

async function runPollLoop() {
  while (POLLING) {
    if (Date.now() > AUTO_POLL_END) {
      POLLING = false;
      updatePollStatus();
      break;
    }
    await pollOnce();
    await new Promise((r) => setTimeout(r, 1000));
  }
}

function updatePollStatus() {
  const s = document.getElementById('poll-status');
  if (!POLLING) {
    s.textContent = 'Auto Poll OFF';
  } else {
    const secs = Math.floor((AUTO_POLL_END - Date.now()) / 1000);
    s.textContent = `Auto Poll ON (${secs}s left)`;
  }
}
setInterval(updatePollStatus, 1000);

function appendMsg(m) {
  const chat = document.getElementById('chat');
  const div = document.createElement('div');
  const ts = new Date(m.ts).toLocaleTimeString();
  div.innerHTML = `<b>${m.from}</b> <small>${ts}</small>: ${m.msg}`;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

// Initialize with quotes
loadNewQuotes();

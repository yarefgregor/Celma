// Utility functions
function getUsers() {
  return JSON.parse(localStorage.getItem('datingplace_users') || '[]');
}
function setUsers(users) {
  localStorage.setItem('datingplace_users', JSON.stringify(users));
}
function getCurrentUser() {
  return JSON.parse(localStorage.getItem('datingplace_current_user') || 'null');
}
function setCurrentUser(user) {
  localStorage.setItem('datingplace_current_user', JSON.stringify(user));
}
function getMessages() {
  return JSON.parse(localStorage.getItem('datingplace_messages') || '{}');
}
function setMessages(msgs) {
  localStorage.setItem('datingplace_messages', JSON.stringify(msgs));
}
function emoji(gender) {
  return gender === 'female' ? '👩' : '👨';
}
function logout() {
  localStorage.removeItem('datingplace_current_user');
  window.location.href = 'index.html';
}

// INDEX.HTML LOGIC
if (document.getElementById('loginForm')) {
  document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const phone = document.getElementById('loginPhone').value.trim();
    const password = document.getElementById('loginPassword').value;
    const users = getUsers();
    const user = users.find(u => u.phone === phone && u.password === password);
    if (!user) {
      document.getElementById('loginError').textContent = "Incorrect phone number or password.";
    } else {
      setCurrentUser(user);
      window.location.href = 'home.html';
    }
  });
}

// SIGNUP.HTML LOGIC
if (document.getElementById('signupForm')) {
  let profilePicData = "";
  const profilePicInput = document.getElementById('profilePic');
  if (profilePicInput) {
    profilePicInput.addEventListener('change', function(e){
      const file = e.target.files[0];
      if (!file) { profilePicData = ""; return; }
      const reader = new FileReader();
      reader.onload = function(evt) {
        profilePicData = evt.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  document.getElementById('signupForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const phone = document.getElementById('signupPhone').value.trim();
    const password = document.getElementById('signupPassword').value;
    const firstName = document.getElementById('firstName').value.trim();
    const surname = document.getElementById('surname').value.trim();
    const nickname = document.getElementById('nickname').value.trim();
    const gender = document.getElementById('gender').value;
    const age = document.getElementById('age').value;
    let users = getUsers();
    if (users.find(u => u.phone === phone)) {
      document.getElementById('signupError').textContent = "Phone number already registered.";
      return;
    }
    const newUser = { phone, password, firstName, surname, nickname, gender, age, profilePic: profilePicData };
    users.push(newUser);
    setUsers(users);
    setCurrentUser(newUser);
    window.location.href = 'home.html';
  });
}

// HOME.HTML LOGIC (Friends Page)
if (document.getElementById('searchBtn')) {
  const user = getCurrentUser();
  if (!user) logout();
  // Hamburger menu logic
  const menuBtn = document.getElementById('menuBtn');
  const sideMenu = document.getElementById('sideMenu');
  menuBtn.onclick = () => sideMenu.classList.toggle('open');
  document.getElementById('homeBtn').onclick = () => { sideMenu.classList.remove('open'); };
  document.getElementById('settingsBtn').onclick = () => { window.location.href = 'settings.html'; };
  document.getElementById('logoutBtn').onclick = () => logout();

  // Search logic
  document.getElementById('searchBtn').onclick = function() {
    const gender = document.getElementById('searchGender').value;
    const age = document.getElementById('searchAge').value;
    const users = getUsers().filter(u => u.gender === gender && u.age === age && u.phone !== user.phone);
    const results = document.getElementById('results');
    results.innerHTML = '';
    if (users.length === 0) {
      results.innerHTML = '<p>No matches found.</p>';
      return;
    }
    users.forEach(u => {
      const card = document.createElement('div');
      card.className = 'result-card';
      card.innerHTML = `
        <div class="result-info">
          ${u.profilePic ? `<img class="result-pic" src="${u.profilePic}" alt="Profile Pic">` : `<span class="result-emoji">${emoji(u.gender)}</span>`}
          <div class="result-meta">
            <span>${u.nickname}</span>
            <span>${u.gender.charAt(0).toUpperCase() + u.gender.slice(1)}, ${u.age}</span>
          </div>
        </div>
        <button class="msgBtn" data-phone="${u.phone}">Message</button>
      `;
      results.appendChild(card);
    });
    // Message button logic
    document.querySelectorAll('.msgBtn').forEach(btn => {
      btn.onclick = function() {
        openMsgPopup(btn.dataset.phone);
      };
    });
  };

  // Friends List loader
  function loadFriends() {
    const user = getCurrentUser();
    if (!user) return;
    const messages = getMessages();
    const users = getUsers();
    const friendsListDiv = document.getElementById('friendsList');
    friendsListDiv.innerHTML = '';
    let chatPartners = new Set();
    for (let chatId in messages) {
      const [phone1, phone2] = chatId.split('_');
      if (phone1 === user.phone) chatPartners.add(phone2);
      else if (phone2 === user.phone) chatPartners.add(phone1);
    }
    if (chatPartners.size === 0) {
      friendsListDiv.innerHTML = '<p>No friends found. Search for new friends!</p>';
      return;
    }
    chatPartners.forEach(phone => {
      const friend = users.find(u => u.phone === phone);
      if (!friend) return;
      const card = document.createElement('div');
      card.className = 'result-card';
      card.innerHTML = `
        <div class="result-info">
          ${friend.profilePic ? `<img class="result-pic" src="${friend.profilePic}" alt="Profile Pic">` : `<span class="result-emoji">${emoji(friend.gender)}</span>`}
          <div class="result-meta">
            <span>${friend.nickname}</span>
            <span>${friend.gender.charAt(0).toUpperCase() + friend.gender.slice(1)}, ${friend.age}</span>
          </div>
        </div>
        <button class="msgBtn" data-phone="${friend.phone}">Message</button>
      `;
      friendsListDiv.appendChild(card);
    });
    // Add message button logic
    friendsListDiv.querySelectorAll('.msgBtn').forEach(btn => {
      btn.onclick = function() {
        openMsgPopup(btn.dataset.phone);
      };
    });
  }

  // Messaging popup logic (used in both pages)
  window.openMsgPopup = function(phone) {
    const msgPopup = document.getElementById('messagePopup');
    const msgUser = getUsers().find(u => u.phone === phone);
    msgPopup.classList.remove('hidden');
    document.getElementById('msgUser').textContent = msgUser ? msgUser.nickname : phone;
    const msgHistoryDiv = document.getElementById('msgHistory');
    const messages = getMessages();
    const user = getCurrentUser();
    const chatId = [user.phone, phone].sort().join('_');
    let chat = messages[chatId] || [];
    msgHistoryDiv.innerHTML = '';
    chat.forEach(m => {
      const div = document.createElement('div');
      div.className = 'msg-bubble' + (m.from === user.phone ? ' me' : '');
      div.textContent = m.text;
      msgHistoryDiv.appendChild(div);
    });
    // Send message
    document.getElementById('msgForm').onsubmit = function(e) {
      e.preventDefault();
      const text = document.getElementById('msgInput').value.trim();
      if (!text) return;
      chat.push({ from: user.phone, to: phone, text, time: new Date().toISOString() });
      messages[chatId] = chat;
      setMessages(messages);
      document.getElementById('msgInput').value = '';
      openMsgPopup(phone);
      if (typeof loadChats === "function") loadChats();
      if (typeof loadFriends === "function") loadFriends();
    };
    document.getElementById('closeMsgBtn').onclick = function() {
      msgPopup.classList.add('hidden');
    };
    // Delete chat
    document.getElementById('deleteChatBtn').onclick = function() {
      if (confirm("Delete this chat?")) {
        delete messages[chatId];
        setMessages(messages);
        msgPopup.classList.add('hidden');
        if (typeof loadChats === "function") loadChats();
        if (typeof loadFriends === "function") loadFriends();
      }
    };
  }

  // Initial load
  loadFriends();

  // Hide find friends panel on startup
  document.getElementById('findFriendsPanel').classList.add('hidden');
  document.getElementById('findFriendsBtn').onclick = () => {
    document.getElementById('findFriendsPanel').classList.toggle('hidden');
  };
}

// MESSAGES.HTML LOGIC (Messages Page)
if (document.getElementById('allChats')) {
  const user = getCurrentUser();
  if (!user) logout();
  // Hamburger menu logic
  const menuBtn = document.getElementById('menuBtn');
  const sideMenu = document.getElementById('sideMenu');
  menuBtn.onclick = () => sideMenu.classList.toggle('open');
  document.getElementById('homeBtn').onclick = () => { window.location.href = 'home.html'; };
  document.getElementById('settingsBtn').onclick = () => { window.location.href = 'settings.html'; };
  document.getElementById('logoutBtn').onclick = () => logout();

  // Load all chats for user
  window.loadChats = function() {
    const user = getCurrentUser();
    if (!user) return;
    const messages = getMessages();
    const users = getUsers();
    const allChatsDiv = document.getElementById('allChats');
    allChatsDiv.innerHTML = '';
    let chatList = [];
    for (let chatId in messages) {
      if (chatId.includes(user.phone)) {
        const phones = chatId.split('_');
        const otherPhone = phones[0] === user.phone ? phones[1] : phones[0];
        const lastMsg = messages[chatId][messages[chatId].length - 1];
        chatList.push({ chatId, otherPhone, lastMsg });
      }
    }
    if (chatList.length === 0) {
      allChatsDiv.innerHTML = '<p>No messages yet.</p>';
      return;
    }
    chatList.sort((a, b) => new Date(b.lastMsg.time || 0) - new Date(a.lastMsg.time || 0));
    chatList.forEach(chat => {
      const chatUser = users.find(u => u.phone === chat.otherPhone);
      const div = document.createElement('div');
      div.className = 'chat-card';
      div.innerHTML = `
        <div class="chat-info">
          ${chatUser && chatUser.profilePic ? `<img class="result-pic" src="${chatUser.profilePic}" alt="Profile Pic">` : `<span class="result-emoji">${chatUser ? emoji(chatUser.gender) : ''}</span>`}
          <div class="chat-meta">
            <span>${chatUser ? chatUser.nickname : chat.otherPhone}</span>
            <span>Last: ${chat.lastMsg.text}</span>
          </div>
        </div>
        <button class="msgBtn" data-phone="${chat.otherPhone}">Open Chat</button>
        <button class="delChatBtn" data-chatid="${chat.chatId}">Delete Chat</button>
      `;
      allChatsDiv.appendChild(div);
    });
    // Message button logic
    allChatsDiv.querySelectorAll('.msgBtn').forEach(btn => {
      btn.onclick = function() {
        openMsgPopup(btn.dataset.phone);
      };
    });
    // Delete chat button logic
    allChatsDiv.querySelectorAll('.delChatBtn').forEach(btn => {
      btn.onclick = function() {
        if (confirm("Delete this chat?")) {
          const messages = getMessages();
          delete messages[btn.dataset.chatid];
          setMessages(messages);
          loadChats();
        }
      };
    });
  }

  // Initial load
  loadChats();
}

// SETTINGS.HTML LOGIC
if (document.getElementById('settingsForm')) {
  const user = getCurrentUser();
  if (!user) logout();
  // Hamburger menu logic
  const menuBtn = document.getElementById('menuBtn');
  const sideMenu = document.getElementById('sideMenu');
  menuBtn.onclick = () => sideMenu.classList.toggle('open');
  document.getElementById('homeBtn').onclick = () => { window.location.href = 'home.html'; };
  document.getElementById('settingsBtn').onclick = () => { sideMenu.classList.remove('open'); };
  document.getElementById('logoutBtn').onclick = () => logout();

  // Fill form and preview
  document.getElementById('settingsFirstName').value = user.firstName;
  document.getElementById('settingsSurname').value = user.surname;
  document.getElementById('settingsNickname').value = user.nickname;
  document.getElementById('settingsGender').value = user.gender;
  document.getElementById('settingsAge').value = user.age;
  document.getElementById('settingsPhone').value = user.phone;
  document.getElementById('settingsPassword').value = user.password;
  let profilePicData = user.profilePic || "";
  const preview = document.getElementById('settingsProfilePicPreview');
  if (preview && profilePicData) {
    preview.src = profilePicData;
    preview.style.display = 'block';
  }
  const picInput = document.getElementById('settingsProfilePic');
  if (picInput) {
    picInput.addEventListener('change', function(e){
      const file = e.target.files[0];
      if (!file) { profilePicData = ""; preview.style.display='none'; return; }
      const reader = new FileReader();
      reader.onload = function(evt) {
        profilePicData = evt.target.result;
        preview.src = profilePicData;
        preview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    });
  }

  // Save changes
  document.getElementById('settingsForm').addEventListener('submit', function(e) {
    e.preventDefault();
    let users = getUsers();
    let idx = users.findIndex(u => u.phone === user.phone);
    users[idx] = {
      phone: user.phone,
      password: document.getElementById('settingsPassword').value,
      firstName: document.getElementById('settingsFirstName').value.trim(),
      surname: document.getElementById('settingsSurname').value.trim(),
      nickname: document.getElementById('settingsNickname').value.trim(),
      gender: document.getElementById('settingsGender').value,
      age: document.getElementById('settingsAge').value,
      profilePic: profilePicData
    };
    setUsers(users);
    setCurrentUser(users[idx]);
    document.getElementById('settingsMsg').textContent = "Settings updated!";
  });
}
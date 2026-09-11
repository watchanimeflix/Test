// announcement-banner.js - Universal announcement & event banner for all pages
(async () => {
  try {
    // Create main banner container
    const bannerContainer = document.createElement('div');
    bannerContainer.id = 'bannerContainer';
    bannerContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 0;
    `;
    document.body.insertBefore(bannerContainer, document.body.firstChild);

    // Create announcement banner
    const announcementBanner = document.createElement('div');
    announcementBanner.id = 'announcementBanner';
    announcementBanner.style.cssText = `
      display: none;
      padding: 15px 20px;
      text-align: center;
      color: #fff;
      font-weight: bold;
      animation: slideDown 0.5s ease-out;
    `;
    bannerContainer.appendChild(announcementBanner);

    // Create event banner
    const eventBanner = document.createElement('div');
    eventBanner.id = 'eventBanner';
    eventBanner.style.cssText = `
      display: none;
      padding: 12px 20px;
      text-align: center;
      color: #fff;
      font-weight: bold;
      animation: slideDown 0.5s ease-out;
      background: linear-gradient(135deg, #FFD700, #FFA500);
      box-shadow: 0 4px 15px rgba(255, 165, 0, 0.5);
    `;
    bannerContainer.appendChild(eventBanner);

    // Add CSS
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideDown {
        from { transform: translateY(-100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      
      #announcementBanner.info { background: #3498db; }
      #announcementBanner.warning { background: #f39c12; color: #000; }
      #announcementBanner.error { background: #e74c3c; }
      #announcementBanner.success { background: #27ae60; }
      
      .close-banner-btn {
        margin-left: 15px;
        background: rgba(255,255,255,0.3);
        border: none;
        color: #fff;
        padding: 5px 10px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.3s ease;
      }
      
      .close-banner-btn:hover { 
        background: rgba(255,255,255,0.5);
        transform: scale(1.05);
      }
      
      .event-timer {
        display: inline-block;
        margin-left: 15px;
        background: rgba(0,0,0,0.2);
        padding: 5px 12px;
        border-radius: 20px;
        font-size: 14px;
      }
      
      .multiplier-badge {
        display: inline-block;
        background: rgba(255,255,255,0.3);
        padding: 5px 12px;
        border-radius: 20px;
        margin: 0 8px;
        font-size: 14px;
        font-weight: bold;
      }
    `;
    document.head.appendChild(style);

    // Firebase imports
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js");
    const { getFirestore, collection, query, orderBy, onSnapshot } = await import("https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js");

    const firebaseConfig = {
      apiKey: "AIzaSyB6qQybRVw4nlwGA-Kp8d6kCqOhdqo11Aw",
      authDomain: "animegold-bf2a7.firebaseapp.com",
      projectId: "animegold-bf2a7",
      storageBucket: "animegold-bf2a7.firebasestorage.app",
      messagingSenderId: "1055086176557",
      appId: "1:1055086176557:web:aca8f68412e95ef369cba4",
      measurementId: "G-J9LX9WMPJK"
    };

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // Load announcements
    const announcementQuery = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
    
    onSnapshot(announcementQuery, (snap) => {
      const bannerEl = document.getElementById('announcementBanner');
      
      if (snap.empty) {
        bannerEl.style.display = 'none';
        return;
      }

      const announcement = snap.docs[0].data();
      
      if (announcement.active === false) {
        bannerEl.style.display = 'none';
        return;
      }

      const type = announcement.type || 'info';
      
      bannerEl.className = type;
      bannerEl.innerHTML = `
        <strong>${announcement.title || '📢 Announcement'}:</strong> 
        ${announcement.message}
        <button class="close-banner-btn" onclick="document.getElementById('announcementBanner').style.display='none'">✕</button>
      `;
      bannerEl.style.display = 'block';
    });

    // Load events (earnings multiplier)
    const eventQuery = query(collection(db, 'events'), orderBy('createdAt', 'desc'));
    
    let eventUpdateInterval = null;
    
    onSnapshot(eventQuery, (snap) => {
      const eventBannerEl = document.getElementById('eventBanner');
      
      if (snap.empty) {
        eventBannerEl.style.display = 'none';
        if (eventUpdateInterval) clearInterval(eventUpdateInterval);
        return;
      }

      // Find first active event
      let activeEvent = null;
      const now = new Date();
      
      for (const doc of snap.docs) {
        const data = doc.data();
        const endTime = data.endTime ? new Date(data.endTime.toDate()) : null;
        if (endTime && endTime > now) {
          activeEvent = { id: doc.id, ...data, endTime };
          break;
        }
      }

      if (!activeEvent) {
        eventBannerEl.style.display = 'none';
        if (eventUpdateInterval) clearInterval(eventUpdateInterval);
        return;
      }

      // Update timer every second
      const updateEventTimer = () => {
        const now = new Date();
        const timeRemaining = Math.max(0, activeEvent.endTime - now);
        const hours = Math.floor(timeRemaining / 3600000);
        const minutes = Math.floor((timeRemaining % 3600000) / 60000);
        const seconds = Math.floor((timeRemaining % 60000) / 1000);

        eventBannerEl.innerHTML = `
          <span class="multiplier-badge">⭐ ${activeEvent.multiplier}x EARNINGS EVENT</span>
          <strong>${activeEvent.description}</strong>
          <span class="event-timer">⏱️ ${hours}h ${minutes}m ${seconds}s remaining</span>
          <button class="close-banner-btn" onclick="document.getElementById('eventBanner').style.display='none'">✕</button>
        `;
        eventBannerEl.style.display = 'block';
      };

      updateEventTimer();
      
      if (eventUpdateInterval) clearInterval(eventUpdateInterval);
      eventUpdateInterval = setInterval(updateEventTimer, 1000);
    });

  } catch (e) {
    console.warn('Banner system failed to load:', e);
    console.error(e);
  }
})();

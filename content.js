(function() {
    let lastUrl = location.href;
    let isDragging = false;
    let startY, startTop;
    let urlWatcherActive = false;

    // Default Configuration
    let appSettings = {
        footerEnabled: true,
        showNodeType: true,
        showUser: true,
        showModified: true,
        showStatus: true
    };

    const API_KEY = "AIzaSyDNx6qTZCP6Omhsau3orrs82v2mnv-APIU"; 
    const SHEET_ID = "11cnJO8rZgleZN43eXl7D8cYFpCy2U5UKNLNtI4zTKLk";
    const RANGE = "'AEM Navigator Pro Tools Inventory'!A2:D"; 

    // Initial load from storage before initializing UI
    chrome.storage.local.get(['aemNavSettings'], (result) => {
        if (result && result.aemNavSettings) {
            appSettings = result.aemNavSettings;
        }
        init();
    });

    async function init() {
        if (document.getElementById('aem-hud-launcher')) return;

        // 1. Create Launcher
        const launcher = document.createElement('div');
        launcher.id = 'aem-hud-launcher';
        launcher.innerHTML = `<img src="${chrome.runtime.getURL('images/logo-icon.png')}" class="launcher-logo-img">`;
        const savedTop = localStorage.getItem('aem-nav-top') || 60;
        launcher.style.top = savedTop + 'px';

        // 2. Create Menu Panel
        const menu = document.createElement('div');
        menu.id = 'aem-hud-menu';
        menu.style.top = savedTop + 'px';
        menu.innerHTML = `
            <div class="menu-header">
                <div class="header-top-row">
                    <span class="pro-title">AEM NAVIGATOR PRO</span>
                    <button id="open-settings-btn" title="Preferences">⚙️</button>
                </div>
                <input type="text" id="aem-hud-search" placeholder="Search tools..." autocomplete="off">
            </div>
            <div id="hud-content-scroll"></div>
        `;


        // 3. Create Smart Footer
        const footer = document.createElement('div');
        footer.id = 'aem-smart-footer';
        footer.innerHTML = `
            <div class="footer-left-content">
                <span class="brand-name">Navigator</span>
                <span class="footer-sep-main"></span>
                <span id="f-page-name" class="page-display-val"></span>
            </div>
            <div class="footer-right-actions"></div>
        `;

        // 4. Create About Modal
        const aboutModal = document.createElement('div');
        aboutModal.id = 'aem-about-modal';
        aboutModal.innerHTML = `
            <div class="about-modal-content">
                <div class="about-header">About AEM Navigator Pro</div>
                <div class="about-body">
                    <div class="about-hero">
                        <img src="${chrome.runtime.getURL('images/logo-icon.png')}" class="about-logo">
                        <div class="about-title-group">
                            <h2>AEM Navigator Pro</h2>
                            <div class="about-hero-meta">
                                <span class="version-tag">v${chrome.runtime.getManifest().version}</span>
                                <span class="about-tagline">Stop hunting for URLs. Start Navigating.</span>
                            </div>
                        </div>
                    </div>
                    <p id="about-description" class="about-desc">A productivity suite built for AEM Developers, Technical Consultants, and Solution Architects. Bridges the gap between deep JCR structures and high-level content management — without ever leaving your current page.</p>
                    <div class="about-features">
                        <div class="about-feature">
                            <div class="feature-label">Smart Footer</div>
                            <div class="feature-desc">Live JCR node metadata on every AEM page — type, author, publish status</div>
                        </div>
                        <div class="about-feature">
                            <div class="feature-label">Quick Navigation</div>
                            <div class="feature-desc">One-click access to CRX/DE, Package Manager, OSGi Console and more</div>
                        </div>
                        <div class="about-feature">
                            <div class="feature-label">URL-Aware</div>
                            <div class="feature-desc">Detects SPA navigation and updates context without a page reload</div>
                        </div>
                        <div class="about-feature">
                            <div class="feature-label">Team Tools</div>
                            <div class="feature-desc">Curated shortcut library powered by your team's Google Sheet</div>
                        </div>
                    </div>
                    <div class="about-meta">
                        <div class="meta-item"><strong>Developer</strong><a href="https://www.linkedin.com/in/aditya-s-b29ab0120/" target="_blank">Aditya Singh</a></div>
                        <div class="meta-item"><strong>Platform</strong><span>Chrome Extension &mdash; Manifest V3</span></div>
                        <div class="meta-item"><strong>Target</strong><span>Adobe Experience Manager 6.5 &amp; AEM as a Cloud Service</span></div>
                    </div>
                    <button id="close-about">Close</button>
                </div>
            </div>
        `;

        // 5. Create Settings Modal
        const settingsModal = document.createElement('div');
        settingsModal.id = 'aem-settings-modal';
        settingsModal.innerHTML = `
            <div class="settings-modal-content">
                <div class="settings-header">UI PREFERENCES</div>
                <div class="settings-body">
                    <div class="setting-row main-toggle">
                        <label>Enable Smart Footer</label>
                        <input type="checkbox" id="set-footer-enable" ${appSettings.footerEnabled ? 'checked' : ''}>
                    </div>
                    <div class="settings-group" id="footer-sub-options" style="display: ${appSettings.footerEnabled ? 'block' : 'none'}">
                        <div class="setting-row"><span>Node Type</span><input type="checkbox" id="set-type" ${appSettings.showNodeType ? 'checked' : ''}></div>
                        <div class="setting-row"><span>Current User</span><input type="checkbox" id="set-user" ${appSettings.showUser ? 'checked' : ''}></div>
                        <div class="setting-row"><span>Modified By</span><input type="checkbox" id="set-mod" ${appSettings.showModified ? 'checked' : ''}></div>
                        <div class="setting-row"><span>Status</span><input type="checkbox" id="set-stat" ${appSettings.showStatus ? 'checked' : ''}></div>
                    </div>
                    <button id="save-settings">SAVE & REFRESH</button>
                </div>
            </div>
        `;

        document.body.append(launcher, menu, footer, aboutModal, settingsModal);
        
        setupEvents(launcher, menu);
        setupDrag(launcher, menu);
        bindModalControls();
        await loadToolsFromAPI();
        updateContext();

        if (!urlWatcherActive) {
            setupUrlWatcher();
            urlWatcherActive = true;
        }
    }

    function setupUrlWatcher() {
        // Catches browser back/forward and hash navigation immediately
        window.addEventListener('popstate', handleUrlChange);
        window.addEventListener('hashchange', handleUrlChange);

        // Poll for pushState-based SPA navigation (CSP-safe alternative to script injection)
        setInterval(handleUrlChange, 500);
    }

    function handleUrlChange() {
        const current = location.href;
        if (current !== lastUrl) {
            lastUrl = current;
            // Small delay lets the page DOM settle after navigation
            setTimeout(updateContext, 150);
        }
    }

    function bindModalControls() {
    const aboutModal = document.getElementById('aem-about-modal');
    const settingsModal = document.getElementById('aem-settings-modal');
    const closeAbout = document.getElementById('close-about');
    const saveSettings = document.getElementById('save-settings');
    const settingsBtn = document.getElementById('open-settings-btn');

    // 1. Handle About Modal Closure
    if (closeAbout) {
        closeAbout.onclick = () => {
            aboutModal.classList.remove('is-active');
        };
    }

    // 2. Handle Settings Modal Opening (from Header Icon)
    if (settingsBtn) {
        settingsBtn.onclick = () => {
            settingsModal.classList.add('is-active');
        };
    }

    // 3. Dynamic UI Feedback for Sub-Options
    const mainToggle = document.getElementById('set-footer-enable');
    const subOptions = document.getElementById('footer-sub-options');
    
    if (mainToggle) {
        mainToggle.onchange = (e) => {
            // Show/Hide sub-settings instantly when main toggle changes
            subOptions.style.display = e.target.checked ? 'block' : 'none';
        };
    }

    // 4. Save and Persistence Logic
    if (saveSettings) {
        saveSettings.onclick = () => {
            const newSettings = {
                footerEnabled: document.getElementById('set-footer-enable').checked,
                showNodeType: document.getElementById('set-type').checked,
                showUser: document.getElementById('set-user').checked,
                showModified: document.getElementById('set-mod').checked,
                showStatus: document.getElementById('set-stat').checked
            };

            // Save to Chrome Storage for cross-session persistence
            chrome.storage.local.set({ aemNavSettings: newSettings }, () => {
                console.log("Navigator Pro: Settings saved successfully.");
                // Reload is necessary to re-initialize footer and fetch logic
                location.reload(); 
            });
        };
    }

    // 5. Close Modals on Overlay Click
    window.onclick = (event) => {
        if (event.target == aboutModal) aboutModal.classList.remove('is-active');
        if (event.target == settingsModal) settingsModal.classList.remove('is-active');
    };
}

    async function loadToolsFromAPI() {
        try {
            const resp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`);
            const data = await resp.json();
            const scroll = document.getElementById('hud-content-scroll');
            scroll.innerHTML = '';
            let currentCat = "";

            (data.values || []).forEach(row => {
                if (!row[1]) return;
                if (row[0] !== currentCat) {
                    currentCat = row[0];
                    const h = document.createElement('div'); h.className = 'hud-category-header'; h.innerText = currentCat;
                    scroll.appendChild(h);
                }
                const btn = document.createElement('button'); 
                btn.className = 'hud-btn'; 
                btn.innerText = row[1];
                btn.onclick = (e) => {
                    e.preventDefault();
                    const c3 = row[2] ? String(row[2]).toLowerCase().trim() : "";
                    const c4 = row[3] ? String(row[3]).toLowerCase().trim() : "";
                    if (c3.includes('isabout') || c4.includes('isabout')) {
                        document.getElementById('about-description').innerText = "AEM Navigator Pro is an advanced productivity suite for Adobe Experience Manager. It simplifies complex development workflows by providing instant, one-click access to core consoles, diagnostic tools, and node metadata. Built for Developers, Technical Consultants and Architects, it bridges the gap between deep JCR structures and high-level site management.";
                        document.getElementById('aem-about-modal').classList.add('is-active');
                    } else if (row[2]) {
                        window.open(row[2].startsWith('http') ? row[2] : location.origin + row[2], '_blank');
                    }
                };
                scroll.appendChild(btn);
            });

            const sBtn = document.createElement('button');
            sBtn.className = 'hud-btn settings-trigger-btn';
            sBtn.innerText = "⚙️ Preferences";
            sBtn.onclick = () => document.getElementById('aem-settings-modal').classList.add('is-active');
            scroll.appendChild(sBtn);

        } catch (e) { console.error("API Error", e); }
    }

    async function updateContext() {
    if (!appSettings.footerEnabled) {
        document.getElementById('aem-smart-footer').classList.remove('active');
        return;
    }

    const path = window.location.pathname;
    let jcrPath = "";
    if (path.includes('/editor.html')) jcrPath = path.split('/editor.html')[1].replace('.html', '');
    else if (path.includes('/sites.html') || path.includes('/assets.html')) jcrPath = path.split('.html')[1];
    
    const footer = document.getElementById('aem-smart-footer');
    if (jcrPath && jcrPath.startsWith('/content')) {
        footer.classList.add('active');
        const display = document.getElementById('f-page-name');
        
        display.innerHTML = `
            <span class="f-item">
                <span class="f-label">Node</span>
                <span class="f-val">${jcrPath.split('/').pop().toUpperCase()}</span>
            </span>
            <span class="f-divider${appSettings.showNodeType ? '' : ' f-hidden'}"></span>
            <span class="f-item${appSettings.showNodeType ? '' : ' f-hidden'}">
                <span class="f-label">Type</span>
                <span id="f-node-type" class="f-val f-badge">...</span>
            </span>
            <span class="f-divider${appSettings.showUser ? '' : ' f-hidden'}"></span>
            <span class="f-item${appSettings.showUser ? '' : ' f-hidden'}">
                <span class="f-label">User</span>
                <span id="f-user" class="f-val f-badge">...</span>
            </span>
            <span class="f-divider${appSettings.showModified ? '' : ' f-hidden'}"></span>
            <span class="f-item${appSettings.showModified ? '' : ' f-hidden'}">
                <span class="f-label">Mod By</span>
                <span id="f-mod" class="f-val f-badge">...</span>
            </span>
            <span class="f-divider${appSettings.showStatus ? '' : ' f-hidden'}"></span>
            <span class="f-item${appSettings.showStatus ? '' : ' f-hidden'}">
                <span class="f-label">Status</span>
                <span id="f-stat" class="f-val f-badge">...</span>
            </span>
        `;
        
        const isDam = jcrPath.startsWith('/content/dam');

        const actions = document.querySelector('.footer-right-actions');
        actions.innerHTML = `
            <button class="f-mini-btn" id="f-crx">Open in CRX/DE</button>
            ${!isDam ? '<button class="f-mini-btn" id="f-pub">View as Published</button>' : ''}
            <button class="f-mini-btn" id="f-json">View JSON</button>
            <button id="f-dismiss">×</button>
        `;

        document.getElementById('f-crx').onclick = () => window.open(`${location.origin}/crx/de/index.jsp#${jcrPath}`, '_blank');
        if (!isDam) document.getElementById('f-pub').onclick = () => window.open(`${location.origin}${jcrPath}.html?wcmmode=disabled`, '_blank');
        document.getElementById('f-json').onclick = () => window.open(`${location.origin}${jcrPath}.infinity.json`, '_blank');
        document.getElementById('f-dismiss').onclick = () => footer.classList.remove('active');

        try {
            const nodeResp = await fetch(`${location.origin}${jcrPath}.1.json`);
            if (nodeResp.ok) {
                const data = await nodeResp.json();
                const content = data['jcr:content'] || data;

                if (document.getElementById('f-node-type')) document.getElementById('f-node-type').innerText = data['jcr:primaryType'] || 'nt:unstructured';
                if (document.getElementById('f-mod')) document.getElementById('f-mod').innerText = content['cq:lastModifiedBy'] || content['jcr:lastModifiedBy'] || 'N/A';
                if (document.getElementById('f-stat')) document.getElementById('f-stat').innerText = content['cq:lastReplicationAction'] || 'Draft';
            }

            if (appSettings.showUser) {
                const userResp = await fetch(`${location.origin}/libs/granite/security/currentuser.json`);
                if (userResp.ok) {
                    const userData = await userResp.json();
                    if (document.getElementById('f-user')) document.getElementById('f-user').innerText = userData.authorizableId || 'anonymous';
                }
            }
        } catch (e) { console.warn("Navigator Pro: Metadata fetch failed", e); }
    } else {
        footer.classList.remove('active');
    }
}

    function setupDrag(l, m) {
        l.onmousedown = (e) => {
            if (e.button !== 0) return;
            isDragging = false; 
            startY = e.clientY; 
            startTop = parseInt(window.getComputedStyle(l).top, 10);
            const move = (me) => {
                const deltaY = me.clientY - startY;
                if (Math.abs(deltaY) > 3) {
                    isDragging = true;
                    let nt = Math.max(10, Math.min(startTop + deltaY, window.innerHeight - 100));
                    l.style.top = m.style.top = nt + 'px';
                    calculateMenuHeight(m);
                }
            };
            const up = () => {
                if (isDragging) localStorage.setItem('aem-nav-top', parseInt(l.style.top, 10));
                document.removeEventListener('mousemove', move);
                document.removeEventListener('mouseup', up);
            };
            document.addEventListener('mousemove', move);
            document.addEventListener('mouseup', up);
        };
    }

    function calculateMenuHeight(menu) {
        const topPos = parseInt(menu.style.top, 10) || 60;
        const availableHeight = window.innerHeight - topPos - 40; 
        menu.style.maxHeight = availableHeight + 'px'; // Fix for scrolling
    }

    function setupEvents(l, m) {
        const s = document.getElementById('aem-hud-search');

        function visibleButtons() {
            return [...m.querySelectorAll('.hud-btn:not(.hidden)')];
        }

        function closeMenu() {
            m.classList.remove('is-visible');
            l.classList.remove('menu-open');
            l.focus();
        }

        l.onclick = () => {
            if (!isDragging) {
                const open = m.classList.toggle('is-visible');
                l.classList.toggle('menu-open', open);
                if (open) {
                    calculateMenuHeight(m);
                    s.focus();
                }
            }
        };

        // Arrow keys from search input move focus into the list
        s.onkeydown = (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                const btns = visibleButtons();
                if (btns.length) btns[0].focus();
            } else if (e.key === 'Escape') {
                closeMenu();
            }
        };

        // Arrow key navigation across buttons via event delegation on the scroll container
        const scroll = document.getElementById('hud-content-scroll');
        scroll.onkeydown = (e) => {
            if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Escape') return;
            e.preventDefault();

            if (e.key === 'Escape') { closeMenu(); return; }

            const btns = visibleButtons();
            const idx = btns.indexOf(document.activeElement);
            if (idx === -1) return;

            if (e.key === 'ArrowDown') {
                const next = btns[idx + 1];
                if (next) { next.focus(); next.scrollIntoView({ block: 'nearest' }); }
            } else {
                if (idx === 0) {
                    s.focus();
                } else {
                    const prev = btns[idx - 1];
                    prev.focus();
                    prev.scrollIntoView({ block: 'nearest' });
                }
            }
        };

        s.oninput = (e) => {
            const v = e.target.value.toLowerCase();
            document.querySelectorAll('.hud-btn').forEach(b => b.classList.toggle('hidden', !b.innerText.toLowerCase().includes(v)));
        };
    }

    setInterval(() => {
        if (!document.getElementById('aem-hud-launcher')) {
            init();
        } else if (location.href !== lastUrl) {
            lastUrl = location.href;
            updateContext();
        }
    }, 2000);
})();

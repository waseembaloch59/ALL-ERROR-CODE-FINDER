// Firebase Configuration - USE THIS COMPLETE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyC_ua8fWjldA-M2RFjGzW34FGpBZkCx4FE",
  authDomain: "all-error-code-finder.firebaseapp.com",
  databaseURL: "https://all-error-code-finder-default-rtdb.firebaseio.com",
  projectId: "all-error-code-finder",
  storageBucket: "all-error-code-finder.firebasestorage.app",
  messagingSenderId: "463038418551",
  appId: "1:463038418551:web:6ff5870912d23891d50072",
  measurementId: "G-H0B5FFE3FH"
};

// Firebase variables
let firebaseApp, firebaseAuth, firebaseDb, firebaseStorage;
let currentUser = null;
let errorcodeData = { Pakistani: [], International: [] };
let fullData = {};

// Initialize Firebase
function initializeFirebase() {
    try {
        if (typeof firebase === 'undefined') {
            console.error('Firebase SDK not loaded');
            showNotification('Firebase SDK not loaded. Please check internet.', 'error');
            return false;
        }

        if (!firebase.apps.length) {
            firebaseApp = firebase.initializeApp(firebaseConfig);
            console.log('✅ Firebase initialized successfully');
            console.log('✅ Database URL:', firebaseConfig.databaseURL);
        } else {
            firebaseApp = firebase.app();
            console.log('✅ Firebase already initialized');
        }

        firebaseAuth = firebase.auth();
        firebaseDb = firebase.database();
        firebaseStorage = firebase.storage();

        return true;
    } catch (error) {
        console.error('Firebase initialization error:', error);
        return false;
    }
}

// Initialize app  
function initApp() {  
    console.log('Initializing app...');  

    if (!initializeFirebase()) {  
        showNotification('Firebase initialization failed. Please check connection.', 'error');  
        return;  
    }

    // Load data immediately
    loadAllDataFromFirebase();  
    loadSupportDetails();

    // Setup auth state listener
    firebaseAuth.onAuthStateChanged((user) => {
        console.log('Auth state changed:', user ? 'User logged in' : 'User logged out');

        if (user) {  
            currentUser = user;  
            updateUserProfile(user);  
            updateHeaderForLoggedIn(user);
        } else {  
            currentUser = null;  
            updateHeaderForLoggedOut();  
            const modalAvatar = document.getElementById('modalAvatar');
            const modalUsername = document.getElementById('modalUsername');
            const modalEmail = document.getElementById('modalEmail');
            if (modalAvatar) modalAvatar.innerHTML = '<i class="fas fa-user"></i>';  
            if (modalUsername) modalUsername.textContent = 'User';  
            if (modalEmail) modalEmail.textContent = 'email@example.com';  
        }  
    });

    // Add Enter key support for search inputs
    const pakistaniCode = document.getElementById('pakistaniCode');
    const internationalCode = document.getElementById('internationalCode');
    
    if (pakistaniCode) {
        pakistaniCode.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') searchError('pakistani');
        });
    }

    if (internationalCode) {
        internationalCode.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') searchError('international');
        });
    }
}

// Load support details
async function loadSupportDetails() {
    try {
        if (!firebaseDb) return;
        
        const snapshot = await firebaseDb.ref('support/details').once('value');
        const details = snapshot.val();

        if (details) {
            const nameEl = document.getElementById('supportName');
            const titleEl = document.getElementById('supportTitle');
            const emailEl = document.getElementById('supportEmail');
            const wtspEl = document.getElementById('supportWtsp');

            if (nameEl) nameEl.textContent = details.name || 'Waseem Baloch';
            if (titleEl) titleEl.textContent = details.title || 'Lead Technician & Support';
            if (emailEl) emailEl.textContent = details.email || 'waseembaloch59@gmail.com';
            if (wtspEl) wtspEl.textContent = details.whatsapp || '+92 307 1521701';

            if (details.photoUrl && document.getElementById('supportPhotoImg')) {
                document.getElementById('supportPhotoImg').src = details.photoUrl;
            }
        }
    } catch (error) {
        console.log('Support details not found, using defaults');
    }
}

// Load category data based on selected appliance
function loadCategoryData() {
    const applianceSelect = document.getElementById('applianceSelect');
    if (!applianceSelect) return;
    
    const appliance = applianceSelect.value;
    const applianceMap = {
        'Ac': 'ac',
        'Washing_Machine': 'washing_machine',
        'Refrigerator': 'refrigerator',
        'Microwave': 'microwave',
        'Tv': 'tv',
        'Inverter': 'inverter'
    };
    const appKey = applianceMap[appliance] || appliance.toLowerCase();
    
    let pakistaniData = [];
    let internationalData = [];

    if (fullData.pakistani && fullData.pakistani[appKey]) {
        pakistaniData = fullData.pakistani[appKey];
    } else if (fullData[appKey] && fullData[appKey].pakistani) {
        pakistaniData = fullData[appKey].pakistani;
    }

    if (fullData.international && fullData.international[appKey]) {
        internationalData = fullData.international[appKey];
    } else if (fullData[appKey] && fullData[appKey].international) {
        internationalData = fullData[appKey].international;
    }
    
    errorcodeData = {
        Pakistani: Array.isArray(pakistaniData) ? pakistaniData : (pakistaniData ? Object.values(pakistaniData) : []),
        International: Array.isArray(internationalData) ? internationalData : (internationalData ? Object.values(internationalData) : [])
    };
    populateBrandDropdowns();
}

// Populate brand dropdowns
function populateBrandDropdowns() {
    const pakistaniSelect = document.getElementById('pakistaniBrand');
    const internationalSelect = document.getElementById('internationalBrand');

    if (!pakistaniSelect || !internationalSelect) return;

    while (pakistaniSelect.options.length > 1) pakistaniSelect.remove(1);
    while (internationalSelect.options.length > 1) internationalSelect.remove(1);

    console.log('Populating dropdowns with:', errorcodeData);

    // Add Pakistani brands
    if (Array.isArray(errorcodeData.Pakistani)) {
        errorcodeData.Pakistani.forEach(brandData => {
            if (brandData && brandData.brand) {
                const option = document.createElement('option');
                option.value = brandData.brand;
                option.textContent = brandData.brand;
                pakistaniSelect.appendChild(option);
            }
        });
    }

    // Add International brands
    if (Array.isArray(errorcodeData.International)) {
        errorcodeData.International.forEach(brandData => {
            if (brandData && brandData.brand) {
                const option = document.createElement('option');
                option.value = brandData.brand;
                option.textContent = brandData.brand;
                internationalSelect.appendChild(option);
            }
        });
    }
}

// Search error function
function searchError(tab) {
    const brandSelect = tab === 'pakistani' ? document.getElementById('pakistaniBrand') : document.getElementById('internationalBrand');
    const codeInput = tab === 'pakistani' ? document.getElementById('pakistaniCode') : document.getElementById('internationalCode');

    if (!brandSelect || !codeInput) return;
    
    const brandName = brandSelect.value;
    const code = codeInput.value.trim().toUpperCase();

    if (!brandName || !code) {
        showNotification('Please select brand and enter error code', 'warning');
        return;
    }

    const resultDiv = document.getElementById('resultArea');
    if (!resultDiv) return;
    
    resultDiv.innerHTML = `
        <div class="initial-state">
            <div class="loading-spinner"></div>
            <h3>Searching...</h3>
            <p>Looking for ${code} in ${brandName}</p>
        </div>
    `;

    codeInput.blur();
    const category = tab === 'pakistani' ? 'Pakistani' : 'International';

    setTimeout(() => {
        try {
            const categoryData = errorcodeData[category];
            if (!Array.isArray(categoryData) || categoryData.length === 0) {
                throw new Error('No data available');
            }

            const brandData = categoryData.find(b => b && b.brand === brandName);
            if (!brandData || !Array.isArray(brandData.error_code)) {
                throw new Error('Brand data not found');
            }

            const error = brandData.error_code.find(e => e && e.code && e.code.toUpperCase() === code);

            if (!error) {
                throw new Error('Error code not found');
            }

            const initial = brandName.charAt(0).toUpperCase();
            resultDiv.innerHTML = `
                <div class="result-card">
                    <div class="result-header">
                        <div class="brand-icon">${initial}</div>
                        <div>
                            <div class="result-title">${brandName}</div>
                            <div class="error-code">Error Code: ${error.code}</div>
                        </div>
                    </div>
                    <div class="info-item issue">
                        <div class="info-icon issue"><i class="fas fa-exclamation-triangle"></i></div>
                        <div class="info-content">
                            <h4>Issue</h4>
                            <p>${error.issue || 'No issue description available'}</p>
                        </div>
                    </div>
                    <div class="info-item solution">
                        <div class="info-icon solution"><i class="fas fa-check-circle"></i></div>
                        <div class="info-content">
                            <h4>Solution</h4>
                            <p>${error.solution || 'No solution available'}</p>
                        </div>
                    </div>
                </div>
            `;

            resultDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
            showNotification(`Found: ${brandName} - ${error.code}`, 'success');
            codeInput.value = '';

        } catch(error) {
            console.error('Search error:', error);
            resultDiv.innerHTML = `
                <div class="initial-state">
                    <i class="fas fa-times-circle" style="color: var(--error);"></i>
                    <h3>Not Found</h3>
                    <p>${error.message || 'Error code not found in database'}</p>
                    <p style="margin-top: 15px; font-size: 14px; color: var(--text-gray);">
                        Try checking spelling or browse available brands
                    </p>
                </div>
            `;
            showNotification('Error code not found', 'error');
        }
    }, 300);
}

// Update header for logged in user
function updateHeaderForLoggedIn(user) {
    const avatarEl = document.getElementById('userAvatar');
    if (!avatarEl) return;
    
    const initial = (user.displayName || user.email || 'U').charAt(0).toUpperCase();

    if (user.photoURL) {
        avatarEl.innerHTML = `<img src="${user.photoURL}" alt="Profile" style="width:100%;height:100%;object-fit:cover;">`;
    } else {
        avatarEl.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:18px;">${initial}</div>`;
    }
}

// Update header for logged out user
function updateHeaderForLoggedOut() {
    const avatarEl = document.getElementById('userAvatar');
    if (avatarEl) avatarEl.innerHTML = '<i class="fas fa-user"></i>';
}

// Update user profile
function updateUserProfile(user) {
    const modalAvatarEl = document.getElementById('modalAvatar');
    const modalUsername = document.getElementById('modalUsername');
    const modalEmail = document.getElementById('modalEmail');
    
    if (!modalAvatarEl || !modalUsername || !modalEmail) return;
    
    const initial = (user.displayName || user.email || 'U').charAt(0).toUpperCase();

    if (user.photoURL) {
        modalAvatarEl.innerHTML = `<img src="${user.photoURL}" alt="Profile" style="width:100%;height:100%;object-fit:cover;">`;
    } else {
        modalAvatarEl.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:48px;">${initial}</div>`;
    }

    modalUsername.textContent = user.displayName || 'User';
    modalEmail.textContent = user.email || '';
}

// Login function - FIXED
async function handleGoogleLogin() {
    try {
        const btn = document.getElementById('googleLoginBtn');
        if (!btn) return;
        
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
        btn.disabled = true;

        const provider = new firebase.auth.GoogleAuthProvider();
        
        // FIX: Use signInWithPopup instead of getRedirectResult
        const result = await firebaseAuth.signInWithPopup(provider);
        
        if (result.user) {
            console.log("Login success:", result.user);
            currentUser = result.user;
            showNotification('Login successful! Welcome ' + result.user.displayName, 'success');
            updateUserProfile(result.user);
            updateHeaderForLoggedIn(result.user);
            
            // Login screen band + app open
            const loginScreen = document.getElementById('loginScreen');
            const appContainer = document.getElementById('appContainer');
            if (loginScreen) loginScreen.style.display = 'none';
            if (appContainer) appContainer.classList.add('active');
        }
        
        btn.innerHTML = originalHTML;
        btn.disabled = false;
        
    } catch (error) {
        console.error("Login error:", error);
        let errorMessage = 'Login failed: ';
        
        if (error.code === 'auth/popup-blocked') {
            errorMessage += 'Popup was blocked. Please allow popups for this site.';
        } else if (error.code === 'auth/popup-closed-by-user') {
            errorMessage += 'Popup was closed before completing sign in.';
        } else if (error.code === 'auth/unauthorized-domain') {
            errorMessage += 'This domain is not authorized. Please check Firebase Console.';
        } else {
            errorMessage += error.message;
        }
        
        showNotification(errorMessage, 'error');
        
        const btn = document.getElementById('googleLoginBtn');
        if (btn) {
            btn.innerHTML = '<i class="fab fa-google"></i> Sign in with Google';
            btn.disabled = false;
        }
    }
}

// Logout function
async function handleLogout() {
    try {
        await firebaseAuth.signOut();

        // Clear all saved state
        localStorage.clear();
        sessionStorage.clear();

        // Clear search
        const searchInput = document.getElementById("searchInput");
        const results = document.getElementById("results");
        if (searchInput) searchInput.value = "";
        if (results) results.innerHTML = "";

        // Reset app data
        currentUser = null;
        errorcodeData = { Pakistani: [], International: [] };

        showNotification('Logged out successfully', 'info');
        closeUserModal();

        // Fresh start
        location.reload();

    } catch (error) {
        console.error('Logout error:', error);
        showNotification('Logout failed', 'error');
    }
}

// Suggestion submission
function submitSuggestion() {
    const nameInput = document.getElementById('suggestionName');
    const emailInput = document.getElementById('suggestionEmail');
    const mobileInput = document.getElementById('suggestionMobile');
    const suggestionInput = document.getElementById('suggestionText');
    
    if (!nameInput || !emailInput || !mobileInput || !suggestionInput) return;
    
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const mobile = mobileInput.value.trim();
    const suggestion = suggestionInput.value.trim();

    if (!name || !email || !mobile || !suggestion) {
        showNotification('Please fill all fields', 'warning');
        return;
    }

    if (!firebaseDb) {
        showNotification('Database not available', 'error');
        return;
    }

    const btn = event.target;
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    btn.disabled = true;

    firebaseDb.ref('suggestions').push({
        name: name,
        email: email,
        mobile: mobile,
        suggestion: suggestion,
        timestamp: Date.now(),
        userId: currentUser ? currentUser.uid : 'anonymous',
        userEmail: currentUser ? currentUser.email : 'anonymous'
    })
    .then(() => {
        showNotification('Suggestion submitted successfully!', 'success');
        nameInput.value = '';
        emailInput.value = '';
        mobileInput.value = '';
        suggestionInput.value = '';
        closeSuggestionModal();
    })
    .catch((error) => {
        console.error('Save suggestion error:', error);
        showNotification('Error: ' + error.message, 'error');
    })
    .finally(() => {
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    });
}

// Clear search history
function clearSearchHistory() {
    if (confirm('Clear all search history?')) {
        localStorage.removeItem('searchHistory');
        showNotification('Search history cleared', 'success');
        toggleSidebar();
    }
}

// UI functions
function adjustForKeyboard() {
    document.body.classList.add('keyboard-active');
    setTimeout(() => {
        const inputs = document.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                document.body.classList.remove('keyboard-active');
            });
        });
    }, 100);
}

function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    const tabElement = document.getElementById(tab);
    if (tabElement) tabElement.classList.add('active');
    if (event && event.target) event.target.classList.add('active');
}

let sidebarOpen = false;
let activeModal = null;

function handleHeaderAuthClick() {
    if (currentUser) {
        openUserModal();
    } else {
        showLogin();
    }
}

function openLoginPage() {
    showLogin();
}

function goBackToApp() {
    const loginScreen = document.getElementById('loginScreen');
    const appContainer = document.getElementById('appContainer');
    if (loginScreen) loginScreen.style.display = 'none';
    if (appContainer) appContainer.classList.add('active');
}

function showLogin() {
    const loginScreen = document.getElementById('loginScreen');
    const appContainer = document.getElementById('appContainer');
    if (loginScreen) loginScreen.style.display = 'flex';
    if (appContainer) appContainer.classList.remove('active');
    history.pushState({ screen: 'login' }, 'Login', '');
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (!sidebar) return;
    
    sidebarOpen = !sidebarOpen;
    sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('show');

    if (sidebarOpen) {
        history.pushState({ sidebar: true }, '');
    }
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('show');
    sidebarOpen = false;
}

function openModal(id) {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('show');
    sidebarOpen = false;

    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.add('show');
        activeModal = id;
        history.pushState({ modal: id }, '');
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('show');

    if (activeModal === id) {
        activeModal = null;
    }

    if (history.state && history.state.modal === id) {
        history.back();
    }
}

// Specialized modal functions
function openUserModal() { openModal('userModal'); }
function closeUserModal() { closeModal('userModal'); }
function openAboutModal() { openModal('aboutModal'); }
function closeAboutModal() { closeModal('aboutModal'); }
function openSupportModal() { openModal('supportModal'); }
function closeSupportModal() { closeModal('supportModal'); }
function openSuggestionModal() { openModal('suggestionModal'); }
function closeSuggestionModal() { closeModal('suggestionModal'); }

// Back button handling
window.addEventListener('popstate', (event) => {
    if (activeModal) {
        const modal = document.getElementById(activeModal);
        if (modal) modal.classList.remove('show');
        activeModal = null;
    } else if (sidebarOpen) {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('show');
        sidebarOpen = false;
    } else if (document.getElementById('loginScreen') && document.getElementById('loginScreen').style.display === 'flex') {
        goBackToApp();
    }
});

// Touch swipe gesture support
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', (e) => {
    try {
        touchStartX = e.touches[0].screenX;
    } catch (err) {
        touchStartX = 0;
    }
}, { passive: true });

document.addEventListener('touchend', (e) => {
    try {
        touchEndX = e.changedTouches[0].screenX;
        if (touchEndX - touchStartX > 100) {
            if (document.getElementById('loginScreen') && document.getElementById('loginScreen').style.display === 'flex') {
                goBackToApp();
            } else if (sidebarOpen) {
                closeSidebar();
            }
        }
    } catch (err) {}
}, { passive: true });

function showNotification(msg, type) {
    const notif = document.getElementById('notification');
    if (!notif) {
        console.log(msg);
        return;
    }

    notif.textContent = msg;
    notif.classList.remove('show');
    notif.style.background = 'rgba(20, 20, 20, 0.9)';
    notif.style.color = '#ffffff';
    notif.style.borderColor = '#ff9800';

    setTimeout(() => notif.classList.add('show'), 10);
    setTimeout(() => notif.classList.remove('show'), 2000);
}

function showApp() {
    const loginScreen = document.getElementById('loginScreen');
    const appContainer = document.getElementById('appContainer');
    if (loginScreen) loginScreen.style.display = 'none';
    if (appContainer) appContainer.classList.add('active');
}

// Load all data from Firebase
async function loadAllDataFromFirebase() {
    try {
        console.log('Attempting to load data from specific nodes...');
        
        if (!firebaseDb) {
            console.error('Firebase database not initialized');
            return;
        }
        
        const nodes = [
            'pakistani',
            'international',
            'ac',
            'washing_machine',
            'refrigerator',
            'microwave',
            'tv',
            'inverter',
            'errorCodes'
        ];

        const results = await Promise.all(
            nodes.map(node =>
                firebaseDb.ref(node).once('value')
                    .then(snap => ({ node, val: snap.val() }))
                    .catch(err => {
                        console.warn(`Node ${node} read failed:`, err.message);
                        return { node, val: null };
                    })
            )
        );

        // Reset data store
        fullData = {};

        results.forEach(res => {
            if (!res.val) return;

            if (res.node === 'errorCodes') {
                Object.assign(fullData, res.val);
            } else {
                fullData[res.node] = res.val;
            }
        });

        console.log('Final Loaded Data:', fullData);

        const hasData = Object.keys(fullData).length > 0;

        if (hasData) {
            loadCategoryData(); 
            console.log('Data loaded successfully');
        } else {
            console.warn('No data found in allowed nodes');
            showNotification('Database is empty. Please check nodes.', 'warning');
        }

    } catch (error) {
        console.error('Firebase Load Error:', error);
        showNotification('Connection Error: ' + error.message, 'error');
    }
}

// DOMContentLoaded events
document.addEventListener('DOMContentLoaded', () => {
    initApp();

    // Modal close on outside click
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });

    // Escape key to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && activeModal) {
            closeModal(activeModal);
        }
    });

    // Sidebar overlay click
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', (e) => {
            if (e.target === sidebarOverlay) {
                closeSidebar();
            }
        });
    }
});

// Sidebar close when clicking/touching outside
document.addEventListener('mousedown', function(e) {
    if (!sidebarOpen) return;

    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.querySelector('.menu-btn');
    const overlay = document.getElementById('sidebarOverlay');

    if (e.target.closest('.sidebar-btn') || e.target.closest('.sidebar-close') || e.target.closest('.sidebar-back-btn')) {
        return;
    }

    if (sidebar && sidebar.contains(e.target)) {
        return;
    }

    if (menuToggle && menuToggle.contains(e.target)) {
        return;
    }

    if (e.target === overlay || !sidebar.contains(e.target)) {
        closeSidebar();
    }
});

// Mobile touch support for sidebar close
document.addEventListener('touchstart', function(e) {
    if (!sidebarOpen) return;

    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.querySelector('.menu-btn');
    const overlay = document.getElementById('sidebarOverlay');

    if (e.target.closest('.sidebar-btn') || e.target.closest('.sidebar-close') || e.target.closest('.sidebar-back-btn')) {
        return;
    }

    if (sidebar && sidebar.contains(e.target)) {
        return;
    }

    if (menuToggle && menuToggle.contains(e.target)) {
        return;
    }

    if (e.target === overlay || !sidebar.contains(e.target)) {
        closeSidebar();
    }
}, { passive: true });
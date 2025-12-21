// === Configuration ===
const API_BASE_URL = 'http://localhost:3000/api';

// === Authentication State ===
let currentUser = null; // { name: 'Admin', role: 'admin' } or { name: 'Guest', role: 'guest' }

// === DOM Elements ===
// Login Elements
const loginView = document.getElementById('loginView');
const appView = document.getElementById('appView');
const userSelect = document.getElementById('userSelect');
const passwordSection = document.getElementById('passwordSection');
const loginPassword = document.getElementById('loginPassword');
const loginBtn = document.getElementById('loginBtn');
const guestLoginBtn = document.getElementById('guestLoginBtn');
const loginError = document.getElementById('loginError');

// App Elements
const mainView = document.getElementById('mainView');
const settingsView = document.getElementById('settingsView');
const statsSection = document.getElementById('statsSection');
const formSection = document.getElementById('formSection');
const collectionTitle = document.getElementById('collectionTitle');
const dashboardGrid = document.querySelector('.dashboard-grid'); 

const bookList = document.getElementById('bookList');
const addBookForm = document.getElementById('addBookForm');
const searchInput = document.getElementById('searchInput');
const filterStatus = document.getElementById('filterStatus');

// Header Elements
const userAvatarImg = document.getElementById('userAvatarImg');
const userNameDisplay = document.getElementById('userNameDisplay');

// Stats Elements
const totalBooksEl = document.getElementById('totalBooks');
const availableBooksEl = document.getElementById('availableBooks');
const checkedOutBooksEl = document.getElementById('checkedOutBooks');

// Navigation Elements
const navDashboard = document.getElementById('nav-dashboard');
const navLibrary = document.getElementById('nav-library');
const navFavorites = document.getElementById('nav-favorites');
const navSettings = document.getElementById('nav-settings');
const navLogout = document.getElementById('nav-logout');
const navItems = document.querySelectorAll('.nav-item');

// === API Functions ===
// ... (Your existing API functions remain exactly the same) ...
async function fetchBooks() {
    try {
        const response = await fetch(`${API_BASE_URL}/books`);
        if (!response.ok) throw new Error('Failed to fetch books');
        myLibrary = await response.json();
        return myLibrary;
    } catch (err) {
        console.error(err);
        showNotification('Using offline mode (Database fetch failed)', 'error');
        return [];
    }
}
async function addBookToDB(bookData) {
    try {
        const response = await fetch(`${API_BASE_URL}/books`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bookData)
        });
        if (!response.ok) throw new Error('Failed');
        const newBook = await response.json();
        showNotification('Book added!', 'success');
        return newBook;
    } catch (err) { showNotification('Failed to add book', 'error'); return null; }
}
async function checkoutBook(id, borrower) {
    try {
        const response = await fetch(`${API_BASE_URL}/books/${id}/checkout`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ borrower })
        });
        if (!response.ok) throw new Error('Failed');
        return await response.json();
    } catch (err) { showNotification('Failed to checkout', 'error'); return null; }
}
async function checkinBook(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/books/${id}/checkin`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error('Failed');
        return await response.json();
    } catch (err) { showNotification('Failed to return', 'error'); return null; }
}
async function deleteBookFromDB(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/books/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed');
        return true;
    } catch (err) { showNotification('Failed to delete', 'error'); return false; }
}
async function fetchBookHistory(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/books/${id}/history`);
        return await response.json();
    } catch (err) { return null; }
}
async function clearBookHistory(id) {
    try {
        await fetch(`${API_BASE_URL}/books/${id}/history`, { method: 'DELETE' });
        return await fetchBookHistory(id); // return empty list
    } catch (err) { return null; }
}
async function toggleFavoriteInDB(id) {
    try {
        await fetch(`${API_BASE_URL}/books/${id}/favorite`, { method: 'PATCH' });
    } catch (err) { console.error(err); }
}

// === AUTHENTICATION LOGIC ===

// 1. Check if user is already logged in on load
function initAuth() {
    const savedUser = localStorage.getItem('bookbase_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        loadApp();
    } else {
        loginView.classList.remove('hidden');
        appView.classList.add('hidden');
    }
}

// 2. Handle User Selection
userSelect.addEventListener('change', () => {
    loginError.classList.add('hidden');
    loginPassword.value = '';
    
    // Only show password field for Admin
    if (userSelect.value === 'admin') {
        passwordSection.classList.remove('hidden');
    } else {
        passwordSection.classList.add('hidden');
    }
});

// 3. Login Button Click
loginBtn.addEventListener('click', () => {
    const role = userSelect.value;
    
    if (!role) {
        showNotification('Please select a user', 'error');
        return;
    }

    if (role === 'admin') {
        // Simple hardcoded password check
        if (loginPassword.value === 'admin123') { 
            loginUser('Administrator', 'admin', 'https://ui-avatars.com/api/?name=Admin&background=3b82f6&color=fff');
        } else {
            loginError.classList.remove('hidden');
            loginPassword.classList.add('error-border');
        }
    } else {
        // Librarian (No password for demo)
        loginUser('Librarian', 'librarian', 'https://ui-avatars.com/api/?name=Librarian&background=10b981&color=fff');
    }
});

// 4. Guest Login
guestLoginBtn.addEventListener('click', () => {
    loginUser('Guest', 'guest', 'https://ui-avatars.com/api/?name=Guest&background=6b7280&color=fff');
});

// 5. Execute Login
function loginUser(name, role, avatar) {
    currentUser = { name, role, avatar };
    localStorage.setItem('bookbase_user', JSON.stringify(currentUser));
    loadApp();
}

// 6. Logout Function
window.logout = () => {
    localStorage.removeItem('bookbase_user');
    location.reload(); // Reloads page to return to login
};

function loadApp() {
    loginView.classList.add('hidden');
    appView.classList.remove('hidden');
    
    // Update Profile UI
    userNameDisplay.textContent = currentUser.name;
    userAvatarImg.src = currentUser.avatar;

    // Permissions: If guest, hide "Add Book" form and "Settings"
    if (currentUser.role === 'guest') {
        formSection.style.display = 'none';
        navSettings.style.display = 'none';
        // Adjust grid for guest
        dashboardGrid.style.gridTemplateColumns = '1fr'; 
    }

    // Initialize Data
    initData(); 
}

// === MAIN APP LOGIC ===

async function initData() {
    showNotification(`Welcome back, ${currentUser.name}`, 'info');
    await fetchBooks();
    renderBooks();
    updateStats();
    setupNavigation();
    setupTheme();
}

// === Navigation ===
function setupNavigation() {
    navDashboard.addEventListener('click', (e) => { e.preventDefault(); setActiveNav(navDashboard); switchView('dashboard'); });
    navLibrary.addEventListener('click', (e) => { e.preventDefault(); setActiveNav(navLibrary); switchView('library'); });
    navFavorites.addEventListener('click', (e) => { e.preventDefault(); setActiveNav(navFavorites); switchView('favorites'); });
    
    navSettings.addEventListener('click', (e) => { 
        e.preventDefault(); 
        if(currentUser.role === 'guest') return; // Double check
        setActiveNav(navSettings); 
        switchView('settings'); 
    });

    navLogout.addEventListener('click', (e) => {
        e.preventDefault();
        if(confirm('Logout?')) logout();
    });
}

function setActiveNav(activeItem) {
    navItems.forEach(item => item.classList.remove('active'));
    activeItem.classList.add('active');
}

function switchView(viewName) {
    // Hide all main sections
    mainView.classList.remove('hidden');
    settingsView.classList.add('hidden');
    
    // Default Grid
    if (currentUser.role !== 'guest') {
        dashboardGrid.style.gridTemplateColumns = '350px 1fr';
        formSection.style.display = 'block';
        statsSection.style.display = 'grid';
    } else {
        dashboardGrid.style.gridTemplateColumns = '1fr';
    }

    if (viewName === 'dashboard') {
        if (currentUser.role === 'guest') formSection.style.display = 'none';
        renderBooks();
    } else if (viewName === 'library' || viewName === 'favorites') {
        statsSection.style.display = 'none';
        formSection.style.display = 'none';
        dashboardGrid.style.gridTemplateColumns = '1fr';
        renderBooks(viewName === 'favorites');
    } else if (viewName === 'settings') {
        mainView.classList.add('hidden');
        settingsView.classList.remove('hidden');
    }
}

// === Core Logic ===
function renderBooks(onlyFavorites = false) {
    bookList.innerHTML = '';
    const searchTerm = searchInput.value.toLowerCase();
    const statusFilter = filterStatus.value;

    const filtered = myLibrary.filter(book => {
        const matchesSearch = book.title.toLowerCase().includes(searchTerm) || book.author.toLowerCase().includes(searchTerm);
        let matchesStatus = true;
        if (statusFilter === 'available') matchesStatus = book.status === 'available';
        if (statusFilter === 'checked-out') matchesStatus = book.status === 'checked-out';
        
        const matchesFav = onlyFavorites ? book.isFavorite : true;
        
        return matchesSearch && matchesStatus && matchesFav;
    });

    if (filtered.length === 0) {
        bookList.innerHTML = `<div class="empty-state"><p>No books found.</p></div>`;
        return;
    }

    filtered.forEach(book => {
        const card = document.createElement('div');
        card.className = `book-card ${book.status === 'checked-out' ? 'checked-out' : 'available'}`;
        
        const btnClass = book.status === 'checked-out' ? 'btn-checkin' : 'btn-checkout';
        const btnText = book.status === 'checked-out' ? 'Return' : 'Check Out';
        const heartIcon = book.isFavorite ? 'ri-heart-fill' : 'ri-heart-line';
        
        // Hide delete button for guests
        const deleteBtn = currentUser.role === 'admin' 
            ? `<button class="btn-delete" onclick="deleteBook('${book._id}')"><i class="ri-delete-bin-line"></i></button>` 
            : '';

        card.innerHTML = `
            <div class="book-header">
                <div class="book-title">${book.title}</div>
                <span class="status-badge ${book.status}">${book.status}</span>
            </div>
            <div class="book-author">by ${book.author}</div>
            <div class="book-description">${book.description}</div>
            ${book.checkedOutBy ? `<div class="book-borrower">Borrowed by: ${book.checkedOutBy}</div>` : ''}
            
            <div class="book-actions">
                <button class="${btnClass}" onclick="toggleBookStatus('${book._id}')">${btnText}</button>
                <button class="btn-fav ${book.isFavorite ? 'is-favorite' : ''}" onclick="toggleFavorite('${book._id}')"><i class="${heartIcon}"></i></button>
                <button class="btn-history" onclick="viewHistory('${book._id}')"><i class="ri-history-line"></i></button>
                ${deleteBtn}
            </div>
        `;
        bookList.appendChild(card);
    });
}

function updateStats() {
    totalBooksEl.textContent = myLibrary.length;
    const checkedOut = myLibrary.filter(b => b.status === 'checked-out').length;
    checkedOutBooksEl.textContent = checkedOut;
    availableBooksEl.textContent = myLibrary.length - checkedOut;
}

// === Action Handlers ===
let pendingBookId = null;

window.toggleBookStatus = async (id) => {
    const book = myLibrary.find(b => b._id === id);
    if (!book) return;

    // CHECKOUT LOGIC
    if (book.status === 'available') {
        
        // === GUEST RESTRICTION ===
        if (currentUser.role === 'guest') {
            document.getElementById('guestModal').style.display = 'flex';
            return;
        }

        // Proceed to Checkout Modal
        pendingBookId = id;
        document.getElementById('borrowerNameInput').value = '';
        document.getElementById('borrowModal').style.display = 'flex';
        document.getElementById('borrowerNameInput').focus();
    } 
    // RETURN LOGIC
    else {
        await checkinBook(id);
        await fetchBooks();
        renderBooks();
        updateStats();
    }
};

// Form Submissions
addBookForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const bookData = {
        title: document.getElementById('bookTitle').value,
        author: document.getElementById('bookAuthor').value,
        isbn: document.getElementById('bookISBN').value,
        description: document.getElementById('bookDescription').value
    };
    if(await addBookToDB(bookData)) {
        await fetchBooks();
        renderBooks();
        updateStats();
        addBookForm.reset();
    }
});

// Search & Filter
searchInput.addEventListener('input', () => renderBooks(currentView === 'favorites'));
filterStatus.addEventListener('change', () => renderBooks(currentView === 'favorites'));

// Global Wrappers
window.toggleFavorite = async (id) => {
    const book = myLibrary.find(b => b._id === id);
    if (book) {
        book.isFavorite = !book.isFavorite;
        renderBooks();
        await toggleFavoriteInDB(id);
    }
};
window.deleteBook = async (id) => {
    if(confirm('Delete book?')) {
        if(await deleteBookFromDB(id)) {
            await fetchBooks();
            renderBooks();
            updateStats();
        }
    }
};
window.resetSystem = async () => {
    if(confirm('Delete ALL books?')) {
        for(const b of myLibrary) await deleteBookFromDB(b._id);
        await fetchBooks();
        renderBooks();
        updateStats();
    }
};

// === Modal Logic (Borrow, Guest, History) ===
const borrowModal = document.getElementById('borrowModal');
const guestModal = document.getElementById('guestModal');
const historyModal = document.getElementById('historyModal');

// Borrow Confirm
document.getElementById('confirmBorrowBtn').onclick = async () => {
    const name = document.getElementById('borrowerNameInput').value;
    if (name && pendingBookId) {
        await checkoutBook(pendingBookId, name);
        borrowModal.style.display = 'none';
        await fetchBooks();
        renderBooks();
        updateStats();
        pendingBookId = null;
    }
};

// History View
window.viewHistory = async (id) => {
    const data = await fetchBookHistory(id);
    if (data) {
        document.getElementById('modalBookTitle').textContent = data.title;
        document.getElementById('modalBookAuthor').textContent = data.author;
        const list = document.getElementById('modalHistoryList');
        list.innerHTML = data.history.map((h, i) => `
            <div class="history-item">
                <div class="history-number">#${data.history.length - i}</div>
                <div class="history-details">
                    <div><strong>Borrower:</strong> ${h.borrower}</div>
                    <div><strong>Date:</strong> ${h.checkoutDate}</div>
                </div>
            </div>`).join('') || '<p>No history</p>';
        historyModal.style.display = 'flex';
    }
};

// Close Modals
const closeModals = () => {
    borrowModal.style.display = 'none';
    guestModal.style.display = 'none';
    historyModal.style.display = 'none';
    pendingBookId = null;
};

// Close buttons
document.getElementById('cancelBorrowBtn').onclick = closeModals;
document.getElementById('closeBorrowModal').onclick = closeModals;
document.getElementById('closeGuestModal').onclick = closeModals;
document.querySelector('.close-modal').onclick = closeModals;

window.onclick = (e) => {
    if ([borrowModal, guestModal, historyModal].includes(e.target)) closeModals();
};

// Notification Toast
function showNotification(msg, type) {
    const n = document.createElement('div');
    n.className = `notification notification-${type}`;
    n.innerText = msg;
    n.style.cssText = `position:fixed;top:20px;right:20px;padding:15px;background:${type==='success'?'#10b981':'#ef4444'};color:#fff;border-radius:8px;z-index:9999;`;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 3000);
}

// Theme
function setupTheme() {
    const toggle = document.getElementById('themeToggle');
    if(localStorage.getItem('theme')==='light') document.body.classList.add('light-mode');
    toggle.onclick = () => {
        document.body.classList.toggle('light-mode');
        localStorage.setItem('theme', document.body.classList.contains('light-mode')?'light':'dark');
    };
}

// Start
initAuth();
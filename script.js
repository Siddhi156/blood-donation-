// --- Helper Functions ---
function getElement(id) {
    return document.getElementById(id);
}

function showElement(el) {
    if (el) {
        el.style.display = 'block';
        el.style.visibility = 'visible'; // Ensure visibility
    }
}

function hideElement(el) {
    if (el) {
        el.style.display = 'none';
        el.style.visibility = 'hidden'; // Ensure hidden
    }
}

function showPage(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        if (page.id === pageId) {
            page.classList.add('active');
        } else {
            page.classList.remove('active');
        }
    });

    // Handle body overflow for dashboard stability
    if (pageId === 'dashboard-page') {
        document.body.style.overflow = 'hidden'; // Prevents body scroll
        const dashboardContent = getElement('dashboard-page').querySelector('.dashboard-content');
        if (dashboardContent) {
            dashboardContent.style.overflowY = 'auto'; // Allows dashboard content to scroll
        }
    } else {
        document.body.style.overflow = 'hidden'; // Ensure login/signup pages are also stable
    }
}

function showToast(message, type = 'info', duration = 3000) {
    const toast = getElement('notification-toast');
    if (toast) {
        toast.textContent = message;
        toast.className = `notification-toast show ${type}`; // Reset classes and add new ones
        setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    }
}

// --- Data Storage (Simulated Backend with localStorage) ---
// This is where your 'users' data comes from, stored in localStorage
let users = JSON.parse(localStorage.getItem('bloodLinkUsers')) || []; // Changed {} to [] to be consistent with push
let bloodRequests = JSON.parse(localStorage.getItem('bloodLinkRequests')) || [];
let bloodCamps = JSON.parse(localStorage.getItem('bloodLinkCamps')) || [];

function saveUsers() {
    localStorage.setItem('bloodLinkUsers', JSON.stringify(users));
}

function saveBloodRequests() {
    localStorage.setItem('bloodLinkRequests', JSON.stringify(bloodRequests));
}

function saveBloodCamps() {
    localStorage.setItem('bloodLinkCamps', JSON.stringify(bloodCamps));
}

// Define the "fixed" users for doctor and camp_owner directly in the script
// This array will be used in the login logic
const fixedUsers = [
    { username: 'doctor@example.com', password: 'doctor123', type: 'doctor', name: 'Dr. John Doe' },
    { username: 'campowner@example.com', password: 'camp123', type: 'camp_owner', name: 'Blood Drive Org' }
];


// --- Core Logic ---
let currentUser = null; // Stores current logged-in user's data

function updateDashboardUI(userRole) {
    // Hide all role-specific elements first
    document.querySelectorAll('.doctor-only').forEach(el => hideElement(el));
    document.querySelectorAll('.camp-owner-only').forEach(el => hideElement(el));
    document.querySelectorAll('.customer-only').forEach(el => hideElement(el));

    // Show elements based on the logged-in user's role
    switch (userRole) {
        case 'doctor':
            document.querySelectorAll('.doctor-only').forEach(el => showElement(el));
            break;
        case 'camp_owner':
            document.querySelectorAll('.camp-owner-only').forEach(el => showElement(el));
            break;
        case 'customer':
            document.querySelectorAll('.customer-only').forEach(el => showElement(el));
            break;
    }

    // Update user info in navbar and sidebar
    const usernameDisplay = getElement('welcome-user');
    const sidebarUsername = getElement('sidebar-username');
    const sidebarUserRole = getElement('sidebar-user-role');

    if (currentUser) {
        usernameDisplay.textContent = `Welcome, ${currentUser.name || currentUser.username}!`;
        sidebarUsername.textContent = currentUser.name || currentUser.username;
        sidebarUserRole.textContent = `Role: ${currentUser.type.replace('_', ' ').charAt(0).toUpperCase() + currentUser.type.replace('_', ' ').slice(1)}`; // Use currentUser.type
    } else {
        usernameDisplay.textContent = 'Welcome, User!';
        sidebarUsername.textContent = 'Guest User';
        sidebarUserRole.textContent = 'Role: Unknown';
    }

    // Update dashboard overview stats (mock data for now, can be dynamic)
    getElement('total-users').textContent = Object.keys(users).length;
    getElement('active-camps').textContent = bloodCamps.length;
    getElement('urgent-requests').textContent = bloodRequests.filter(req => req.urgency === 'critical').length + ' Critical';
    getElement('lives-impacted').textContent = Math.floor(Math.random() * 10000) + 40000; // Random large number
    populateSystemLogs(); // Refresh logs
}

function populateSystemLogs() {
    const logList = getElement('system-logs');
    logList.innerHTML = ''; // Clear previous logs
    if (logList) {
        if (bloodRequests.length === 0 && bloodCamps.length === 0 && users.length === 0) { // Changed Object.keys(users).length to users.length
            logList.innerHTML = '<li class="no-data-message">No recent activity.</li>';
        } else {
            const logs = [];
            // Assuming 'users' now holds all user types, including fixed ones if you decide to store them
            // If you keep 'fixedUsers' separate, only iterate over 'users' which are customers
            users.forEach(user => logs.push(`[${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}] New User '${user.name || user.username}' registered as ${user.type}.`)); // Changed user.role to user.type
            bloodRequests.forEach(req => logs.push(`[${new Date(req.timestamp).toLocaleDateString()} ${new Date(req.timestamp).toLocaleTimeString()}] Urgent ${req.bloodGroup} requirement posted by '${req.contactPerson}' at ${req.hospitalName}.`));
            bloodCamps.forEach(camp => logs.push(`[${new Date(camp.timestamp).toLocaleDateString()} ${new Date(camp.timestamp).toLocaleTimeString()}] New Blood Camp '${camp.campName}' registered by ${camp.organizer}.`));

            logs.sort((a, b) => new Date(b.substring(1, 20)) - new Date(a.substring(1, 20))); // Sort by timestamp
            logs.slice(0, 5).forEach(log => { // Show last 5 logs
                const li = document.createElement('li');
                li.innerHTML = `<span class="timestamp">${log.substring(0, 21)}</span>${log.substring(21)}`;
                logList.appendChild(li);
            });
        }
    }
}

function populateDoctorUrgentRequests() {
    const list = getElement('doctor-urgent-requests');
    if (list) {
        list.innerHTML = ''; // Clear previous requests
        const doctorRequests = bloodRequests.filter(req => req.postedBy === currentUser.username);

        if (doctorRequests.length === 0) {
            list.innerHTML = '<p class="no-data-message">No urgent blood requests posted by you yet. Post one now!</p>';
        } else {
            doctorRequests.forEach(req => {
                const requestCard = document.createElement('div');
                requestCard.classList.add('request-card');
                requestCard.classList.add(req.urgency); // Adds critical, high, medium class
                requestCard.innerHTML = `
                    <h4>${req.hospitalName} - ${req.bloodGroup} (${req.unitsRequired} Units)</h4>
                    <p>Patient: ${req.patientDetails || 'N/A'}</p>
                    <p>Contact: <strong>${req.contactPerson} (${req.contactNumber})</strong></p>
                    <p>Urgency: <span class="tag">${req.urgency.charAt(0).toUpperCase() + req.urgency.slice(1)}</span></p>
                    <p class="timestamp">Posted: ${new Date(req.timestamp).toLocaleString()}</p>
                `;
                list.appendChild(requestCard);
            });
        }
    }
}

function populateCampOwnerCamps() {
    const list = getElement('camp-owner-camps');
    if (list) {
        list.innerHTML = ''; // Clear previous camps
        const ownerCamps = bloodCamps.filter(camp => camp.registeredBy === currentUser.username);

        if (ownerCamps.length === 0) {
            list.innerHTML = '<p class="no-data-message">No blood donation camps registered by you yet. Add one!</p>';
        } else {
            ownerCamps.forEach(camp => {
                const campCard = document.createElement('div');
                campCard.classList.add('camp-card');
                campCard.innerHTML = `
                    <h4>${camp.campName}</h4>
                    <p>Organizer: <strong>${camp.organizer}</strong></p>
                    <p>Date & Time: <strong>${new Date(camp.campDate + 'T' + camp.campTime).toLocaleString()}</strong></p>
                    <p>Location: ${camp.campLocation}</p>
                    <p>Contact: ${camp.campContact}</p>
                    <p>${camp.description || 'No description provided.'}</p>
                    <p class="timestamp">Registered: ${new Date(camp.timestamp).toLocaleString()}</p>
                `;
                list.appendChild(campCard);
            });
        }
    }
}

function populateCustomerBloodCamps() {
    const list = getElement('customer-blood-camps');
    if (list) {
        list.innerHTML = ''; // Clear previous camps
        if (bloodCamps.length === 0) {
            list.innerHTML = '<p class="no-data-message">No upcoming blood donation camps found.</p>';
        } else {
            bloodCamps.forEach(camp => {
                const campCard = document.createElement('div');
                campCard.classList.add('camp-card');
                campCard.innerHTML = `
                    <h4>${camp.campName}</h4>
                    <p>Organizer: <strong>${camp.organizer}</strong></p>
                    <p>Date & Time: <strong>${new Date(camp.campDate + 'T' + camp.campTime).toLocaleString()}</strong></p>
                    <p>Location: ${camp.campLocation}</p>
                    <p>Contact: ${camp.campContact}</p>
                    <p>${camp.description || 'No description provided.'}</p>
                    <button class="btn primary-btn btn-small" onclick="showToast('Thank you for your interest! In a real app, you would sign up here.', 'info')">Express Interest</button>
                `;
                list.appendChild(campCard);
            });
        }
    }
}

function populateCustomerBloodRequests() {
    const list = getElement('customer-blood-requests');
    if (list) {
        list.innerHTML = ''; // Clear previous requests
        const bloodGroupFilter = getElement('request-blood-group-filter').value;
        const filteredRequests = bloodRequests.filter(req =>
            bloodGroupFilter === 'all' || req.bloodGroup === bloodGroupFilter
        );

        if (filteredRequests.length === 0) {
            list.innerHTML = '<p class="no-data-message">No urgent blood requirements currently active.</p>';
        } else {
            filteredRequests.forEach(req => {
                const requestCard = document.createElement('div');
                requestCard.classList.add('request-card');
                requestCard.classList.add(req.urgency);
                requestCard.innerHTML = `
                    <h4>${req.hospitalName} - ${req.bloodGroup} (${req.unitsRequired} Units)</h4>
                    <p>Patient: ${req.patientDetails || 'N/A'}</p>
                    <p>Contact: <strong>${req.contactPerson} (${req.contactNumber})</strong></p>
                    <p>Urgency: <span class="tag">${req.urgency.charAt(0).toUpperCase() + req.urgency.slice(1)}</span></p>
                    <p class="timestamp">Posted: ${new Date(req.timestamp).toLocaleString()}</p>
                    <button class="btn success-btn btn-small" onclick="showToast('Thank you for offering help! In a real app, you would contact the hospital.', 'success')">I Can Help</button>
                `;
                list.appendChild(requestCard);
            });
        }
    }
}


// --- Main DOM Content Loaded Listener ---
document.addEventListener('DOMContentLoaded', () => {
    const preloader = getElement('preloader');
    const loginForm = getElement('login-form');
    const signupForm = getElement('signup-form');
    const showSignupLink = getElement('show-signup');
    const showLoginLink = getElement('show-login');
    const logoutBtn = getElement('logout-btn');
    const sidebarLogoutBtn = getElement('sidebar-logout-btn');

    const openBloodRequestModalBtn = getElement('open-blood-request-modal');
    const bloodRequestModal = getElement('blood-request-modal');
    const postBloodRequestForm = getElement('post-blood-request-form');
    const closeBloodRequestModalBtn = bloodRequestModal ? bloodRequestModal.querySelector('.close-button') : null;

    const openCampModalBtn = getElement('open-camp-modal');
    const campModal = getElement('camp-modal');
    const registerCampForm = getElement('register-camp-form');
    const closeCampModalBtn = campModal ? campModal.querySelector('.close-button') : null;

    const userTypeRadios = document.querySelectorAll('input[name="user_type"]');
    const customerOnlyFooter = getElement('login-page').querySelector('.customer-only-footer');
    const doctorCampOwnerInfo = getElement('login-page').querySelector('.doctor-camp-owner-info');

    // --- Preloader Fade Out ---
    setTimeout(() => {
        preloader.classList.add('hidden');
    }, 1500); // Preloader displays for 1.5 seconds

    // --- Handle Login Type Display on Radio Button Change ---
    userTypeRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.value === 'customer') {
                showElement(customerOnlyFooter);
                hideElement(doctorCampOwnerInfo);
            } else {
                hideElement(customerOnlyFooter);
                showElement(doctorCampOwnerInfo);
            }
        });
    });
    // Initialize based on default checked radio (doctor)
    hideElement(customerOnlyFooter);
    showElement(doctorCampOwnerInfo);


    // --- Login Form Submission ---
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = getElement('username').value.trim();
            const password = getElement('password').value.trim();
            const userType = document.querySelector('input[name="user_type"]:checked').value;

            // Simulated Login Logic
            let isAuthenticated = false;
            let foundUser = null;

            if (userType === 'doctor' || userType === 'camp_owner') {
                // Check against the 'fixedUsers' array for these roles
                const fixedLoginUser = fixedUsers.find(u => u.username === username && u.password === password && u.type === userType);
                if (fixedLoginUser) {
                    isAuthenticated = true;
                    foundUser = fixedLoginUser;
                }
            } else if (userType === 'customer') {
                // Check against registered users from localStorage
                const registeredUser = users.find(u => u.username === username && u.password === password && u.type === 'customer'); // Changed u.role to u.type
                if (registeredUser) {
                    isAuthenticated = true;
                    foundUser = registeredUser;
                }
            }

            if (isAuthenticated) {
                showToast('Logged in successfully!', 'success');
                currentUser = foundUser;
                updateDashboardUI(currentUser.type); // Use currentUser.type here
                showPage('dashboard-page'); // Show the dashboard
                // Set the default active link for the dashboard based on role
                const defaultLink = document.querySelector(`.sidebar-nav .sidebar-link[data-target="dashboard-home"]`);
                if (defaultLink) {
                    document.querySelectorAll('.sidebar-link').forEach(link => link.classList.remove('active'));
                    defaultLink.classList.add('active');
                }
                // Populate specific sections after login
                if (currentUser.type === 'doctor') { // Use currentUser.type here
                    populateDoctorUrgentRequests();
                } else if (currentUser.type === 'camp_owner') { // Use currentUser.type here
                    populateCampOwnerCamps();
                } else if (currentUser.type === 'customer') { // Use currentUser.type here
                    populateCustomerBloodCamps();
                    populateCustomerBloodRequests();
                }
            } else {
                showToast('Invalid credentials. Please try again.', 'error');
            }
        });
    }

    // --- Signup Form Submission (Only for Donor/Recipient) ---
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = getElement('signup-name').value.trim();
            const email = getElement('signup-email').value.trim();
            const password = getElement('signup-password').value.trim();
            const confirmPassword = getElement('signup-confirm-password').value.trim();
            const phone = getElement('signup-phone').value.trim();
            const bloodGroup = getElement('signup-blood-group').value;

            if (password !== confirmPassword) {
                showToast('Passwords do not match.', 'error');
                return;
            }
            if (password.length < 6) {
                showToast('Password must be at least 6 characters.', 'error');
                return;
            }
            if (users.some(u => u.username === email && u.type === 'customer')) { // Changed u.role to u.type
                showToast('Email already registered. Please login or use a different email.', 'error');
                return;
            }

            const newUser = {
                username: email,
                password: password,
                name: name,
                phone: phone,
                bloodGroup: bloodGroup,
                type: 'customer' // Changed role to type for consistency
            };
            users.push(newUser);
            saveUsers();
            showToast('Registration successful! Please login.', 'success');
            signupForm.reset();
            showPage('login-page');
        });
    }

    // --- Page Navigation (Login/Signup/Dashboard Sections) ---
    if (showSignupLink) {
        showSignupLink.addEventListener('click', (e) => {
            e.preventDefault();
            showPage('signup-page');
        });
    }
    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            showPage('login-page');
        });
    }

    document.querySelectorAll('.nav-link, .sidebar-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.dataset.target;
            if (targetId) {
                document.querySelectorAll('.dashboard-section').forEach(section => {
                    section.classList.remove('active');
                });
                const targetSection = getElement(targetId);
                if (targetSection) {
                    targetSection.classList.add('active');
                }

                // Update active class for nav/sidebar links
                document.querySelectorAll('.nav-link, .sidebar-link').forEach(nav => nav.classList.remove('active'));
                link.classList.add('active');

                // Re-populate data when section is visited
                if (targetId === 'doctor-notifications') populateDoctorUrgentRequests();
                if (targetId === 'camp-management') populateCampOwnerCamps();
                if (targetId === 'blood-camps') populateCustomerBloodCamps();
                if (targetId === 'blood-requests') populateCustomerBloodRequests();
            }
        });
    });

    // --- Logout Functionality ---
    const handleLogout = (e) => {
        e.preventDefault();
        currentUser = null;
        showToast('Logged out successfully.', 'info');
        showPage('login-page');
        // Reset login form
        if (loginForm) loginForm.reset();
        // Reset radio button state for login form
        getElement('doctor').checked = true;
        hideElement(customerOnlyFooter);
        showElement(doctorCampOwnerInfo);

        // Ensure overflow is reset on body for consistent behavior
        document.body.style.overflow = 'hidden';
    };

    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (sidebarLogoutBtn) sidebarLogoutBtn.addEventListener('click', handleLogout);


    // --- Blood Request Modal Logic (Doctor Role) ---
    if (openBloodRequestModalBtn) {
        openBloodRequestModalBtn.addEventListener('click', () => {
            if (bloodRequestModal) bloodRequestModal.classList.add('active');
        });
    }
    if (closeBloodRequestModalBtn) {
        closeBloodRequestModalBtn.addEventListener('click', () => {
            if (bloodRequestModal) bloodRequestModal.classList.remove('active');
        });
    }
    // Close modal if click outside
    if (bloodRequestModal) {
        window.addEventListener('click', (event) => {
            if (event.target === bloodRequestModal) {
                bloodRequestModal.classList.remove('active');
            }
        });
    }

    if (postBloodRequestForm) {
        postBloodRequestForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newRequest = {
                id: Date.now(), // Unique ID
                hospitalName: getElement('hospital-name').value.trim(),
                patientDetails: getElement('patient-details').value.trim(),
                bloodGroup: getElement('blood-group').value,
                unitsRequired: parseInt(getElement('units-required').value),
                contactPerson: getElement('contact-person').value.trim(),
                contactNumber: getElement('contact-number').value.trim(),
                urgency: getElement('urgency-level').value,
                postedBy: currentUser.username, // Associate request with the doctor
                timestamp: new Date().toISOString()
            };

            bloodRequests.unshift(newRequest); // Add to the beginning
            saveBloodRequests();
            postBloodRequestForm.reset();
            showToast('Blood requirement posted successfully!', 'success');
            if (bloodRequestModal) bloodRequestModal.classList.remove('active');
            populateDoctorUrgentRequests(); // Update doctor's own requests
            populateCustomerBloodRequests(); // Update customer's view
            populateSystemLogs(); // Update system logs
        });
    }

    // --- Camp Modal Logic (Camp Owner Role) ---
    if (openCampModalBtn) {
        openCampModalBtn.addEventListener('click', () => {
            if (campModal) campModal.classList.add('active');
        });
    }
    if (closeCampModalBtn) {
        closeCampModalBtn.addEventListener('click', () => {
            if (campModal) campModal.classList.remove('active');
        }
        );
    }
    // Close modal if click outside
    if (campModal) {
        window.addEventListener('click', (event) => {
            if (event.target === campModal) {
                campModal.classList.remove('active');
            }
        });
    }

    if (registerCampForm) {
        registerCampForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newCamp = {
                id: Date.now(),
                campName: getElement('camp-name').value.trim(),
                organizer: getElement('camp-organizer').value.trim(),
                campDate: getElement('camp-date').value,
                campTime: getElement('camp-time').value,
                campLocation: getElement('camp-location').value.trim(),
                campContact: getElement('camp-contact').value.trim(),
                description: getElement('camp-description').value.trim(),
                registeredBy: currentUser.username, // Associate camp with the owner
                timestamp: new Date().toISOString()
            };

            bloodCamps.unshift(newCamp); // Add to the beginning
            saveBloodCamps();
            registerCampForm.reset();
            showToast('Blood camp registered successfully!', 'success');
            if (campModal) campModal.classList.remove('active');
            populateCampOwnerCamps(); // Update camp owner's own camps
            populateCustomerBloodCamps(); // Update customer's view
            populateSystemLogs(); // Update system logs
        });
    }

    // Filter for customer blood requests
    const requestBloodGroupFilter = getElement('request-blood-group-filter');
    if (requestBloodGroupFilter) {
        requestBloodGroupFilter.addEventListener('change', populateCustomerBloodRequests);
    }
});
// Sample data
let notes = [
    { id: 1, title: "Math Homework", content: "Complete calculus exercises on page 45-48", category: "school", date: "2023-10-15" },
    { id: 2, title: "Grocery List", content: "Milk, eggs, bread, fruits, vegetables", category: "personal", date: "2023-10-14" },
    { id: 3, title: "Project Meeting", content: "Prepare presentation slides for the group project", category: "school", date: "2023-10-16" }
];

let reminders = [
    { id: 1, title: "Submit Assignment", date: "2023-10-18T10:00", category: "school", completed: false },
    { id: 2, title: "Dentist Appointment", date: "2023-10-20T14:30", category: "personal", completed: false },
    { id: 3, title: "Study for Exam", date: "2023-10-22T09:00", category: "school", completed: true }
];

let notifications = [
    { id: 1, message: "Reminder: Submit Assignment due tomorrow", date: "2023-10-17", read: false },
    { id: 2, message: "New note added: Math Homework", date: "2023-10-15", read: true }
];

let currentFilter = "all";
let editingNoteId = null;
let editingReminderId = null;

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const noteForm = document.getElementById('noteForm');
    const reminderForm = document.getElementById('reminderForm');
    const notesList = document.getElementById('notesList');
    const remindersList = document.getElementById('remindersList');
    const notificationToggle = document.getElementById('notificationToggle');
    const clearNotificationsBtn = document.getElementById('clearNotifications');
    
    // Initialize the app
    initApp();
    
    // Initialize event listeners
    if (noteForm) {
        noteForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleNoteSubmit();
        });
    }
    
    if (reminderForm) {
        reminderForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleReminderSubmit();
        });
    }
    
    if (notificationToggle) {
        notificationToggle.addEventListener('click', toggleNotificationPanel);
    }
    
    if (clearNotificationsBtn) {
        clearNotificationsBtn.addEventListener('click', clearAllNotifications);
    }
    
    // Category filter event listeners
    document.querySelectorAll('.category-filter').forEach(filter => {
        filter.addEventListener('click', function() {
            setActiveFilter(this.dataset.category);
            document.querySelectorAll('.category-filter').forEach(f => f.classList.remove('active'));
            this.classList.add('active');
            renderNotes();
            renderReminders();
        });
    });
});

// Initialize the app
function initApp() {
    renderNotes();
    renderReminders();
    updateNotificationCount();
    renderNotifications();
    
    // Set default datetime for reminder to next hour
    const now = new Date();
    now.setHours(now.getHours() + 1);
    now.setMinutes(0);
    const dateInput = document.getElementById('reminderDate');
    if (dateInput) {
        dateInput.value = formatDateTimeLocal(now);
    }
    
    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
    }
}

// Handle note form submission
function handleNoteSubmit() {
    const title = document.getElementById('noteTitle').value;
    const content = document.getElementById('noteContent').value;
    const category = document.getElementById('noteCategory').value;
    
    if (editingNoteId) {
        // Update existing note
        const noteIndex = notes.findIndex(note => note.id === editingNoteId);
        if (noteIndex !== -1) {
            notes[noteIndex] = {
                ...notes[noteIndex],
                title,
                content,
                category
            };
        }
        editingNoteId = null;
        document.querySelector('#noteForm button[type="submit"]').innerHTML = '<i class="fas fa-save"></i> Save Note';
    } else {
        // Add new note
        const newNote = {
            id: Date.now(),
            title,
            content,
            category,
            date: new Date().toISOString().split('T')[0]
        };
        notes.unshift(newNote);
        addNotification(`New note added: ${title}`);
    }
    
    // Reset form
    document.getElementById('noteForm').reset();
    renderNotes();
    updateNotificationCount();
    renderNotifications();
}

// Handle reminder form submission
function handleReminderSubmit() {
    const title = document.getElementById('reminderTitle').value;
    const date = document.getElementById('reminderDate').value;
    const category = document.getElementById('reminderCategory').value;
    
    if (editingReminderId) {
        // Update existing reminder
        const reminderIndex = reminders.findIndex(reminder => reminder.id === editingReminderId);
        if (reminderIndex !== -1) {
            reminders[reminderIndex] = {
                ...reminders[reminderIndex],
                title,
                date,
                category
            };
        }
        editingReminderId = null;
        document.querySelector('#reminderForm button[type="submit"]').innerHTML = '<i class="fas fa-bell"></i> Set Reminder';
    } else {
        // Add new reminder
        const newReminder = {
            id: Date.now(),
            title,
            date,
            category,
            completed: false
        };
        reminders.unshift(newReminder);
        addNotification(`New reminder set: ${title}`);
    }
    
    // Reset form
    document.getElementById('reminderForm').reset();
    
    // Set default datetime for reminder to next hour
    const now = new Date();
    now.setHours(now.getHours() + 1);
    now.setMinutes(0);
    document.getElementById('reminderDate').value = formatDateTimeLocal(now);
    
    renderReminders();
    updateNotificationCount();
    renderNotifications();
    checkUpcomingReminders();
}

// Set active filter
function setActiveFilter(category) {
    currentFilter = category;
}

// Toggle notification panel
function toggleNotificationPanel() {
    const panel = document.getElementById('notificationPanel');
    if (panel.style.display === 'block') {
        panel.style.display = 'none';
    } else {
        panel.style.display = 'block';
        // Mark all notifications as read when opening
        notifications.forEach(notification => notification.read = true);
        updateNotificationCount();
    }
}

// Clear all notifications
function clearAllNotifications() {
    notifications = [];
    renderNotifications();
    updateNotificationCount();
}

// Render notes
function renderNotes() {
    const notesList = document.getElementById('notesList');
    const emptyNotes = document.getElementById('emptyNotes');
    
    // Filter notes
    let filteredNotes = notes;
    if (currentFilter !== 'all') {
        filteredNotes = notes.filter(note => note.category === currentFilter);
    }
    
    if (!filteredNotes.length) {
        emptyNotes.classList.remove('hidden');
        notesList.innerHTML = '';
        notesList.appendChild(emptyNotes);
        return;
    }
    
    emptyNotes.classList.add('hidden');
    notesList.innerHTML = '';
    
    filteredNotes.forEach(note => {
        const noteElement = document.createElement('div');
        noteElement.className = 'note-item';
        noteElement.dataset.id = note.id;
        
        noteElement.innerHTML = `
            <div class="note-header">
                <div>
                    <span class="note-title">${note.title}</span>
                    <span class="note-category category-${note.category}">${note.category.charAt(0).toUpperCase() + note.category.slice(1)}</span>
                </div>
                <div class="note-actions">
                    <button class="action-btn btn-secondary edit-note" title="Edit Note">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn btn-warning delete-note" title="Delete Note">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="note-content">${note.content}</div>
            <div class="note-date"><i class="far fa-calendar"></i> Added on ${formatDate(note.date)}</div>
        `;
        
        notesList.appendChild(noteElement);
    });
    
    // Add event listeners for buttons
    notesList.querySelectorAll('.edit-note').forEach(button => {
        button.addEventListener('click', function() {
            const noteId = parseInt(this.closest('.note-item').dataset.id);
            editNote(noteId);
        });
    });
    
    notesList.querySelectorAll('.delete-note').forEach(button => {
        button.addEventListener('click', function() {
            const noteId = parseInt(this.closest('.note-item').dataset.id);
            deleteNote(noteId);
        });
    });
}

// Render reminders
function renderReminders() {
    const remindersList = document.getElementById('remindersList');
    const emptyReminders = document.getElementById('emptyReminders');
    
    // Filter reminders
    let filteredReminders = reminders;
    if (currentFilter !== 'all') {
        filteredReminders = reminders.filter(reminder => reminder.category === currentFilter);
    }
    
    if (!filteredReminders.length) {
        emptyReminders.classList.remove('hidden');
        remindersList.innerHTML = '';
        remindersList.appendChild(emptyReminders);
        return;
    }
    
    emptyReminders.classList.add('hidden');
    remindersList.innerHTML = '';
    
    filteredReminders.forEach(reminder => {
        const reminderElement = document.createElement('div');
        reminderElement.className = `reminder-item ${reminder.completed ? 'completed' : ''}`;
        reminderElement.dataset.id = reminder.id;
        
        const reminderDate = new Date(reminder.date);
        const formattedDate = formatDateTime(reminderDate);
        
        reminderElement.innerHTML = `
            <div class="reminder-header">
                <div>
                    <span class="reminder-title">${reminder.title}</span>
                    <span class="reminder-category category-${reminder.category}">${reminder.category.charAt(0).toUpperCase() + reminder.category.slice(1)}</span>
                </div>
                <div class="reminder-actions">
                    <button class="action-btn ${reminder.completed ? 'btn-secondary' : 'btn-success'} toggle-reminder" title="${reminder.completed ? 'Mark as Incomplete' : 'Mark as Complete'}">
                        <i class="fas ${reminder.completed ? 'fa-undo' : 'fa-check'}"></i>
                    </button>
                    <button class="action-btn btn-secondary edit-reminder" title="Edit Reminder">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn btn-warning delete-reminder" title="Delete Reminder">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="reminder-date">
                <i class="far fa-clock"></i> ${formattedDate}
            </div>
        `;
        
        remindersList.appendChild(reminderElement);
    });
    
    // Add event listeners for buttons
    remindersList.querySelectorAll('.toggle-reminder').forEach(button => {
        button.addEventListener('click', function() {
            const reminderId = parseInt(this.closest('.reminder-item').dataset.id);
            toggleReminderCompletion(reminderId);
        });
    });
    
    remindersList.querySelectorAll('.edit-reminder').forEach(button => {
        button.addEventListener('click', function() {
            const reminderId = parseInt(this.closest('.reminder-item').dataset.id);
            editReminder(reminderId);
        });
    });
    
    remindersList.querySelectorAll('.delete-reminder').forEach(button => {
        button.addEventListener('click', function() {
            const reminderId = parseInt(this.closest('.reminder-item').dataset.id);
            deleteReminder(reminderId);
        });
    });
}

// Render notifications
function renderNotifications() {
    const notificationList = document.getElementById('notificationList');
    
    if (!notifications.length) {
        notificationList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-bell-slash"></i>
                <p>No notifications yet.</p>
            </div>
        `;
        return;
    }
    
    notificationList.innerHTML = '';
    
    // Show newest first
    notifications.slice().reverse().forEach(notification => {
        const notificationElement = document.createElement('div');
        notificationElement.className = 'notification-item';
        
        notificationElement.innerHTML = `
            <i class="fas fa-bell ${notification.read ? '' : 'unread'}"></i>
            <div>
                <p>${notification.message}</p>
                <small>${formatDate(notification.date)}</small>
            </div>
        `;
        
        notificationList.appendChild(notificationElement);
    });
}

// Update notification count
function updateNotificationCount() {
    const unreadCount = notifications.filter(n => !n.read).length;
    const badge = document.getElementById('notificationCount');
    if (badge) {
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
}

// Add notification
function addNotification(message) {
    const newNotification = {
        id: Date.now(),
        message,
        date: new Date().toISOString().split('T')[0],
        read: false
    };
    
    notifications.push(newNotification);
    updateNotificationCount();
    
    // Browser notification
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Student Notes App", {
            body: message
        });
    }
}

// Edit note
function editNote(id) {
    const note = notes.find(note => note.id === id);
    if (!note) return;
    
    document.getElementById('noteTitle').value = note.title;
    document.getElementById('noteContent').value = note.content;
    document.getElementById('noteCategory').value = note.category;
    
    editingNoteId = id;
    document.querySelector('#noteForm button[type="submit"]').innerHTML = '<i class="fas fa-edit"></i> Update Note';
    
    // Scroll to form
    document.querySelector('.left-panel').scrollIntoView({ behavior: 'smooth' });
}

// Delete note
function deleteNote(id) {
    if (confirm("Are you sure you want to delete this note?")) {
        notes = notes.filter(note => note.id !== id);
        renderNotes();
        addNotification("Note deleted");
    }
}

// Edit reminder
function editReminder(id) {
    const reminder = reminders.find(reminder => reminder.id === id);
    if (!reminder) return;
    
    document.getElementById('reminderTitle').value = reminder.title;
    document.getElementById('reminderDate').value = formatDateTimeLocal(new Date(reminder.date));
    document.getElementById('reminderCategory').value = reminder.category;
    
    editingReminderId = id;
    document.querySelector('#reminderForm button[type="submit"]').innerHTML = '<i class="fas fa-edit"></i> Update Reminder';
    
    // Scroll to form
    document.querySelector('.left-panel').scrollIntoView({ behavior: 'smooth' });
}

// Delete reminder
function deleteReminder(id) {
    if (confirm("Are you sure you want to delete this reminder?")) {
        reminders = reminders.filter(reminder => reminder.id !== id);
        renderReminders();
        addNotification("Reminder deleted");
    }
}

// Toggle reminder completion
function toggleReminderCompletion(id) {
    const index = reminders.findIndex(reminder => reminder.id === id);
    if (index === -1) return;
    
    reminders[index].completed = !reminders[index].completed;
    renderReminders();
    
    const action = reminders[index].completed ? "completed" : "marked as incomplete";
    addNotification(`Reminder "${reminders[index].title}" ${action}`);
}

// Check upcoming reminders
function checkUpcomingReminders() {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    
    reminders.forEach(reminder => {
        if (reminder.completed) return;
        
        const reminderDate = new Date(reminder.date);
        if (reminderDate > now && reminderDate <= oneHourFromNow) {
            const existingNotification = notifications.find(n => 
                n.message.includes(reminder.title) && n.message.includes("upcoming")
            );
            
            if (!existingNotification) {
                addNotification(`Upcoming reminder: "${reminder.title}" in less than an hour`);
            }
        }
    });
}

// Format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Format date time
function formatDateTime(date) {
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('en-US', options);
}

// Format date time local
function formatDateTimeLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Start checking for upcoming reminders
setInterval(checkUpcomingReminders, 60000);
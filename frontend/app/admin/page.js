"use strict";

document.addEventListener("DOMContentLoaded", function () {
    // Admin dashboard HTML
    const adminHTML = `
        <div style="padding: 20px; max-width: 1200px; margin: 0 auto;">
            <h1>Admin Dashboard - User Management</h1>
            
            <!-- Create User Section -->
            <div style="background: #f5f5f5; padding: 20px; margin-bottom: 20px; border-radius: 8px;">
                <h2>Create New User</h2>
                <div style="margin-bottom: 10px;">
                    <label>Select Role: </label>
                    <select id="roleSelect" style="padding: 5px; margin: 0 10px;">
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                        <option value="admin">Admin</option>
                    </select>
                    <button id="createUserBtn" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Generate Random User Account
                    </button>
                </div>
                <div id="userResult" style="margin-top: 10px;"></div>
            </div>
            
            <!-- Users List -->
            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2>User Management</h2>
                <div id="usersList"></div>
            </div>
            
            <button onclick="logout()" style="margin-top: 20px; padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">Logout</button>
        </div>
    `;
    
    document.body.innerHTML = adminHTML;
    loadUsers();
    
    // Create User Button
    document.getElementById('createUserBtn').addEventListener('click', createUser);
});

async function loadUsers() {
    try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user || user.role !== 'admin') {
            alert('Admin access required');
            window.location.href = '/login';
            return;
        }

        const res = await fetch('/api/admin/users/');
        if (!res.ok) throw new Error('Failed to load users');
        
        const data = await res.json();
        displayUsers(data.users);
    } catch (error) {
        console.error('Error loading users:', error);
        document.getElementById('usersList').innerHTML = '<p>Error loading users</p>';
    }
}

function displayUsers(users) {
    const usersList = document.getElementById('usersList');
    
    const tableHTML = `
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background: #f8f9fa;">
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">ID</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Username/Email</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Role</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Date Joined</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Actions</th>
                </tr>
            </thead>
            <tbody>
                ${users.map(user => `
                    <tr>
                        <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">${user.id}</td>
                        <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">${user.username}</td>
                        <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">
                            <select class="role-select" data-user-id="${user.id}">
                                <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                                <option value="editor" ${user.role === 'editor' ? 'selected' : ''}>Editor</option>
                                <option value="viewer" ${user.role === 'viewer' ? 'selected' : ''}>Viewer</option>
                            </select>
                        </td>
                        <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">${user.date_joined}</td>
                        <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">
                            <button class="delete-btn" data-user-id="${user.id}" style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">Delete</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    usersList.innerHTML = tableHTML;
    
    // Add event listeners
    document.querySelectorAll('.role-select').forEach(select => {
        select.addEventListener('change', changeRole);
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', deleteUser);
    });
}

async function createUser() {
    try {
        const role = document.getElementById('roleSelect').value;
        const btn = document.getElementById('createUserBtn');
        btn.disabled = true;
        btn.textContent = 'Creating...';
        
        const res = await fetch('/api/admin/users/create/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: role })
        });
        
        const data = await res.json();
        
        if (data.success) {
            document.getElementById('userResult').innerHTML = `
                <div style="background: #d4edda; color: #155724; padding: 10px; border-radius: 4px;">
                    <strong>User created successfully!</strong><br>
                    Username: ${data.user.username}<br>
                    Password: ${data.user.password}<br>
                    Role: ${data.user.role}<br>
                    <em>Save this password - it won't be shown again!</em>
                </div>
            `;
            loadUsers(); // Refresh user list
        } else {
            document.getElementById('userResult').innerHTML = `
                <div style="background: #f8d7da; color: #721c24; padding: 10px; border-radius: 4px;">
                    Error: ${data.error}
                </div>
            `;
        }
    } catch (error) {
        console.error('Error creating user:', error);
        document.getElementById('userResult').innerHTML = `
            <div style="background: #f8d7da; color: #721c24; padding: 10px; border-radius: 4px;">
                Error creating user
            </div>
        `;
    } finally {
        const btn = document.getElementById('createUserBtn');
        btn.disabled = false;
        btn.textContent = 'Generate Random User Account';
    }
}

async function changeRole(event) {
    const userId = event.target.dataset.userId;
    const newRole = event.target.value;
    
    try {
        const res = await fetch(`/api/admin/users/${userId}/change-role/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: newRole })
        });
        
        const data = await res.json();
        
        if (!data.success) {
            alert('Error changing role: ' + data.error);
            loadUsers(); // Reload to reset
        }
    } catch (error) {
        console.error('Error changing role:', error);
        alert('Error changing role');
        loadUsers(); // Reload to reset
    }
}

async function deleteUser(event) {
    const userId = event.target.dataset.userId;
    
    if (!confirm('Are you sure you want to delete this user?')) {
        return;
    }
    
    try {
        const res = await fetch(`/api/admin/users/${userId}/delete/`, {
            method: 'DELETE'
        });
        
        const data = await res.json();
        
        if (data.success) {
            loadUsers(); // Refresh list
        } else {
            alert('Error deleting user: ' + data.error);
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user');
    }
}

function logout() {
    sessionStorage.removeItem('user');
    window.location.href = '/login';
}
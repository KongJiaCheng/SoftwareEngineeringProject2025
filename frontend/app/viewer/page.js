"use strict";

document.addEventListener("DOMContentLoaded", function () {
    const user = JSON.parse(sessionStorage.getItem('user'));
    
    if (!user || user.role !== 'viewer') {
        alert('Viewer access required');
        window.location.href = '/login';
        return;
    }

    document.body.innerHTML = `
        <div style="padding: 20px; max-width: 1200px; margin: 0 auto;">
            <h1>Viewer Dashboard</h1>
            <p>Welcome, ${user.username} (Viewer)</p>
            <p><strong>You can:</strong> View content, Browse files, Search assets (Read-only access)</p>
            <p><strong>You cannot:</strong> Create/edit content, Upload files, Manage users</p>
            
            <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 5px;">
                <h3>Viewer Functions:</h3>
                <button style="margin: 5px; padding: 10px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">Browse Files</button>
                <button style="margin: 5px; padding: 10px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">Search Assets</button>
                <button style="margin: 5px; padding: 10px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">View Reports</button>
            </div>
            
            <button onclick="logout()" style="margin-top: 20px; padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">Logout</button>
        </div>
    `;
});

function logout() {
    sessionStorage.removeItem('user');
    window.location.href = '/login';
}
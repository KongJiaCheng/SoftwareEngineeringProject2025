'use client';
import React, { useEffect, useState } from 'react';

/**
 * Main 3D CMS page – integrates Upload feature with cms.js
 */
export default function MainPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [restrictionsApplied, setRestrictionsApplied] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const userData = JSON.parse(sessionStorage.getItem('user'));
    if (!userData) {
      window.location.href = '/login';
      return;
    }
    
    console.log('🔐 User logged in:', userData);
    setUser(userData);
    
    // Load CMS
    import('@/public/js/cms.js')
      .then((mod) => {
        if (mod?.initCMS) {
          console.log('🚀 Loading CMS for role:', userData.role);
          mod.initCMS(userData.role);
          
          // Apply restrictions after CMS loads
          setTimeout(() => {
            applyRestrictions(userData.role);
          }, 2000);
        } else {
          console.error('initCMS() not found in cms.js');
        }
      })
      .catch((err) => console.error('❌ CMS init failed:', err))
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const logout = () => {
    sessionStorage.removeItem('user');
    window.location.href = '/login';
  };

  // Apply restrictions based on user role
  const applyRestrictions = (userRole) => {
    console.log(`🔒 Starting restrictions for: ${userRole}`);
    
    let restrictionsCount = 0;

    // Function to safely hide elements - only target specific action buttons
    const hideElements = (selectors, reason) => {
      selectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach(element => {
            // Only hide if it's a button or input that matches our criteria
            if (element && 
                (element.tagName === 'BUTTON' || 
                 element.tagName === 'INPUT' || 
                 element.tagName === 'A') &&
                element.style) {
              element.style.display = 'none';
              restrictionsCount++;
              console.log(`🚫 Hiding: ${selector} - ${reason}`);
            }
          });
        } catch (error) {
          console.log(`⚠️ Could not process selector: ${selector}`);
        }
      });
    };

    // Only apply restrictions for viewers
    if (userRole === 'viewer') {
      console.log('👀 Applying viewer restrictions...');
      
      // Target only specific action buttons, not entire containers
      const actionButtons = document.querySelectorAll('button, input[type="button"], input[type="submit"], a.btn, a.button');
      
      actionButtons.forEach(button => {
        const buttonText = button.textContent?.toLowerCase() || '';
        const buttonValue = button.value?.toLowerCase() || '';
        const buttonClass = button.className?.toLowerCase() || '';
        const buttonId = button.id?.toLowerCase() || '';
        
        // Only hide buttons that are clearly upload/edit/delete actions
        if (buttonText.includes('upload') || buttonText.includes('add new') || 
            buttonText.includes('edit') || buttonText.includes('modify') ||
            buttonText.includes('delete') || buttonText.includes('remove') ||
            buttonValue.includes('upload') || buttonValue.includes('edit') ||
            buttonValue.includes('delete') ||
            buttonClass.includes('upload') || buttonClass.includes('edit') ||
            buttonClass.includes('delete') || buttonClass.includes('add') ||
            buttonId.includes('upload') || buttonId.includes('edit') ||
            buttonId.includes('delete') || buttonId.includes('add')) {
          
          button.style.display = 'none';
          restrictionsCount++;
          console.log(`🚫 Hiding button: ${buttonText || buttonValue}`);
        }
      });

      // Hide file input elements specifically
      const fileInputs = document.querySelectorAll('input[type="file"]');
      fileInputs.forEach(input => {
        input.style.display = 'none';
        restrictionsCount++;
        console.log('🚫 Hiding file input');
      });

      // Look for and hide any upload forms or containers
      const uploadContainers = document.querySelectorAll('[class*="upload"], [id*="upload"]');
      uploadContainers.forEach(container => {
        // Only hide if it's a form or div that contains upload functionality
        if (container.tagName === 'FORM' || 
            container.tagName === 'DIV' && 
            (container.className?.toLowerCase().includes('upload') || 
             container.id?.toLowerCase().includes('upload'))) {
          container.style.display = 'none';
          restrictionsCount++;
          console.log('🚫 Hiding upload container');
        }
      });
    }

    // User management restrictions - only for non-admin
    if (userRole !== 'admin') {
      const userManagementButtons = document.querySelectorAll('button, a');
      userManagementButtons.forEach(button => {
        const buttonText = button.textContent?.toLowerCase() || '';
        if (buttonText.includes('user management') || 
            buttonText.includes('manage users') ||
            buttonText.includes('admin panel')) {
          button.style.display = 'none';
          restrictionsCount++;
        }
      });
    }

    console.log(`✅ Applied ${restrictionsCount} restrictions for ${userRole}`);
    setRestrictionsApplied(true);

    // If viewer and no restrictions were applied, try alternative approach
    if (userRole === 'viewer' && restrictionsCount === 0) {
      console.log('🔄 Trying alternative restriction approach...');
      applyAlternativeRestrictions();
    }
  };

  // Alternative approach for viewer restrictions
  const applyAlternativeRestrictions = () => {
    console.log('🔄 Using alternative restriction method...');
    
    // Wait a bit longer for CMS to fully render
    setTimeout(() => {
      const allButtons = document.querySelectorAll('button');
      let hiddenCount = 0;
      
      allButtons.forEach(button => {
        const text = button.textContent?.toLowerCase() || '';
        
        // Only hide very specific action buttons
        if (text === 'upload' || text === 'add' || text === 'edit' || 
            text === 'delete' || text === 'remove' || text === 'add new' ||
            text.includes('upload') || text.includes('edit') || text.includes('delete')) {
          button.style.display = 'none';
          hiddenCount++;
          console.log(`🚫 Hid button: "${text}"`);
        }
      });
      
      console.log(`✅ Alternative method hid ${hiddenCount} buttons`);
    }, 3000);
  };

  if (loading) {
    return (
      <main style={{ padding: '20px', textAlign: 'center', background: '#1a1a1a', minHeight: '100vh', color: 'white' }}>
        <h2 style={{ color: '#aeb8ff' }}>Loading 3D CMS — with Upload</h2>
      </main>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#1a1a1a', color: 'white' }}>
      {/* Header with user info and logout */}
      <header style={{
        background: '#2d2d2d',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #444'
      }}>
        <h1 style={{ margin: 0, color: '#aeb8ff' }}>3D Digital Asset Manager</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: 'white' }}>
            Welcome, <strong>{user?.username}</strong> 
            <span style={{ 
              padding: '0.25rem 0.5rem', 
              background: user?.role === 'admin' ? '#dc3545' : 
                         user?.role === 'editor' ? '#28a745' : '#6c757d',
              borderRadius: '4px',
              fontSize: '0.8rem',
              marginLeft: '0.5rem',
              color: 'white'
            }}>
              {user?.role}
            </span>
          </span>
          <div style={{ fontSize: '0.8rem', color: restrictionsApplied ? '#28a745' : '#ff9800' }}>
            {restrictionsApplied ? '🔒 Restricted' : '⏳ Applying...'}
          </div>
          <button 
            onClick={logout}
            style={{
              padding: '0.5rem 1rem',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* CMS Container - Ensure it has proper styling */}
      <main id="cms-container" style={{ minHeight: 'calc(100vh - 80px)', background: '#1a1a1a' }}>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2 style={{ color: '#aeb8ff' }}>3D CMS — Access Level: {user?.role?.toUpperCase()}</h2>
          <p style={{ color: '#ccc' }}>
            {user?.role === 'admin' && 'Full access: Upload, Edit, Delete, Download, Manage Users'}
            {user?.role === 'editor' && 'Editor access: Upload, Edit, Delete, Download assets'}
            {user?.role === 'viewer' && 'Viewer access: Download only (Read-only mode)'}
          </p>
          {!restrictionsApplied && (
            <p style={{ color: '#ff9800' }}>Applying restrictions...</p>
          )}
        </div>
      </main>
    </div>
  );
}
// app/api/auth/token/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    console.log('Login attempt:', { username, password });

    // For testing - hardcoded users (replace with your database later)
    const users = [
      { username: 'admin', password: 'admin123', role: 'admin', name: 'Administrator' },
      { username: 'editor', password: 'editor123', role: 'editor', name: 'Content Editor' },
      { username: 'viewer', password: 'viewer123', role: 'viewer', name: 'Viewer' },
      { username: 'test', password: 'test123', role: 'viewer', name: 'Test User' },
    ];

    // Find user
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
      // Successful login
      return NextResponse.json({
        success: true,
        user: {
          username: user.username,
          role: user.role,
          name: user.name
        },
        message: 'Login successful'
      });
    } else {
      // Failed login
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid username or password' 
        },
        { status: 401 }
      );
    }

  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
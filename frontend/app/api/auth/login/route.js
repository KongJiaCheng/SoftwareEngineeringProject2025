import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'dam_system',
  password: 'software',
  port: 5432,
});

export async function POST(req) {
  try {
    const { username, password } = await req.json();

    console.log('🔐 Login attempt:', { username, password: '***' });

    if (!username || !password) {
      return Response.json({
        success: false,
        error: 'Username and password are required'
      }, { status: 400 });
    }

    const userResult = await pool.query(
      `SELECT 
         au.id, 
         au.username, 
         au.password, 
         au.email, 
         au.first_name, 
         au.last_name,
         au.is_superuser,
         au.is_staff,
         au.is_active,
         rup.role
       FROM auth_user au
       LEFT JOIN roles_userprofile rup ON au.id = rup.user_id
       WHERE au.username = $1 AND au.is_active = true`,
      [username]
    );

    console.log('📊 User query result:', userResult.rows.length, 'users found');

    if (userResult.rows.length === 0) {
      console.log('❌ User not found in database');
      return Response.json({
        success: false,
        error: 'Invalid username or password'
      }, { status: 401 });
    }

    const user = userResult.rows[0];
    console.log('👤 User found:', {
      username: user.username,
      storedPassword: user.password,
      inputPassword: password,
      passwordsMatch: user.password === password
    });

    // Debug: Check password character by character
    console.log('🔍 Password comparison:');
    console.log('Stored:', user.password.split('').map(c => c.charCodeAt(0)));
    console.log('Input: ', password.split('').map(c => c.charCodeAt(0)));

    // Simple password check
    if (user.password === password) {
      console.log('✅ Password matches!');
      
      // Update last_login
      await pool.query(
        'UPDATE auth_user SET last_login = NOW() WHERE id = $1',
        [user.id]
      );

      const userResponse = {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role || 'user',
        isSuperuser: user.is_superuser,
        isStaff: user.is_staff,
        isActive: user.is_active
      };

      return Response.json({
        success: true,
        user: userResponse
      });
    } else {
      console.log('❌ Password does not match');
      return Response.json({
        success: false,
        error: 'Invalid username or password'
      }, { status: 401 });
    }

  } catch (error) {
    console.error('💥 Database error:', error);
    return Response.json({
      success: false,
      error: 'Internal server error: ' + error.message
    }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import fs from 'fs';
import path from 'path';

// Accepts image or 3D asset uploads (JPG, PNG, GLB, OBJ, FBX, ZIP)
export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') || formData.get('files');

    if (!file) {
      console.error('❌ No file found in request');
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Derive extension to route files to proper subfolders
    const ext = path.extname(file.name).toLowerCase();
    const is3D = ['.glb', '.gltf', '.obj', '.fbx', '.zip'].includes(ext);

    // Base upload directory
    const uploadDir = path.join(
      process.cwd(),
      'public',
      'uploads',
      is3D ? '3d' : 'images'
    );

    // Create the folder if missing
    if (!fs.existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Write file buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(uploadDir, file.name);
    await writeFile(filePath, buffer);

    console.log(`✅ Uploaded ${is3D ? '3D asset' : 'image'}:`, file.name);

    return NextResponse.json({
      ok: true,
      type: is3D ? '3d' : 'image',
      path: `/uploads/${is3D ? '3d' : 'images'}/${file.name}`,
    });
  } catch (err) {
    console.error('❌ Upload failed:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

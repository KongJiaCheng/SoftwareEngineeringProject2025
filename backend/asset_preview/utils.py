
import os, mimetypes, subprocess
from pathlib import Path

try:
    from PIL import Image
except Exception:
    Image = None

IMAGE_EXTS = {'.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tiff'}
VIDEO_EXTS = {'.mp4', '.mov', '.m4v', '.avi', '.mkv', '.webm'}
PDF_EXTS   = {'.pdf'}

def guess_mime(path: str, default="application/octet-stream"):
    mime, _ = mimetypes.guess_type(path)
    return mime or default

def classify(path: str, mime: str | None = None):
    mime = mime or guess_mime(path)
    ext = Path(path).suffix.lower()
    if mime.startswith("image/") or ext in IMAGE_EXTS:
        return "image"
    if mime == "application/pdf" or ext in PDF_EXTS:
        return "pdf"
    if mime.startswith("video/") or ext in VIDEO_EXTS:
        return "video"
    return "other"

def _ensure_parent(p: Path):
    p.parent.mkdir(parents=True, exist_ok=True)

def gen_image_thumb(src: Path, out: Path) -> bool:
    if not Image:
        return False
    try:
        _ensure_parent(out)
        with Image.open(src) as im:
            im.thumbnail((1024, 1024))
            if im.mode in ("P", "RGBA", "LA"):
                im = im.convert("RGB")
            im.save(out, "JPEG", quality=85, optimize=True)
        return True
    except Exception:
        return False

def gen_pdf_cover(src: Path, out: Path) -> bool:
    try:
        import fitz  
    except Exception:
        return False
    try:
        _ensure_parent(out)
        doc = fitz.open(src)
        if doc.page_count == 0:
            return False
        page = doc.load_page(0)
        pix = page.get_pixmap(dpi=150)
        pix.save(str(out))
        return True
    except Exception:
        return False

def gen_video_frame(src: Path, out: Path) -> bool:
    try:
        _ensure_parent(out)
        subprocess.run(
            ["ffmpeg","-y","-ss","0.5","-i",str(src),"-frames:v","1",str(out)],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True
        )
        return True
    except Exception:
        return False

def ensure_basic_info(asset):
    
    if not asset.file or not hasattr(asset.file, "path") or not os.path.exists(asset.file.path):
        return
    from .models import Asset  
    path = asset.file.path
    asset.file_size = os.path.getsize(path) or 0
    asset.mime_type = guess_mime(path)
    kind = classify(path, asset.mime_type)
    asset.file_type = kind if kind in dict(Asset.ASSET_TYPES) else "other"
    if not asset.original_filename:
        asset.original_filename = os.path.basename(asset.file.name)
    asset.save(update_fields=["file_size","mime_type","file_type","original_filename"])

def build_previews(asset, media_root: Path):
   

    if not asset.file or not hasattr(asset.file, "path") or not os.path.exists(asset.file.path):
        return
    kind = classify(asset.file.path, getattr(asset, "mime_type", None))
    thumb_path = media_root / "thumbnails" / f"{asset.id}.jpg"
    prev_path  = media_root / "previews"   / f"{asset.id}.jpg"

    ok = False
    if kind == "image":
        ok = gen_image_thumb(Path(asset.file.path), thumb_path)
        if ok:
            prev_path = thumb_path
    elif kind == "pdf":
        ok = gen_pdf_cover(Path(asset.file.path), prev_path)
    elif kind == "video":
        ok = gen_video_frame(Path(asset.file.path), prev_path)

    if ok:
        
        if thumb_path.exists():
            asset.thumbnail.name = str(thumb_path.relative_to(media_root)).replace("\\","/")
        if prev_path.exists():
            asset.preview_file.name = str(prev_path.relative_to(media_root)).replace("\\","/")
        asset.save(update_fields=["thumbnail","preview_file"])

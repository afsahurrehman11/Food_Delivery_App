import traceback
from bson import ObjectId
from fastapi import HTTPException, status
from io import BytesIO
from PIL import Image


def optimize_image(image_bytes: bytes, max_width: int = 2000, quality: int = 98) -> bytes:
    """
    Preserve image quality while only resizing excessively large images.
    
    - Keeps the ORIGINAL format (JPEG/JFIF stays JPEG, PNG stays PNG, WebP stays WebP)
    - Does NOT re-encode unless the image exceeds max_width
    - Uses highest quality settings when re-encoding is necessary
    - JFIF, JPEG, PNG, WebP, BMP, TIFF all supported
    
    Args:
        image_bytes: Raw image bytes
        max_width: Only resize if image exceeds this width (default 2000px)
        quality: Quality for re-encoding if resize is needed (default 98)
    
    Returns:
        Original bytes (if no resize needed) or high-quality resized bytes
    """
    try:
        img = Image.open(BytesIO(image_bytes))
        original_format = img.format  # e.g. 'JPEG', 'PNG', 'WEBP', 'BMP'
        
        # If image doesn't need resizing, return ORIGINAL bytes untouched
        # This preserves every pixel exactly as uploaded
        if img.width <= max_width:
            return image_bytes
        
        # Only resize if image is excessively large
        ratio = max_width / img.width
        new_height = int(img.height * ratio)
        img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
        
        # Save in the SAME format as the original
        output = BytesIO()
        save_format = original_format if original_format else 'JPEG'
        
        if save_format.upper() in ('JPEG', 'JPG', 'MPO'):
            # Convert RGBA to RGB for JPEG
            if img.mode in ('RGBA', 'LA', 'P'):
                rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                rgb_img.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = rgb_img
            img.save(output, format='JPEG', quality=quality, optimize=True, subsampling=0)
        elif save_format.upper() == 'PNG':
            img.save(output, format='PNG', optimize=True)
        elif save_format.upper() == 'WEBP':
            img.save(output, format='WEBP', quality=quality, method=6)
        else:
            # For any other format, save as PNG to preserve quality
            img.save(output, format='PNG', optimize=True)
        
        output.seek(0)
        return output.getvalue()
    except Exception as e:
        traceback.print_exc()
        # If anything fails, return original bytes untouched
        return image_bytes


def serialize_doc(doc: dict) -> dict:
    """Convert MongoDB document _id (ObjectId) to string 'id' field."""
    try:
        if doc is None:
            return None
        if "_id" in doc:
            doc["id"] = str(doc["_id"])
            del doc["_id"]
        return doc
    except Exception as e:
        traceback.print_exc()
        raise


def to_object_id(id_str: str) -> ObjectId:
    """Safely convert a string to ObjectId."""
    try:
        return ObjectId(id_str)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid ID format: {id_str}",
        )

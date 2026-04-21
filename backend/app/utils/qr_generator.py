import traceback
import io
import base64
import qrcode


def generate_qr_code(data: str) -> bytes:
    """Generate a QR code image (PNG bytes) for the given data string."""
    try:
        qr = qrcode.QRCode(version=1, box_size=10, border=4)
        qr.add_data(data)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        result = buffer.getvalue()
        return result
    except Exception as e:
        traceback.print_exc()
        raise


def qr_bytes_to_base64(qr_bytes: bytes) -> str:
    """Convert QR code bytes to a base64 string for API responses."""
    try:
        return base64.b64encode(qr_bytes).decode("utf-8")
    except Exception as e:
        traceback.print_exc()
        raise

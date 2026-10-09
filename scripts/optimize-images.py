"""Genera derivados; nunca reemplaza las fotografías originales."""
from pathlib import Path
from PIL import Image, ImageOps
import json

root = Path(__file__).resolve().parent.parent
target = root / 'resources' / 'optimized'
target.mkdir(parents=True, exist_ok=True)
manifest = {}
for source in sorted((root / 'resources').glob('*')):
    if source.suffix.lower() not in ('.jpg', '.jpeg', '.png') or source.name == 'favicon.png':
        continue
    with Image.open(source) as image:
        image = ImageOps.exif_transpose(image).convert('RGB')
        variants = []
        for width in (400, 800, 1200):
            resized = image.copy()
            resized.thumbnail((width, width * 4))
            name = f'{source.stem}-{width}.webp'
            resized.save(target / name, 'WEBP', quality=82, method=6)
            variants.append({'src': f'resources/optimized/{name}', 'width': resized.width, 'height': resized.height})
        manifest['resources/' + source.name] = variants
(root / 'data' / 'images.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'{len(manifest)} originales conservados; derivados WebP generados.')

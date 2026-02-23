#!/usr/bin/env python3
"""
Batch Process Wardrobe for FitCheck

This script processes a persona folder structure and uploads garments to the FitCheck app.
The folder structure should be:

persona/
├── full-body.png          # Full-body photo for virtual try-on
└── wardrobe/              # Garment photos
    ├── image-1.jpg
    ├── image-2.jpg
    └── ...

Usage:
    python batch_process_wardrobe.py --folder /path/to/persona --lmstudio-url http://localhost:1234
"""

import os
import sys
import json
import base64
import argparse
import requests
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime


def encode_image_to_base64(image_path: str) -> str:
    """Encode an image file to base64 string."""
    with open(image_path, 'rb') as f:
        return base64.b64encode(f.read()).decode('utf-8')


def analyze_garment_with_lmstudio(
    image_base64: str,
    lmstudio_url: str = "http://localhost:1234/v1/chat/completions"
) -> Optional[Dict]:
    """Analyze a garment using Qwen3-VL via LM Studio."""
    
    prompt = """You are an expert fashion stylist. Analyze the Indian ethnic clothing in the image and determine the ideal pairing. COPY THE EXACT JSON PATTERN BELOW.

RULES:
- "analyzed_garment": A one-line detailed description of the main garment shown in the image. Include color, fabric, and style.
- "pairing_attributes": A JSON array of highly specific, standalone physical descriptors (e.g., exact color, fabric type, pattern, cut, garment type) optimized for vector embedding search to find a pairing in a wardrobe database. NEVER use relative words like "matching", "complementary", "similar", or "this".
- "category": State the type of garment needed to complete the look (e.g., "Lehenga", "Dupatta", "Palazzo", "Churidar", "Salwar").
- Output ONLY raw, unformatted JSON.
- STRICT REQUIREMENT: Do not use Markdown, do not use ```json code blocks, and do not include any conversational text.

PATTERN TO COPY:
{"analyzed_garment":"Women's mustard yellow embroidered silk Anarkali top","pairing_attributes":["solid crimson red", "banarasi brocade", "wide-leg palazzo", "gold zari border"],"category":"Palazzo"}

USER INPUT: Analyze the main garment.
RAW JSON OUTPUT:"""

    try:
        response = requests.post(
            lmstudio_url,
            headers={"Content-Type": "application/json"},
            json={
                "model": "qwen3-vl-4b-instruct",
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}
                            }
                        ]
                    }
                ],
                "temperature": 0.3,
                "max_tokens": 500
            },
            timeout=60
        )
        
        if response.status_code == 200:
            data = response.json()
            content = data['choices'][0]['message']['content']
            
            # Extract JSON from response
            import re
            json_match = re.search(r'\{[\s\S]*\}', content)
            if json_match:
                return json.loads(json_match.group())
        
        print(f"Error: Failed to analyze garment. Status: {response.status_code}")
        return None
        
    except Exception as e:
        print(f"Error analyzing garment: {e}")
        return None


def process_wardrobe_folder(
    persona_folder: str,
    lmstudio_url: str,
    output_file: str = "wardrobe_export.json"
) -> List[Dict]:
    """Process all garments in the wardrobe folder."""
    
    persona_path = Path(persona_folder)
    wardrobe_path = persona_path / "wardrobe-compressed"
    full_body_path = persona_path / "full-body-compressed.png"
    
    if not wardrobe_path.exists():
        print(f"Error: Wardrobe folder not found at {wardrobe_path}")
        sys.exit(1)
    
    # Check for full-body image
    if full_body_path.exists():
        print(f"Found full-body image: {full_body_path}")
        full_body_base64 = encode_image_to_base64(str(full_body_path))
    else:
        print("Warning: No full-body.png found in persona folder")
        full_body_base64 = None
    
    # Supported image extensions
    image_extensions = {'.jpg', '.jpeg', '.png', '.webp'}
    
    # Get all image files
    image_files = [
        f for f in wardrobe_path.iterdir()
        if f.is_file() and f.suffix.lower() in image_extensions
    ]
    
    print(f"Found {len(image_files)} images in wardrobe folder")
    
    wardrobe_items = []
    
    for i, image_file in enumerate(image_files, 1):
        print(f"\nProcessing {i}/{len(image_files)}: {image_file.name}")
        
        # Encode image
        image_base64 = encode_image_to_base64(str(image_file))
        
        # Analyze with LM Studio
        analysis = analyze_garment_with_lmstudio(image_base64, lmstudio_url)
        
        if analysis:
            item = {
                "id": f"{int(datetime.now().timestamp() * 1000)}-{i}",
                "filename": image_file.name,
                "imageBase64": image_base64,
                "analysis": analysis,
                "uploadedAt": datetime.now().isoformat()
            }
            wardrobe_items.append(item)
            print(f"  ✓ Analyzed: {analysis.get('analyzed_garment', 'N/A')[:60]}...")
            print(f"  ✓ Category: {analysis.get('category', 'N/A')}")
        else:
            print(f"  ✗ Failed to analyze")
    
    # Save to output file
    output_data = {
        "fullBodyImage": full_body_base64,
        "wardrobe": wardrobe_items,
        "exportedAt": datetime.now().isoformat()
    }
    
    with open(output_file, 'w') as f:
        json.dump(output_data, f, indent=2)
    
    print(f"\n{'='*50}")
    print(f"Export complete!")
    print(f"Total items processed: {len(wardrobe_items)}")
    print(f"Output saved to: {output_file}")
    print(f"{'='*50}")
    
    return wardrobe_items


def import_to_browser_localstorage(wardrobe_export_file: str):
    """
    Print instructions for importing the wardrobe to browser localStorage.
    """
    print("\n" + "="*50)
    print("IMPORT INSTRUCTIONS:")
    print("="*50)
    print("""
To import this wardrobe into the FitCheck app:

1. Open the FitCheck app in your browser
2. Open Developer Tools (F12)
3. Go to Application/Storage > Local Storage
4. Find the key 'fitcheck-wardrobe'
5. Copy the contents of the wardrobe_export.json file
6. Paste it as the value for 'fitcheck-wardrobe'

Or use this JavaScript in the console:

```javascript
fetch('wardrobe_export.json')
  .then(r => r.json())
  .then(data => {
    localStorage.setItem('fitcheck-wardrobe', JSON.stringify(data.wardrobe));
    if (data.fullBodyImage) {
      const persona = JSON.parse(localStorage.getItem('fitcheck-persona') || '{}');
      persona.fullBodyImage = 'data:image/png;base64,' + data.fullBodyImage;
      localStorage.setItem('fitcheck-persona', JSON.stringify(persona));
    }
    console.log('Import complete!');
  });
```
""")


def main():
    parser = argparse.ArgumentParser(
        description="Batch process wardrobe folder for FitCheck"
    )
    parser.add_argument(
        "--folder",
        required=True,
        help="Path to persona folder containing full-body.png and wardrobe/"
    )
    parser.add_argument(
        "--lmstudio-url",
        default="http://localhost:1234/v1/chat/completions",
        help="LM Studio API URL"
    )
    parser.add_argument(
        "--output",
        default="wardrobe_export.json",
        help="Output JSON file"
    )
    parser.add_argument(
        "--instructions",
        action="store_true",
        help="Show import instructions after processing"
    )
    
    args = parser.parse_args()
    
    # Check LM Studio is running
    print("Checking LM Studio connection...")
    try:
        health_url = args.lmstudio_url.replace('/chat/completions', '/models')
        response = requests.get(health_url, timeout=5)
        if response.status_code == 200:
            print("✓ LM Studio is running")
        else:
            print("✗ LM Studio returned error. Make sure it's running.")
            sys.exit(1)
    except requests.exceptions.ConnectionError:
        print("✗ Cannot connect to LM Studio. Please start it first.")
        print(f"  Expected at: {args.lmstudio_url}")
        sys.exit(1)
    
    # Process wardrobe
    process_wardrobe_folder(args.folder, args.lmstudio_url, args.output)
    
    # Show import instructions
    if args.instructions:
        import_to_browser_localstorage(args.output)


if __name__ == "__main__":
    main()

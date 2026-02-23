#!/usr/bin/env python3
"""
Batch Process Wardrobe for FitCheck

This script processes a persona folder structure and uploads garments to the FitCheck app.
The folder structure should be:

persona/
├── full-body.png          # (Optional) Full-body photo for virtual try-on
└── wardrobe-compressed/   # Garment photos
    ├── image-1.jpg
    ├── image-2.jpg
    └── ...

Usage:
    python batch_process_wardrobe.py --folder /path/to/persona --lmstudio-url http://localhost:1234/v1/chat/completions
"""

import os
import sys
import json
import base64
import argparse
import requests
import re
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
    
    prompt = """You are an expert fashion archivist and stylist. Analyze the clothing in the image and extract its visual details. COPY THE EXACT JSON PATTERN BELOW.

RULES:
- "summary": A concise, 3-5 word title for the garment (e.g., "Mustard Yellow Silk Anarkali").
- "analyzed_garment": A highly detailed, descriptive paragraph about the garment. Include exact colors, fabric textures, patterns, silhouette, cut, neckline, sleeve length, and any embellishments (zari, embroidery, sequins).
- "category": State the exact category of the garment. Choose strictly from standard apparel types (e.g., Kurti, Lehenga, Dupatta, Palazzo, Churidar, Salwar, Saree, Sherwani, Anarkali, Dress, Gown, Skirt, Jeans, Pants, Blazer, Jacket, Top, Shirt).
- Output ONLY raw, unformatted JSON.
- STRICT REQUIREMENT: Do not use Markdown, do not use ```json code blocks, and do not include any conversational text.

PATTERN TO COPY:
{"summary": "Crimson Red Banarasi Saree", "analyzed_garment": "A traditional crimson red Saree crafted from heavy Banarasi silk. It features intricate gold zari brocade work in floral motifs across the entire body, with a thick, ornate gold border and a heavily embellished pallu.", "category": "Saree"}

USER INPUT: Analyze the main garment.
RAW JSON OUTPUT:"""

    try:
        response = requests.post(
            lmstudio_url,
            headers={"Content-Type": "application/json"},
            json={
                "model": "qwen3-vl-4b-instruct", # Ensure this matches your loaded model in LM Studio
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
                "temperature": 0.2, # Low temperature for strict JSON compliance
                "max_tokens": 500
            },
            timeout=60
        )
        
        if response.status_code == 200:
            data = response.json()
            content = data['choices'][0]['message']['content']
            
            # Extract JSON from response in case the model hallucinates markdown
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
    full_body_path = persona_path / "full-body.png"
    
    if not wardrobe_path.exists():
        print(f"Error: Wardrobe folder not found at {wardrobe_path}")
        sys.exit(1)
    
    if full_body_path.exists():
        print(f"Found full-body image: {full_body_path}")
        full_body_base64 = encode_image_to_base64(str(full_body_path))
    else:
        full_body_base64 = None
    
    image_extensions = {'.jpg', '.jpeg', '.png', '.webp'}
    image_files = [
        f for f in wardrobe_path.iterdir()
        if f.is_file() and f.suffix.lower() in image_extensions
    ]
    
    print(f"Found {len(image_files)} images in wardrobe folder")
    wardrobe_items = []
    
    for i, image_file in enumerate(image_files, 1):
        print(f"\nProcessing {i}/{len(image_files)}: {image_file.name}")
        
        image_base64 = encode_image_to_base64(str(image_file))
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
            print(f"  ✓ Summary: {analysis.get('summary', 'N/A')}")
            print(f"  ✓ Category: {analysis.get('category', 'N/A')}")
        else:
            print(f"  ✗ Failed to analyze")
    
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

def main():
    parser = argparse.ArgumentParser(description="Batch process wardrobe folder for FitCheck")
    parser.add_argument("--folder", required=True, help="Path to persona folder")
    parser.add_argument("--lmstudio-url", default="http://localhost:1234/v1/chat/completions", help="LM Studio API URL")
    parser.add_argument("--output", default="wardrobe_export.json", help="Output JSON file")
    
    args = parser.parse_args()
    
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
        sys.exit(1)
    
    process_wardrobe_folder(args.folder, args.lmstudio_url, args.output)

if __name__ == "__main__":
    main()
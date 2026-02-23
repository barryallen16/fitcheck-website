# Persona Folder Structure

This folder contains the user's style persona data including the full-body photo and wardrobe images.

## Folder Structure

```
public/
└── persona/
    ├── full-body.png          # Your full-body photo (displayed in Persona tab)
    ├── wardrobe/              # Your garment images
    │   ├── garment_001.jpg
    │   ├── garment_002.jpg
    │   └── ...
    └── README.md              # This file
```

## How to Use

### 1. Full-Body Photo
- Place your full-body photo in this folder as `full-body.png`
- Supported formats: PNG, JPG, JPEG, WEBP
- Recommended size: 800x1200 pixels (3:4 aspect ratio)
- This photo will be displayed in the "Persona" tab

### 2. Wardrobe Images
- Place your garment photos in the `wardrobe/` subfolder
- Supported formats: PNG, JPG, JPEG, WEBP
- Recommended: Name files descriptively (e.g., `red-kurti-001.jpg`)
- The UI will automatically process and classify these images when uploaded

### 3. Upload via UI
Alternatively, you can use the "Upload" tab in the FitCheck UI to:
- Drag and drop garment images
- Take photos directly from your camera
- Images will be processed by the AI and stored in the browser

## CORS Configuration for LM Studio

To fix the CORS error when connecting to LM Studio, you need to enable CORS in LM Studio:

### Option 1: Enable CORS in LM Studio Settings
1. Open LM Studio
2. Go to Settings → Developer
3. Enable "Allow Cross-Origin Requests (CORS)"
4. Restart the API server

### Option 2: Start LM Studio with CORS Flag
If running LM Studio from command line:
```bash
lmstudio --cors
```

### Option 3: Use a CORS Proxy (Development Only)
For development, you can use a CORS proxy:
```bash
# Install cors-anywhere
npm install -g cors-anywhere

# Start the proxy
cors-anywhere --origin http://localhost:5173
```

Then update the `LM_STUDIO_URL` in `src/hooks/useLMStudio.ts` to:
```typescript
const LM_STUDIO_URL = 'http://localhost:8080/http://localhost:1234/api/v1/chat';
```

## Mock Mode

If you don't have LM Studio running, you can enable mock mode for testing:

1. Open `src/hooks/useLMStudio.ts`
2. Change `const USE_MOCK = false;` to `const USE_MOCK = true;`
3. The UI will use mock data instead of calling the API

## Troubleshooting

### "Network Error" or "CORS policy" errors
- Make sure LM Studio is running
- Enable CORS in LM Studio settings
- Check that the API server is started on port 1234

### "Failed to classify garment" errors
- Check that your model (qwen3-vl-2b) is loaded in LM Studio
- Verify the model supports vision (image input)
- Check LM Studio logs for errors

### Images not showing
- Make sure images are in the correct folder
- Check browser console for 404 errors
- Verify image file formats are supported

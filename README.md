# FitCheck - AI Fashion Stylist

A multi-modular AI framework for heterogeneous wardrobe recommendation and knowledge distillation for on-device deployment. FitCheck specializes in Indian ethnic wear, Western contemporary fashion, and fusion combinations.

## Features

- **Digital Wardrobe Management**: Upload and organize your garments with AI-powered analysis
- **Daily Outfit Recommendations**: Get personalized outfit suggestions based on weather and your style
- **Virtual Try-On**: See how outfits look on you using Gemini AI
- **Weather Integration**: Real-time weather data for Chennai with fashion recommendations
- **Vector Search**: Marqo FashionCLIP for intelligent garment matching

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **AI Models**:
  - Qwen3-VL-8B (Teacher) / Qwen3-VL-2B (Student) for garment analysis
  - Marqo FashionCLIP for vector-based garment search
  - Gemini 2.0 Flash for virtual try-on
- **Weather API**: OpenWeatherMap for Chennai weather data

## Project Structure

```
app/
├── src/
│   ├── sections/           # UI components
│   │   ├── Header.tsx
│   │   ├── WardrobeUpload.tsx
│   │   ├── WardrobeGallery.tsx
│   │   ├── DailyRecommendation.tsx
│   │   ├── PersonaSection.tsx
│   │   └── LMStudioStatus.tsx
│   ├── services/           # API integrations
│   │   ├── lmStudioService.ts      # Qwen3-VL integration
│   │   ├── fashionCLIPService.ts   # Marqo FashionCLIP
│   │   ├── geminiService.ts        # Virtual try-on
│   │   ├── weatherService.ts       # Weather API
│   │   ├── recommendationService.ts # Outfit logic
│   │   └── storageService.ts       # Local storage
│   ├── types/              # TypeScript types
│   └── App.tsx
├── dist/                   # Build output
└── README.md
```

## Setup Instructions

### 1. LM Studio Setup

1. Download and install [LM Studio](https://lmstudio.ai/)
2. Download the Qwen3-VL-2b model
3. Start the server:
   - Go to Developer tab
   - Start server on port 1234
   - Load Qwen3-VL-2b model

### 2. Environment Variables

Create a `.env` file in the project root:

```env
# Hugging Face API Token (for FashionCLIP)
VITE_HF_API_TOKEN=your_hf_token_here

# Gemini API Key (for virtual try-on)
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# OpenWeatherMap API Key (for weather)
VITE_WEATHER_API_KEY=your_openweather_api_key_here
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

### 5. Build for Production

```bash
npm run build
```

## Data Folder Structure

For batch processing of persona data, organize your files as follows:

```
persona/
├── full-body.png          # Your full-body photo for virtual try-on
└── wardrobe/              # Your garment photos
    ├── image-1.jpg
    ├── image-2.jpg
    ├── image-3.jpg
    └── ...
```

**Note**: The current UI supports manual upload. For batch processing from this folder structure, you would need to implement a backend service that reads from this directory.

## API Endpoints

### LM Studio (Local)
- **URL**: `http://localhost:1234/v1/chat/completions`
- **Model**: Qwen3-VL-2b
- **Purpose**: Garment analysis and attribute extraction

### Gemini API
- **URL**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent`
- **Purpose**: Virtual try-on image generation

### Marqo FashionCLIP
- **URL**: `https://api-inference.huggingface.co/models/Marqo/marqo-fashionCLIP`
- **Purpose**: Vector embeddings for garment matching

### Weather API
- **URL**: `https://api.openweathermap.org/data/2.5/weather`
- **Location**: Chennai (lat: 13.0827, lon: 80.2707)

## How It Works

### Stage 1: Garment Analysis
When you upload a garment photo:
1. Image is sent to Qwen3-VL-2b via LM Studio
2. Model analyzes and returns structured JSON:
   ```json
   {
     "analyzed_garment": "Women's mustard yellow embroidered silk Anarkali top",
     "pairing_attributes": ["solid crimson red", "banarasi brocade", "wide-leg palazzo"],
     "category": "Palazzo"
   }
   ```

### Stage 2: Wardrobe Storage
- Garments are stored in browser's localStorage
- Each item includes: image, analysis, timestamp

### Stage 3: Daily Recommendation
1. System selects a "top" garment (Kurti, Top, Saree, etc.)
2. Uses FashionCLIP to find best matching "bottom"
3. Generates color logic and silhouette logic
4. Considers current weather in Chennai

### Stage 4: Virtual Try-On
1. User uploads full-body photo in Persona section
2. System sends full-body + outfit garments to Gemini
3. Gemini generates realistic try-on image

## Prompts Used

### Garment Analysis Prompt (LM Studio)
```
You are an expert fashion stylist. Analyze the Indian ethnic clothing in the image and determine the ideal pairing. COPY THE EXACT JSON PATTERN BELOW.

RULES:
- "analyzed_garment": A one-line detailed description of the main garment shown in the image. Include color, fabric, and style.
- "pairing_attributes": A JSON array of highly specific, standalone physical descriptors optimized for vector embedding search.
- "category": State the type of garment needed to complete the look.
- Output ONLY raw, unformatted JSON.
```

### Virtual Try-On Prompt (Gemini)
```
A full-length photograph of the subject from image_1.png, maintaining their exact pose, expression, and anatomy. The subject is now wearing the garment shown in image_0.png. The new garment— {garment descriptions} worn realistically over the subject's body, completely replacing their original top/outfit. The fabric shows realistic texture, folds, and shadowing consistent with the garment's material.
```

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Limitations

- LocalStorage has ~5-10MB limit for wardrobe storage
- LM Studio must be running locally for garment analysis
- Virtual try-on requires Gemini API key
- Weather data is fixed to Chennai location

## Future Enhancements

- Backend API for batch processing persona folder
- Support for multiple user profiles
- Outfit history and favorites
- Social sharing of outfits
- Mobile app with camera integration

## License

MIT License - For academic and research purposes.

## Citation

If you use this project, please cite:

```
@software{fitcheck2024,
  title={FitCheck: AI Framework for Heterogeneous Wardrobe Recommendation},
  author={Your Name},
  year={2024}
}
```

## Acknowledgments

- IndoFashion Dataset: https://indofashion.github.io/
- Qwen3-VL: Alibaba Cloud
- Marqo FashionCLIP: https://www.marqo.ai/
- Gemini: Google AI

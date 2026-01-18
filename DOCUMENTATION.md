<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# TDS PhotoArchivePRO - Complete Documentation

> **Enterprise-Grade AI-Powered Photo Metadata Engine for The Daily Star Newsroom**  
> *Version 3.0 (Enhanced) | Developed by Imam Chowdhury*

---

## 🆕 What's New in v3.0

| Feature | Description |
|---------|-------------|
| **🧠 Deep Thinking Mode** | AI uses extended reasoning (2048+ tokens) for complex scene analysis |
| **📋 Event Templates** | 16+ pre-configured templates for Parliament, Cricket, Press Conferences, etc. |
| **✍️ Caption Styles** | 5 styles: AP, Social Media, Wire Service, Magazine, Archive |
| **🎯 High Accuracy Mode** | Optional 4096-token thinking budget for critical images |
| **👤 Known Figures DB** | 30+ Bangladeshi politicians, athletes, celebrities for auto-recognition |
| **📝 OCR Text Extraction** | Reads signs, banners, badges from images |
| **🏷️ Category Detection** | Auto-classifies into 10 news desk categories |
| **✅ Verification Protocol** | AI explains WHY it identified each person |
| **📊 Quality Assessment** | Sharpness, exposure, print-readiness scoring |
| **💡 Suggested Keywords** | Category-specific keyword recommendations |

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Setup & Installation](#setup--installation)
5. [Application Workflow](#application-workflow)
6. [Core Features](#core-features)
7. [File Structure](#file-structure)
8. [API & Services](#api--services)
9. [Metadata Standards](#metadata-standards)
10. [Troubleshooting](#troubleshooting)

---

## Overview

**TDS PhotoArchivePRO** is a professional-grade web application designed for The Daily Star newsroom to automate the process of generating, managing, and embedding metadata into press photographs. The application leverages Google's Gemini AI to analyze images and generate:

- **News-headline style titles**
- **40 searchable archive tags/keywords**
- **AP-style editorial captions**
- **Confidence scores for AI-generated content**

The embedded metadata follows industry standards (EXIF, XMP, IPTC) ensuring compatibility with:
- Windows File Explorer
- Adobe Bridge / Lightroom / Photoshop
- Stock photo agencies (Getty, Shutterstock, etc.)
- Digital Asset Management (DAM) systems

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                           │
│                     (React + TailwindCSS)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐    │
│  │ Image Upload │──▶│ AI Analysis  │──▶│ Metadata Editor  │    │
│  │    Module    │   │   Engine     │   │    Interface     │    │
│  └──────────────┘   └──────────────┘   └──────────────────┘    │
│         │                  │                    │               │
│         ▼                  ▼                    ▼               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   STATE MANAGEMENT                        │  │
│  │              (React useState / useRef)                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                    │
├────────────────────────────┼────────────────────────────────────┤
│                            ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    SERVICES LAYER                         │  │
│  │  ┌─────────────────┐      ┌────────────────────────┐     │  │
│  │  │ geminiService.ts│      │  metadataService.ts    │     │  │
│  │  │ (AI Processing) │      │  (Binary Embedding)    │     │  │
│  │  └─────────────────┘      └────────────────────────┘     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                    │
├────────────────────────────┼────────────────────────────────────┤
│                            ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  EXTERNAL SERVICES                        │  │
│  │  ┌─────────────────────────┐                              │  │
│  │  │  Google Gemini 3 Flash  │                              │  │
│  │  │      (Vision API)       │                              │  │
│  │  └─────────────────────────┘                              │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

| Category | Technology | Purpose |
|----------|------------|---------|
| **Frontend** | React 19.2.3 | UI Components & State Management |
| **Styling** | TailwindCSS (CDN) | Utility-first CSS Framework |
| **Build Tool** | Vite 6.2+ | Fast Development Server & Bundler |
| **Language** | TypeScript 5.8+ | Type Safety & IDE Support |
| **AI Engine** | @google/genai 1.34.0 | Gemini Vision API Integration |
| **Metadata** | piexifjs 1.0.6 | EXIF Reading/Writing |
| **Typography** | Google Fonts (Inter) | Professional Font Family |

---

## Setup & Installation

### Prerequisites
- **Node.js** v18.0.0 or higher
- **npm** v9.0.0 or higher
- **Google Gemini API Key** (from [Google AI Studio](https://aistudio.google.com/))

### Step 1: Clone & Install Dependencies

```bash
# Navigate to project directory
cd c:\Users\ihcking\Downloads\Photokeyword-embading

# Install dependencies
npm install
```

### Step 2: Configure Environment

Create or edit `.env.local` in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

> ⚠️ **Security Note**: The `.env.local` file is gitignored. Never commit your API keys.

### Step 3: Start Development Server

```bash
npm run dev
```

The application will be available at:
- **Local**: http://localhost:3000/
- **Network**: http://[your-ip]:3000/

### Step 4: Build for Production (Optional)

```bash
npm run build
npm run preview
```

---

## Application Workflow

### Complete User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                     COMPLETE WORKFLOW                            │
└─────────────────────────────────────────────────────────────────┘

  STEP 1: PREPARATION
  ┌─────────────────────────────────────────┐
  │ 1. Enter Photographer Credit            │
  │    (Default: "Daily Star Staff")        │
  │                                         │
  │ 2. Enter Project Scenario (Optional)    │
  │    Examples:                             │
  │    - "Prime Minister's Press Briefing"  │
  │    - "BPL Final Match, Dhaka Stadium"   │
  │    - "Flood Relief Camp, Sylhet"        │
  └─────────────────────────────────────────┘
              │
              ▼
  STEP 2: IMAGE INGESTION
  ┌─────────────────────────────────────────┐
  │ 1. Click "Ingest Press Archive" zone    │
  │ 2. Select multiple images (JPG/PNG/WebP)│
  │ 3. Original EXIF data is preserved      │
  │    - Artist name (if exists)            │
  │    - Date Taken (if exists)             │
  └─────────────────────────────────────────┘
              │
              ▼
  STEP 3: AI PROCESSING
  ┌─────────────────────────────────────────┐
  │ 1. Click "PROCESS BATCH" button         │
  │ 2. AI analyzes each image (3 parallel)  │
  │ 3. Generates:                           │
  │    ✓ Title (4-10 words, headline style) │
  │    ✓ 40 Keywords (searchable tags)      │
  │    ✓ Caption (AP-style, 2-3 sentences)  │
  │    ✓ Confidence Score (0-100%)          │
  └─────────────────────────────────────────┘
              │
              ▼
  STEP 4: METADATA REVIEW & EDITING
  ┌─────────────────────────────────────────┐
  │ For each image, you can:                │
  │ ✓ Edit Title                            │
  │ ✓ Edit Caption                          │
  │ ✓ Add/Remove/Reorder Tags               │
  │ ✓ Change Photographer Credit            │
  │ ✓ Edit Advanced Metadata (XMP/IPTC):    │
  │   - Creator Tool                        │
  │   - Copyright/Rights                    │
  │   - Create Date / Modify Date           │
  └─────────────────────────────────────────┘
              │
              ▼
  STEP 5: ARCHIVE & DOWNLOAD
  ┌─────────────────────────────────────────┐
  │ Option A: Individual Download           │
  │   Click "Embed & Download" per image    │
  │                                         │
  │ Option B: Batch Download                │
  │   Click "BATCH DOWNLOAD" in header      │
  │                                         │
  │ Output filename format:                 │
  │   PhotographerName_OriginalFilename.ext │
  └─────────────────────────────────────────┘
              │
              ▼
  STEP 6: MANIFEST EXPORT (Optional)
  ┌─────────────────────────────────────────┐
  │ Click "MANIFEST TOOLS" for:             │
  │ ✓ CSV (Excel/Data Sheet)                │
  │ ✓ JSON (Developer Format)               │
  │ ✓ TXT (Press Summary Sheet)             │
  └─────────────────────────────────────────┘
```

---

## Core Features

### 1. 🖼️ Multi-Format Image Support
- **JPEG/JPG**: Full EXIF + XMP embedding
- **PNG**: iTXt chunks + eXIf chunk embedding
- **WebP**: EXIF + XMP chunk embedding

### 2. 🤖 AI-Powered Metadata Generation
- Uses **Gemini 3 Flash Preview** vision model
- Recognizes public figures (especially Bangladeshi politicians, athletes)
- Generates professional AP-style captions
- Provides confidence scoring

### 3. 🏷️ Advanced Tag Management
| Feature | Description |
|---------|-------------|
| Add Tags | Comma-separated input, auto-normalized to lowercase |
| Edit Tags | Click any tag to edit inline |
| Remove Tags | Click X button on hover |
| Reorder Tags | Arrow buttons to move left/right |
| Sort A-Z | Alphabetically sort all tags |
| Filter Tags | Search/filter current tags |
| Clear All | Remove all tags with confirmation |

### 4. 📁 Multi-Standard Metadata Embedding

The application embeds metadata into **three industry standards**:

| Standard | Windows Explorer | Adobe Products | Stock Agencies |
|----------|------------------|----------------|----------------|
| **EXIF** | ✅ Artist, Description | ✅ Full support | ✅ Required |
| **XMP** | ❌ | ✅ Full support | ✅ Required |
| **Windows XP Tags** | ✅ Title, Author, Tags | ❌ | ❌ |

### 5. 📊 Export Formats

| Format | Use Case |
|--------|----------|
| **CSV** | Import into Excel, Google Sheets, DAM systems |
| **JSON** | Developer integration, API payloads |
| **TXT** | Print-ready press summary sheet |

---

## File Structure

```
Photokeyword-embading/
├── .env.local              # API Key configuration (gitignored)
├── .gitignore              # Git ignore rules
├── index.html              # HTML entry point with TailwindCSS
├── index.tsx               # React DOM render entry
├── App.tsx                 # Main React component (569 lines)
├── types.ts                # TypeScript interfaces & enums
├── package.json            # NPM dependencies & scripts
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite bundler configuration
├── metadata.json           # AI Studio metadata
├── README.md               # Basic readme
├── DOCUMENTATION.md        # This comprehensive documentation
└── services/
    ├── geminiService.ts    # Google Gemini AI integration
    └── metadataService.ts  # Binary metadata embedding engine
```

---

## API & Services

### geminiService.ts

**Purpose**: Interfaces with Google Gemini Vision API

```typescript
processImageMetadata(
  base64Image: string,    // Base64-encoded image
  mimeType: string,       // "image/jpeg" | "image/png" | "image/webp"
  userNotes?: string      // Optional context (scenario, names, etc.)
): Promise<ProcessingResult>
```

**Returns**:
```typescript
{
  title: string;           // News headline (4-10 words)
  keywords: string;        // 40 comma-separated tags
  caption: string;         // AP-style caption (2-3 sentences)
  confidenceScore: number; // 0-100 AI confidence rating
}
```

**System Prompt Highlights**:
- Prioritizes Bangladeshi figures and locations
- Uses AP-style journalistic writing
- Generates exactly 40 searchable keywords
- No period at end of sentences (archival requirement)

---

### metadataService.ts

**Purpose**: Embeds metadata directly into image binary

```typescript
embedMetadata(
  base64Data: string,     // Original image base64
  metadata: {
    title: string;
    caption: string;
    keywords: string;
    photographer: string;
    creatorTool?: string;
    createDate?: string;
    modifyDate?: string;
    rights?: string;
  },
  mimeType: string
): Promise<string>        // Returns data URL with embedded metadata
```

**Embedding Strategies by Format**:

| Format | Strategy |
|--------|----------|
| **JPEG** | piexif.js for EXIF, manual APP1 segment for XMP |
| **PNG** | eXIf chunk + iTXt chunks for XMP/metadata |
| **WebP** | EXIF + XMP chunks in RIFF container |

**Windows XP Tags** (for File Explorer visibility):
- `XPTitle` (0x9c9b)
- `XPComment` (0x9c9c)
- `XPAuthor` (0x9c9d)
- `XPKeywords` (0x9c9e)
- `XPSubject` (0x9c9f)

---

## Metadata Standards

### EXIF Fields Written

| Tag | Field | Value |
|-----|-------|-------|
| `ImageDescription` | Caption/Description | AI-generated caption |
| `Artist` | Photographer | User input |
| `Software` | Creator Tool | "TDS PhotoArchivePRO" |
| `Copyright` | Rights | "© Photographer / The Daily Star" |
| `DateTime` | Modify Date | User input |
| `DateTimeOriginal` | Create Date | User input or EXIF original |
| `UserComment` | Extended Caption | ASCII-prefixed caption |

### XMP Fields Written

| Namespace | Field | Value |
|-----------|-------|-------|
| `dc:title` | Title | Headline |
| `dc:description` | Description | Caption |
| `dc:creator` | Creator | Photographer |
| `dc:subject` | Keywords | Tag array |
| `dc:rights` | Rights | Copyright statement |
| `photoshop:Headline` | Headline | Title |
| `photoshop:Credit` | Credit | "The Daily Star" |
| `photoshop:Source` | Source | "The Daily Star" |
| `xmp:CreatorTool` | Tool | "TDS PhotoArchivePRO Engine 2.5" |
| `xmp:CreateDate` | Created | ISO date |
| `xmp:ModifyDate` | Modified | ISO date |

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| **"Image content is insufficient"** | Image too blurry or abstract | Use higher quality images |
| **"Metadata engine failed to parse"** | AI response format error | Retry processing |
| **API Key not working** | Invalid or missing key | Check `.env.local` file |
| **Windows Explorer not showing metadata** | Windows cache | Right-click > Properties > Details, or restart Explorer |
| **Tags not visible in Adobe** | Software cache | Close/reopen file or use File > File Info |

### PowerShell Script Execution Policy (Windows)

If `npm install` fails with "running scripts is disabled":

```powershell
# Use npm.cmd instead
npm.cmd install
npm.cmd run dev
```

Or run once as Administrator:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## License & Credits

**TDS PhotoArchivePRO** © 2026 The Daily Star  
*Engineered by Imam Chowdhury*

This application is proprietary software developed for The Daily Star newsroom operations.

---

<div align="center">
<p><strong>TDS PhotoArchivePRO Engine v2.5</strong></p>
<p><em>Automated newsroom archival system supporting industry standards via multi-format binary injection.</em></p>
</div>

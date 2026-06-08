Lumina — Blind Aid 👁️
About Lumina

Lumina is an intelligent, low-latency spatial awareness application designed to act as a digital proxy for visual perception.

It uses high-frequency camera streams, modern computer vision techniques, and the multimodal capabilities of the Gemini API to convert complex visual environments into real-time, actionable audio feedback and spatial understanding for visually impaired users.

Key Capabilities
Contextual Scene Understanding

Lumina goes beyond simple object detection. It understands relationships between objects and describes them in natural spatial terms.
Example: “A half-open glass door is roughly two steps ahead on your left.”

Proximity & Hazard Detection

Detects obstacles, terrain changes, and potential hazards in the user’s immediate path.

Text & Signage OCR

Extracts and reads text from the environment, including street signs, product labels, and documents, in real time.

🛠️ Tech Stack & Architecture

Lumina is built for low-latency performance, prioritizing fast frame-to-audio conversion.

Frontend: React / Vite (or Next.js) for fast UI rendering and streaming
Styling: Tailwind CSS + Framer Motion for accessible, high-contrast, smooth UI
Core AI Engine: Google Gemini API (multimodal vision) for scene understanding
Audio Pipeline: Web Speech API for text-to-speech with adjustable reading speed
🚀 Getting Started

Follow these steps to run Lumina locally.

Prerequisites
Node.js v18 or higher
npm installed
1. Clone the Repository
git clone https://github.com/yourusername/lumina-blind-aid.git
cd lumina-blind-aid
2. Install Dependencies
npm install
3. Configure Environment Variables

Create a .env.local file in the root directory and add your Gemini API key:

# Get your key from https://aistudio.google.com/
GEMINI_API_KEY=your_actual_gemini_api_key_here
PORT=3000
4. Launch Development Server
npm run dev

Once running, open:

👉 http://localhost:3000

🗺️ Project Roadmap & Feature Status
Feature	Description	Status
Real-Time Video Stream	Low-latency camera capture from front/back camera	Production
Gemini Vision Pipeline	Frame-based multimodal scene analysis	Production
TTS Spatial Audio	Audio cues mapped to object distance	In Progress
Offline Edge Detection	TensorFlow.js fallback when offline	Backlog
Haptic Feedback	Vibration-based hazard alerts	Backlog
🤝 Contributing

Contributions are welcome and appreciated.

Workflow:
git checkout -b feature/AmazingFeature
git commit -m "Add some AmazingFeature"
git push origin feature/AmazingFeature

Then open a Pull Request.

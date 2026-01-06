# Vertical Jump Calculator

A mobile web app that measures your vertical jump height using AI-powered pose detection.

## Features

- **Height Calibration** - Enter your height for accurate measurements
- **Live Recording** - Record your jump directly in the app
- **Video Upload** - Or upload a pre-recorded video
- **AI Analysis** - Uses TensorFlow.js MoveNet for pose detection
- **Performance Rating** - Get categorized from Beginner to Elite

## How to Use

1. Open the app on your mobile phone
2. Enter your height (cm or ft/in)
3. Follow the setup instructions:
   - Prop your phone up 6-10 feet away
   - Film from the side
   - Ensure full body is visible
4. Record or upload your jump video
5. Get your results!

## Performance Categories

| Jump Height | Category |
|-------------|----------|
| < 30cm | Beginner |
| 30-45cm | Average |
| 46-55cm | Good |
| 56-65cm | Great |
| 66-75cm | Excellent |
| 76cm+ | Elite |

## Tech Stack

- Vanilla HTML/CSS/JavaScript
- TensorFlow.js with MoveNet pose detection
- MediaRecorder API for video capture
- Mobile-first responsive design

## Running Locally

Start a local server:

```bash
npx serve
```

Or with Python:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000` on your device.

## Browser Support

- Chrome (Android & iOS)
- Safari (iOS)
- Firefox
- Edge

**Note:** Camera access requires HTTPS in production or localhost for development.

## License

MIT

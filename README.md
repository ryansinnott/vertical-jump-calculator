# Vertical Jump Calculator

A mobile web app that measures your vertical jump height from video using physics-based calculation.

## How It Works

The app uses the physics formula **h = ½ × g × t²** where:
- **h** = jump height
- **g** = gravity (9.81 m/s²)
- **t** = time from takeoff to peak

You simply mark the takeoff frame (when heels leave the ground) and peak frame (highest point), and the app calculates your jump height from the time difference.

## Features

- **Video Upload** - Upload any video of your jump
- **Frame-by-Frame Control** - Scrub through video with precision
- **Manual Frame Selection** - Mark takeoff and peak moments
- **Physics-Based Calculation** - Accurate results using kinematic equations
- **Performance Rating** - Get categorized from Beginner to Elite

## How to Use

1. Open the app on your phone
2. Upload a video of your vertical jump
3. Use the scrubber to find the exact frame where your heels leave the ground
4. Tap "Mark Takeoff"
5. Scrub to the highest point of your jump
6. Tap "Mark Peak"
7. Tap "Calculate" to get your result!

## Tips for Best Results

- Film from either side (left or right works)
- Keep the camera steady
- Make sure feet are clearly visible
- Use slow-motion recording if available (more precise frame selection)
- Higher FPS = more accurate results

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
- No external dependencies
- Mobile-first responsive design
- Dark theme UI

## Running Locally

Simply open `index.html` in a browser, or start a local server:

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

## The Physics

When you jump, you accelerate upward until gravity brings you to a stop at your peak. The time it takes to reach the peak directly relates to your jump height through kinematics:

```
h = ½ × g × t²
```

For example:
- 0.3s to peak = ~44cm jump
- 0.4s to peak = ~78cm jump
- 0.5s to peak = ~122cm jump

## License

MIT

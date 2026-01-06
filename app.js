/**
 * Vertical Jump Calculator
 * Calculates jump height from user-selected takeoff and peak frames
 * Uses physics formula: h = ½ × g × t²
 */

class VerticalJumpApp {
    constructor() {
        // Constants
        this.GRAVITY = 9.81; // m/s²
        this.FRAME_STEP = 1 / 30; // Assume ~30fps, step by ~1 frame

        // State
        this.currentScreen = 'welcome';
        this.videoFile = null;
        this.videoDuration = 0;
        this.takeoffTime = null;
        this.peakTime = null;
        this.isPlaying = false;

        // DOM Elements
        this.screens = {
            welcome: document.getElementById('screen-welcome'),
            upload: document.getElementById('screen-upload'),
            selector: document.getElementById('screen-selector'),
            results: document.getElementById('screen-results')
        };

        this.video = document.getElementById('video-player');
        this.scrubber = document.getElementById('video-scrubber');

        // Initialize
        this.bindEvents();
    }

    // ==================== Screen Navigation ====================

    showScreen(screenName) {
        Object.values(this.screens).forEach(screen => {
            screen.classList.remove('active');
        });

        if (this.screens[screenName]) {
            this.screens[screenName].classList.add('active');
            this.currentScreen = screenName;
        }
    }

    // ==================== Event Bindings ====================

    bindEvents() {
        // Welcome screen
        document.getElementById('btn-start').addEventListener('click', () => {
            this.showScreen('upload');
        });

        // Upload screen
        const uploadArea = document.getElementById('upload-area');
        const videoInput = document.getElementById('video-upload');

        uploadArea.addEventListener('click', () => videoInput.click());

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('video/')) {
                this.handleVideoSelect(file);
            }
        });

        videoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleVideoSelect(file);
            }
        });

        // Video player events
        this.video.addEventListener('loadedmetadata', () => {
            this.videoDuration = this.video.duration;
            this.scrubber.max = Math.floor(this.video.duration * 1000);
            this.updateTimeDisplay();
        });

        this.video.addEventListener('timeupdate', () => {
            if (!this.scrubber.dataset.dragging) {
                this.scrubber.value = Math.floor(this.video.currentTime * 1000);
            }
            this.updateTimeDisplay();
        });

        this.video.addEventListener('play', () => {
            this.isPlaying = true;
            document.getElementById('btn-play-pause').classList.add('playing');
        });

        this.video.addEventListener('pause', () => {
            this.isPlaying = false;
            document.getElementById('btn-play-pause').classList.remove('playing');
        });

        this.video.addEventListener('ended', () => {
            this.isPlaying = false;
            document.getElementById('btn-play-pause').classList.remove('playing');
        });

        // Scrubber events
        this.scrubber.addEventListener('input', () => {
            this.scrubber.dataset.dragging = 'true';
            this.video.currentTime = this.scrubber.value / 1000;
            this.updateTimeDisplay();
        });

        this.scrubber.addEventListener('change', () => {
            delete this.scrubber.dataset.dragging;
        });

        // Frame navigation buttons
        document.getElementById('btn-prev-frame').addEventListener('click', () => {
            this.stepFrame(-1);
        });

        document.getElementById('btn-next-frame').addEventListener('click', () => {
            this.stepFrame(1);
        });

        document.getElementById('btn-play-pause').addEventListener('click', () => {
            this.togglePlayPause();
        });

        // Mark buttons
        document.getElementById('btn-mark-takeoff').addEventListener('click', () => {
            this.markTakeoff();
        });

        document.getElementById('btn-mark-peak').addEventListener('click', () => {
            this.markPeak();
        });

        // Calculate button
        document.getElementById('btn-calculate').addEventListener('click', () => {
            this.calculateAndShowResults();
        });

        // Try again button
        document.getElementById('btn-try-again').addEventListener('click', () => {
            this.reset();
        });
    }

    // ==================== Video Handling ====================

    handleVideoSelect(file) {
        this.videoFile = file;
        this.video.src = URL.createObjectURL(file);
        this.video.load();

        // Reset marks
        this.takeoffTime = null;
        this.peakTime = null;
        this.updateMarkerDisplays();
        this.updateCalculateButton();

        this.showScreen('selector');
    }

    updateTimeDisplay() {
        const time = this.video.currentTime;
        document.getElementById('current-time').textContent = time.toFixed(3);
    }

    stepFrame(direction) {
        if (this.isPlaying) {
            this.video.pause();
        }

        const newTime = this.video.currentTime + (direction * this.FRAME_STEP);
        this.video.currentTime = Math.max(0, Math.min(newTime, this.videoDuration));
    }

    togglePlayPause() {
        if (this.isPlaying) {
            this.video.pause();
        } else {
            this.video.play();
        }
    }

    // ==================== Frame Marking ====================

    markTakeoff() {
        this.takeoffTime = this.video.currentTime;

        // Update button state
        document.getElementById('btn-mark-takeoff').classList.add('active');

        // Update marker on scrubber
        const marker = document.getElementById('takeoff-marker');
        const percent = (this.takeoffTime / this.videoDuration) * 100;
        marker.style.left = `${percent}%`;
        marker.classList.remove('hidden');

        this.updateMarkerDisplays();
        this.updateInstructions();
        this.updateCalculateButton();
    }

    markPeak() {
        this.peakTime = this.video.currentTime;

        // Update button state
        document.getElementById('btn-mark-peak').classList.add('active');

        // Update marker on scrubber
        const marker = document.getElementById('peak-marker');
        const percent = (this.peakTime / this.videoDuration) * 100;
        marker.style.left = `${percent}%`;
        marker.classList.remove('hidden');

        this.updateMarkerDisplays();
        this.updateInstructions();
        this.updateCalculateButton();
    }

    updateMarkerDisplays() {
        const takeoffValue = document.getElementById('takeoff-time-value');
        const peakValue = document.getElementById('peak-time-value');

        takeoffValue.textContent = this.takeoffTime !== null
            ? `${this.takeoffTime.toFixed(3)}s`
            : 'Not set';

        peakValue.textContent = this.peakTime !== null
            ? `${this.peakTime.toFixed(3)}s`
            : 'Not set';
    }

    updateInstructions() {
        const instructionEl = document.getElementById('instruction-text');

        if (this.takeoffTime === null) {
            instructionEl.textContent = 'Scrub to the frame where your heels leave the ground, then tap "Mark Takeoff"';
        } else if (this.peakTime === null) {
            instructionEl.textContent = 'Now scrub to the highest point of your jump, then tap "Mark Peak"';
        } else {
            const airTime = this.peakTime - this.takeoffTime;
            if (airTime <= 0) {
                instructionEl.textContent = '⚠️ Peak must be after takeoff. Please re-mark the frames.';
            } else {
                instructionEl.textContent = `✓ Ready to calculate! Air time to peak: ${airTime.toFixed(3)}s`;
            }
        }
    }

    updateCalculateButton() {
        const btn = document.getElementById('btn-calculate');
        const canCalculate = this.takeoffTime !== null &&
                            this.peakTime !== null &&
                            this.peakTime > this.takeoffTime;
        btn.disabled = !canCalculate;
    }

    // ==================== Calculation ====================

    calculateJumpHeight(timeToApex) {
        // Physics formula: h = ½ × g × t²
        // Where t is time from takeoff to peak (apex)
        const heightMeters = 0.5 * this.GRAVITY * Math.pow(timeToApex, 2);
        const heightCm = heightMeters * 100;
        return heightCm;
    }

    calculateAndShowResults() {
        const airTime = this.peakTime - this.takeoffTime;
        const heightCm = this.calculateJumpHeight(airTime);

        this.showResults(heightCm, airTime);
    }

    // ==================== Results ====================

    showResults(heightCm, airTime) {
        // Update height display
        document.getElementById('result-cm').textContent = Math.round(heightCm);
        document.getElementById('result-inches').textContent = (heightCm / 2.54).toFixed(1);
        document.getElementById('result-airtime').textContent = `${airTime.toFixed(3)}s`;

        // Determine category
        const { category, label, context } = this.getJumpCategory(heightCm);

        const categoryEl = document.getElementById('result-category');
        categoryEl.dataset.category = category;
        categoryEl.querySelector('.category-badge').textContent = label;

        document.getElementById('result-context').textContent = context;

        this.showScreen('results');
    }

    getJumpCategory(heightCm) {
        if (heightCm < 30) {
            return {
                category: 'beginner',
                label: 'Beginner',
                context: "You're just getting started! Keep practicing and you'll improve quickly."
            };
        } else if (heightCm < 46) {
            return {
                category: 'average',
                label: 'Average',
                context: "That's about average for the general population. Room to grow!"
            };
        } else if (heightCm < 56) {
            return {
                category: 'good',
                label: 'Good',
                context: "Nice jump! You're above average, like a recreational athlete."
            };
        } else if (heightCm < 66) {
            return {
                category: 'great',
                label: 'Great',
                context: "Impressive! That's competitive athlete territory."
            };
        } else if (heightCm < 76) {
            return {
                category: 'excellent',
                label: 'Excellent',
                context: "Outstanding! You have high-level athletic ability."
            };
        } else {
            return {
                category: 'elite',
                label: 'Elite',
                context: "Incredible! That's professional athlete level explosiveness!"
            };
        }
    }

    // ==================== Reset ====================

    reset() {
        // Reset state
        this.takeoffTime = null;
        this.peakTime = null;

        // Reset UI
        document.getElementById('btn-mark-takeoff').classList.remove('active');
        document.getElementById('btn-mark-peak').classList.remove('active');
        document.getElementById('takeoff-marker').classList.add('hidden');
        document.getElementById('peak-marker').classList.add('hidden');

        this.updateMarkerDisplays();
        this.updateInstructions();
        this.updateCalculateButton();

        // Go back to selector if we have a video, otherwise upload
        if (this.videoFile) {
            this.video.currentTime = 0;
            this.showScreen('selector');
        } else {
            this.showScreen('upload');
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new VerticalJumpApp();
});

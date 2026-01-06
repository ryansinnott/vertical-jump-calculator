/**
 * Vertical Jump Calculator - Main App Logic
 */

class VerticalJumpApp {
    constructor() {
        // State
        this.currentScreen = 'welcome';
        this.userHeightCm = null;
        this.videoBlob = null;
        this.mediaStream = null;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.recordingTimer = null;
        this.recordingSeconds = 0;
        this.countdownTimer = null;

        // DOM Elements
        this.screens = {
            welcome: document.getElementById('screen-welcome'),
            instructions: document.getElementById('screen-instructions'),
            recording: document.getElementById('screen-recording'),
            upload: document.getElementById('screen-upload'),
            analyzing: document.getElementById('screen-analyzing'),
            results: document.getElementById('screen-results'),
            error: document.getElementById('screen-error')
        };

        // Initialize
        this.bindEvents();
        this.initializeHeightInputs();
    }

    // ==================== Screen Navigation ====================

    showScreen(screenName) {
        // Hide all screens
        Object.values(this.screens).forEach(screen => {
            screen.classList.remove('active');
        });

        // Show target screen
        if (this.screens[screenName]) {
            this.screens[screenName].classList.add('active');
            this.currentScreen = screenName;
        }
    }

    // ==================== Event Bindings ====================

    bindEvents() {
        // Height input - unit toggle
        document.querySelectorAll('.unit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleUnitToggle(e));
        });

        // Height inputs - validation
        document.getElementById('height-cm').addEventListener('input', () => this.validateHeightInput());
        document.getElementById('height-ft').addEventListener('input', () => this.validateHeightInput());
        document.getElementById('height-in').addEventListener('input', () => this.validateHeightInput());

        // Continue button
        document.getElementById('btn-continue').addEventListener('click', () => this.handleContinue());

        // Record button
        document.getElementById('btn-record').addEventListener('click', () => this.startRecordingFlow());

        // Upload button
        document.getElementById('btn-upload').addEventListener('click', () => this.handleUploadClick());

        // Video file input
        document.getElementById('video-upload').addEventListener('change', (e) => this.handleFileSelect(e));

        // Recording controls
        document.getElementById('btn-start-recording').addEventListener('click', () => this.toggleRecording());
        document.getElementById('btn-cancel-recording').addEventListener('click', () => this.cancelRecording());

        // Upload preview controls
        document.getElementById('btn-analyze-upload').addEventListener('click', () => this.analyzeVideo());
        document.getElementById('btn-reselect').addEventListener('click', () => this.handleUploadClick());

        // Results
        document.getElementById('btn-try-again').addEventListener('click', () => this.resetApp());

        // Error
        document.getElementById('btn-error-retry').addEventListener('click', () => this.resetApp());
    }

    // ==================== Height Input ====================

    initializeHeightInputs() {
        // Set default focus
        document.getElementById('height-cm').focus();
    }

    handleUnitToggle(e) {
        const unit = e.target.dataset.unit;

        // Update button states
        document.querySelectorAll('.unit-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.unit === unit);
        });

        // Show/hide input groups
        document.getElementById('height-input-cm').classList.toggle('hidden', unit !== 'cm');
        document.getElementById('height-input-imperial').classList.toggle('hidden', unit !== 'imperial');

        // Focus appropriate input
        if (unit === 'cm') {
            document.getElementById('height-cm').focus();
        } else {
            document.getElementById('height-ft').focus();
        }

        this.validateHeightInput();
    }

    validateHeightInput() {
        const isCm = document.querySelector('.unit-btn.active').dataset.unit === 'cm';
        let isValid = false;

        if (isCm) {
            const cm = parseInt(document.getElementById('height-cm').value);
            isValid = cm >= 100 && cm <= 250;
        } else {
            const ft = parseInt(document.getElementById('height-ft').value);
            const inches = parseInt(document.getElementById('height-in').value) || 0;
            isValid = ft >= 3 && ft <= 8 && inches >= 0 && inches <= 11;
        }

        document.getElementById('btn-continue').disabled = !isValid;
        return isValid;
    }

    getHeightInCm() {
        const isCm = document.querySelector('.unit-btn.active').dataset.unit === 'cm';

        if (isCm) {
            return parseInt(document.getElementById('height-cm').value);
        } else {
            const ft = parseInt(document.getElementById('height-ft').value);
            const inches = parseInt(document.getElementById('height-in').value) || 0;
            return Math.round((ft * 12 + inches) * 2.54);
        }
    }

    handleContinue() {
        if (this.validateHeightInput()) {
            this.userHeightCm = this.getHeightInCm();
            this.showScreen('instructions');
        }
    }

    // ==================== Recording Flow ====================

    async startRecordingFlow() {
        this.showScreen('recording');
        document.getElementById('recording-status').textContent = 'Preparing camera...';

        try {
            // Request camera access
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Prefer rear camera
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });

            // Set up preview
            const preview = document.getElementById('camera-preview');
            preview.srcObject = this.mediaStream;
            await preview.play();

            // Show recording button
            document.getElementById('btn-start-recording').classList.remove('hidden');
            document.getElementById('recording-status').textContent = 'Tap to start recording';

        } catch (err) {
            console.error('Camera access error:', err);
            this.showError('Could not access camera. Please check permissions and try again.');
        }
    }

    async toggleRecording() {
        const btn = document.getElementById('btn-start-recording');

        if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
            // Start countdown
            await this.startCountdown();
            this.startRecording();
            btn.classList.add('recording');
        } else {
            this.stopRecording();
            btn.classList.remove('recording');
        }
    }

    startCountdown() {
        return new Promise((resolve) => {
            const overlay = document.getElementById('countdown-overlay');
            const numberEl = overlay.querySelector('.countdown-number');
            overlay.classList.remove('hidden');
            document.getElementById('btn-start-recording').classList.add('hidden');

            let count = 3;
            numberEl.textContent = count;

            this.countdownTimer = setInterval(() => {
                count--;
                if (count > 0) {
                    numberEl.textContent = count;
                } else {
                    clearInterval(this.countdownTimer);
                    overlay.classList.add('hidden');
                    document.getElementById('recording-status').textContent = 'Stand still, then JUMP!';
                    resolve();
                }
            }, 1000);
        });
    }

    startRecording() {
        this.recordedChunks = [];

        // Determine supported MIME type
        const mimeTypes = [
            'video/webm;codecs=vp9',
            'video/webm;codecs=vp8',
            'video/webm',
            'video/mp4'
        ];

        let selectedMimeType = '';
        for (const mimeType of mimeTypes) {
            if (MediaRecorder.isTypeSupported(mimeType)) {
                selectedMimeType = mimeType;
                break;
            }
        }

        try {
            this.mediaRecorder = new MediaRecorder(this.mediaStream, {
                mimeType: selectedMimeType || undefined
            });

            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    this.recordedChunks.push(e.data);
                }
            };

            this.mediaRecorder.onstop = () => {
                this.handleRecordingComplete();
            };

            this.mediaRecorder.start(100); // Collect data every 100ms

            // Show recording indicator
            document.getElementById('recording-indicator').classList.remove('hidden');
            this.startRecordingTimer();

            // Auto-stop after 5 seconds
            setTimeout(() => {
                if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
                    this.stopRecording();
                }
            }, 5000);

        } catch (err) {
            console.error('Recording error:', err);
            this.showError('Could not start recording. Please try again.');
        }
    }

    startRecordingTimer() {
        this.recordingSeconds = 0;
        const timerEl = document.getElementById('rec-timer');
        timerEl.textContent = '0:00';

        this.recordingTimer = setInterval(() => {
            this.recordingSeconds++;
            const secs = this.recordingSeconds % 60;
            timerEl.textContent = `0:${secs.toString().padStart(2, '0')}`;
        }, 1000);
    }

    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
        }

        // Stop timer
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
            this.recordingTimer = null;
        }

        // Hide recording indicator
        document.getElementById('recording-indicator').classList.add('hidden');
    }

    handleRecordingComplete() {
        // Create blob from recorded chunks
        const mimeType = this.mediaRecorder.mimeType || 'video/webm';
        this.videoBlob = new Blob(this.recordedChunks, { type: mimeType });

        // Stop camera stream
        this.stopCameraStream();

        // Proceed to analysis
        this.analyzeVideo();
    }

    cancelRecording() {
        // Stop any ongoing countdown
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
        }

        // Stop recording if active
        this.stopRecording();

        // Stop camera stream
        this.stopCameraStream();

        // Go back to instructions
        this.showScreen('instructions');
    }

    stopCameraStream() {
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }
    }

    // ==================== Upload Flow ====================

    handleUploadClick() {
        document.getElementById('video-upload').click();
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('video/')) {
            this.showError('Please select a video file.');
            return;
        }

        // Create blob and show preview
        this.videoBlob = file;
        const preview = document.getElementById('upload-preview');
        preview.src = URL.createObjectURL(file);

        this.showScreen('upload');

        // Reset file input for future selections
        e.target.value = '';
    }

    // ==================== Analysis ====================

    async analyzeVideo() {
        this.showScreen('analyzing');
        document.getElementById('analysis-status').textContent = 'Loading AI model...';

        try {
            // Create video element for analysis
            const video = document.createElement('video');
            video.src = URL.createObjectURL(this.videoBlob);
            video.playsInline = true;
            video.muted = true;

            // Wait for video to load metadata
            await new Promise((resolve, reject) => {
                video.onloadedmetadata = resolve;
                video.onerror = reject;
                video.load();
            });

            document.getElementById('analysis-status').textContent = 'Analyzing pose data...';

            // Analyze with pose detector
            const jumpHeight = await window.poseAnalyzer.analyzeJump(video, this.userHeightCm, (progress) => {
                document.getElementById('analysis-status').textContent = `Processing frame ${progress}%`;
            });

            // Show results
            this.showResults(jumpHeight);

        } catch (err) {
            console.error('Analysis error:', err);
            // Use specific error message if available, otherwise generic
            const message = err.message || 'Could not analyze the video. Make sure your full body is visible and try again.';
            this.showError(message);
        }
    }

    // ==================== Results ====================

    showResults(heightCm) {
        // Update height display
        document.getElementById('result-cm').textContent = Math.round(heightCm);
        document.getElementById('result-inches').textContent = (heightCm / 2.54).toFixed(1);

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

    // ==================== Error Handling ====================

    showError(message) {
        document.getElementById('error-message').textContent = message;
        this.showScreen('error');
    }

    // ==================== Reset ====================

    resetApp() {
        // Clean up
        this.stopCameraStream();
        this.videoBlob = null;
        this.recordedChunks = [];

        // Reset UI
        document.getElementById('btn-start-recording').classList.remove('hidden', 'recording');
        document.getElementById('countdown-overlay').classList.add('hidden');
        document.getElementById('recording-indicator').classList.add('hidden');

        // Go back to instructions (keep height setting)
        this.showScreen('instructions');
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new VerticalJumpApp();
});

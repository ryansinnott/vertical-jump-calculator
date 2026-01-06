/**
 * Vertical Jump Calculator - Pose Analysis Module
 * Uses TensorFlow.js MoveNet for pose detection
 */

class PoseAnalyzer {
    constructor() {
        this.detector = null;
        this.isModelLoaded = false;
    }

    /**
     * Load the MoveNet pose detection model
     */
    async loadModel() {
        if (this.isModelLoaded) return;

        // Use MoveNet Lightning for best mobile performance
        const model = poseDetection.SupportedModels.MoveNet;
        const detectorConfig = {
            modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
            enableSmoothing: true
        };

        this.detector = await poseDetection.createDetector(model, detectorConfig);
        this.isModelLoaded = true;
    }

    /**
     * Analyze a video to calculate jump height
     * @param {HTMLVideoElement} video - Video element to analyze
     * @param {number} userHeightCm - User's height in centimeters
     * @param {Function} onProgress - Progress callback (0-100)
     * @returns {Promise<number>} - Jump height in centimeters
     */
    async analyzeJump(video, userHeightCm, onProgress) {
        // Load model if not already loaded
        await this.loadModel();

        // Get video dimensions
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        const duration = video.duration;

        // Create canvas for frame extraction
        const canvas = document.createElement('canvas');
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        const ctx = canvas.getContext('2d');

        // Sample frames throughout the video
        const fps = 15; // Analyze at 15 FPS for balance of accuracy/speed
        const totalFrames = Math.floor(duration * fps);
        const frameInterval = 1 / fps;

        const hipPositions = [];
        const bodyHeights = [];

        // Process each frame
        for (let i = 0; i < totalFrames; i++) {
            const currentTime = i * frameInterval;

            // Seek to frame with timeout fallback
            await this.seekVideo(video, currentTime);

            // Small delay to ensure frame is ready
            await new Promise(resolve => setTimeout(resolve, 50));

            // Draw frame to canvas
            ctx.drawImage(video, 0, 0, videoWidth, videoHeight);

            // Detect pose
            const poses = await this.detector.estimatePoses(canvas, {
                flipHorizontal: false
            });

            if (poses.length > 0 && poses[0].keypoints) {
                const keypoints = poses[0].keypoints;
                const poseData = this.extractPoseData(keypoints);

                if (poseData) {
                    hipPositions.push({
                        time: currentTime,
                        y: poseData.hipY,
                        confidence: poseData.confidence
                    });

                    if (poseData.bodyHeight > 0) {
                        bodyHeights.push(poseData.bodyHeight);
                    }
                }
            }

            // Report progress
            if (onProgress) {
                onProgress(Math.round((i / totalFrames) * 100));
            }
        }

        // Calculate jump height
        return this.calculateJumpHeight(hipPositions, bodyHeights, userHeightCm, videoHeight);
    }

    /**
     * Extract relevant pose data from keypoints
     */
    extractPoseData(keypoints) {
        // MoveNet keypoint indices:
        // 0: nose, 5: left_shoulder, 6: right_shoulder,
        // 11: left_hip, 12: right_hip, 15: left_ankle, 16: right_ankle

        const getKeypoint = (name) => keypoints.find(kp => kp.name === name);

        const leftHip = getKeypoint('left_hip');
        const rightHip = getKeypoint('right_hip');
        const leftAnkle = getKeypoint('left_ankle');
        const rightAnkle = getKeypoint('right_ankle');
        const nose = getKeypoint('nose');

        // Need at least hip points
        if (!leftHip || !rightHip) return null;

        const minConfidence = 0.3;

        // Calculate hip center (average of both hips)
        let hipY = null;
        let hipConfidence = 0;

        if (leftHip.score > minConfidence && rightHip.score > minConfidence) {
            hipY = (leftHip.y + rightHip.y) / 2;
            hipConfidence = (leftHip.score + rightHip.score) / 2;
        } else if (leftHip.score > minConfidence) {
            hipY = leftHip.y;
            hipConfidence = leftHip.score;
        } else if (rightHip.score > minConfidence) {
            hipY = rightHip.y;
            hipConfidence = rightHip.score;
        }

        if (hipY === null) return null;

        // Calculate body height (ankle to nose) for calibration
        let bodyHeight = 0;

        const ankleY = this.getAverageY(leftAnkle, rightAnkle, minConfidence);
        const noseY = nose && nose.score > minConfidence ? nose.y : null;

        if (ankleY !== null && noseY !== null) {
            bodyHeight = Math.abs(ankleY - noseY);
        }

        return {
            hipY,
            confidence: hipConfidence,
            bodyHeight
        };
    }

    /**
     * Seek video to specific time with fallback
     */
    seekVideo(video, time) {
        return new Promise((resolve) => {
            const onSeeked = () => {
                video.removeEventListener('seeked', onSeeked);
                resolve();
            };

            video.addEventListener('seeked', onSeeked);
            video.currentTime = time;

            // Fallback timeout in case seeked event doesn't fire
            setTimeout(() => {
                video.removeEventListener('seeked', onSeeked);
                resolve();
            }, 500);
        });
    }

    /**
     * Get average Y position from two keypoints
     */
    getAverageY(kp1, kp2, minConfidence) {
        const valid1 = kp1 && kp1.score > minConfidence;
        const valid2 = kp2 && kp2.score > minConfidence;

        if (valid1 && valid2) {
            return (kp1.y + kp2.y) / 2;
        } else if (valid1) {
            return kp1.y;
        } else if (valid2) {
            return kp2.y;
        }
        return null;
    }

    /**
     * Calculate jump height from pose data
     */
    calculateJumpHeight(hipPositions, bodyHeights, userHeightCm, videoHeight) {
        if (hipPositions.length < 5) {
            throw new Error('Not enough pose data detected. Please ensure your full body is visible.');
        }

        // Filter by confidence
        const confidentPositions = hipPositions.filter(p => p.confidence > 0.4);

        if (confidentPositions.length < 5) {
            throw new Error('Pose detection confidence too low. Please try better lighting.');
        }

        // Calculate pixel-to-cm scale factor
        // Use median body height for stability
        let pixelScale;

        if (bodyHeights.length >= 3) {
            // Sort and get median
            const sortedHeights = [...bodyHeights].sort((a, b) => a - b);
            const medianBodyHeight = sortedHeights[Math.floor(sortedHeights.length / 2)];

            // Body height in pixels represents roughly 90% of total height (nose to ankle)
            const estimatedFullHeightPixels = medianBodyHeight / 0.9;
            pixelScale = userHeightCm / estimatedFullHeightPixels;
        } else {
            // Fallback: assume person takes up about 70% of video height when standing
            const estimatedHeightPixels = videoHeight * 0.7;
            pixelScale = userHeightCm / estimatedHeightPixels;
        }

        // Find standing position (first few frames, person should be still)
        // Use frames from first 1 second to establish baseline
        const standingFrames = confidentPositions.filter(p => p.time < 1.0);
        let standingHipY;

        if (standingFrames.length >= 2) {
            // Average hip position while standing
            standingHipY = standingFrames.reduce((sum, p) => sum + p.y, 0) / standingFrames.length;
        } else {
            // Fallback: use maximum Y (lowest position = standing on ground)
            standingHipY = Math.max(...confidentPositions.map(p => p.y));
        }

        // Find peak of jump (minimum Y value = highest point)
        // In video coordinates, Y increases downward, so minimum Y = highest position
        const peakHipY = Math.min(...confidentPositions.map(p => p.y));

        // Calculate displacement in pixels
        const displacementPixels = standingHipY - peakHipY;

        // Convert to centimeters
        let jumpHeightCm = displacementPixels * pixelScale;

        // Sanity checks and adjustments
        if (jumpHeightCm < 0) {
            jumpHeightCm = 0;
        }

        // Cap at reasonable maximum (world record is about 115cm)
        if (jumpHeightCm > 120) {
            // Likely a detection error, scale back
            jumpHeightCm = jumpHeightCm * 0.5;
        }

        // Minimum threshold - if too small, might be noise
        if (jumpHeightCm < 5) {
            throw new Error('Jump was too small to measure accurately. Try jumping higher.');
        }

        return Math.round(jumpHeightCm * 10) / 10; // Round to 1 decimal
    }
}

// Create global instance
window.poseAnalyzer = new PoseAnalyzer();

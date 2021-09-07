"use strict";
// Our input frames will come from here.
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const controlsElement = document.getElementsByClassName('control-panel')[0];
const canvasCtx = canvasElement.getContext('2d');
// We'll add this to our control panel later, but we'll save it here so we can
// call tick() each time the graph runs.
const fpsControl = new FPS();
// Optimization: Turn off animated spinner after its hiding animation is done.
const spinner = document.querySelector('.loading');
spinner.ontransitionend = () => {
    spinner.style.display = 'none';
};
function onResults(results) {
    console.log(results);
    // Hide the spinner.
    document.body.classList.add('loaded');
    // Update the frame rate.
    fpsControl.tick();
    // Draw the overlays.
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
    if (results.detections.length > 0) {
        drawRectangle(canvasCtx, results.detections[0].boundingBox, { color: 'blue', lineWidth: 4, fillColor: '#00000000' });
        drawLandmarks(canvasCtx, results.detections[0].landmarks, {
            color: 'red',
            radius: 5,
        });
    }
    canvasCtx.restore();
}
const faceDetection = new FaceDetection({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection@0.0/${file}`;
    }
});
//OUTPUT
//DETECTIONS-Collection of detected faces, where each face is represented as bounding box and keypoints
//bounding box-composed of xmin and width (both normalized to [0.0, 1.0] by the image width) and ymin and height (both normalized to [0.0, 1.0] by the image height)
//key points-(right eye, left eye, nose tip, mouth center, right ear tragion, and left ear tragion)-Each key point is composed of x and y(normalized)
faceDetection.setOptions({
    minDetectionConfidence: 0.5
});
faceDetection.onResults(onResults);
// Instantiate a camera. We'll feed each frame we receive into the solution.
const camera = new Camera(videoElement, {
    onFrame: async () => {
        await faceDetection.send({ image: videoElement });
    },
    width: 1280,
    height: 720
});
camera.start();
// Present a control panel through which the user can manipulate the solution
// options.
new ControlPanel(controlsElement, {
    selfieMode: true,
    minDetectionConfidence: 0.5,
})
    .add([
        new StaticText({ title: 'MediaPipe Face Detection' }),
        fpsControl,
        new Toggle({ title: 'Selfie Mode', field: 'selfieMode' }),
        new Slider({
            title: 'Min Detection Confidence',
            field: 'minDetectionConfidence',
            range: [0, 1],
            step: 0.01
        }),
    ])
    .on(options => {
        videoElement.classList.toggle('selfie', options.selfieMode);
        faceDetection.setOptions(options);
    });
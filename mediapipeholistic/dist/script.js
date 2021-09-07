// Our input frames will come from here.
const videoElement =
  document.getElementsByClassName('input_video')[0];
const canvasElement =
  document.getElementsByClassName('output_canvas')[0];
const controlsElement =
  document.getElementsByClassName('control-panel')[0];
const canvasCtx = canvasElement.getContext('2d');

// We'll add this to our control panel later, but we'll save it here so we can
// call tick() each time the graph runs.
const fpsControl = new FPS();

// Optimization: Turn off animated spinner after its hiding animation is done.
const spinner = document.querySelector('.loading');
spinner.ontransitionend = () => {
  spinner.style.display = 'none';
};

function removeElements(landmarks, elements) {
  for (const element of elements) {
    delete landmarks[element];
  }
}

function removeLandmarks(results) {
  if (results.poseLandmarks) {
    removeElements(
      results.poseLandmarks,
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 16, 17, 18, 19, 20, 21, 22]);
  }
}

function connect(ctx, connectors) {
  const canvas = ctx.canvas;
  for (const connector of connectors) {
    const from = connector[0];
    const to = connector[1];
    if (from && to) {
      if (from.visibility && to.visibility &&
        (from.visibility < 0.1 || to.visibility < 0.1)) {
        continue;
      }
      ctx.beginPath();
      ctx.moveTo(from.x * canvas.width, from.y * canvas.height);
      ctx.lineTo(to.x * canvas.width, to.y * canvas.height);
      ctx.stroke();
    }
  }
}

function onResults(results) {
  // console.log(results);

  // Hide the spinner.
  document.body.classList.add('loaded');
  // Remove landmarks we don't want to draw.
  removeLandmarks(results);
  // Update the frame rate.
  fpsControl.tick();

  // Draw the overlays.
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(
    results.image, 0, 0, canvasElement.width, canvasElement.height);

  // Connect elbows to hands. Do this first so that the other graphics will draw
  // on top of these marks.
  canvasCtx.lineWidth = 5;
  if (results.poseLandmarks) {
    if (results.rightHandLandmarks) {
      canvasCtx.strokeStyle = 'white';
      connect(canvasCtx, [[
        results.poseLandmarks[POSE_LANDMARKS.RIGHT_ELBOW],
        results.rightHandLandmarks[0]
      ]]);
    }
    if (results.leftHandLandmarks) {
      canvasCtx.strokeStyle = 'white';
      connect(canvasCtx, [[
        results.poseLandmarks[POSE_LANDMARKS.LEFT_ELBOW],
        results.leftHandLandmarks[0]
      ]]);
    }
  }

  // Pose...
  drawConnectors(
    canvasCtx, results.poseLandmarks, POSE_CONNECTIONS,
    { color: 'white' });
  drawLandmarks(
    canvasCtx,
    Object.values(POSE_LANDMARKS_LEFT)
      .map(index => results.poseLandmarks[index]),
    { visibilityMin: 0.65, color: 'white', fillColor: 'rgb(255,138,0)' });
  drawLandmarks(
    canvasCtx,
    Object.values(POSE_LANDMARKS_RIGHT)
      .map(index => results.poseLandmarks[index]),
    { visibilityMin: 0.65, color: 'white', fillColor: 'rgb(0,217,231)' });

  // Hands...
  drawConnectors(
    canvasCtx, results.rightHandLandmarks, HAND_CONNECTIONS,
    { color: 'white' });
  drawLandmarks(
    canvasCtx, results.rightHandLandmarks, {
    color: 'white',
    fillColor: 'rgb(0,217,231)',
    lineWidth: 2,
    radius: (data) => {
      return lerp(data.from.z, -0.15, .1, 10, 1);
    }
  });
  drawConnectors(
    canvasCtx, results.leftHandLandmarks, HAND_CONNECTIONS,
    { color: 'white' });
  drawLandmarks(
    canvasCtx, results.leftHandLandmarks, {
    color: 'white',
    fillColor: 'rgb(255,138,0)',
    lineWidth: 2,
    radius: (data) => {
      return lerp(data.from.z, -0.15, .1, 10, 1);
    }
  });

  // Face...
  drawConnectors(
    canvasCtx, results.faceLandmarks, FACEMESH_TESSELATION,
    { color: '#C0C0C070', lineWidth: 1 });
  drawConnectors(
    canvasCtx, results.faceLandmarks, FACEMESH_RIGHT_EYE,
    { color: 'rgb(0,217,231)' });
  drawConnectors(
    canvasCtx, results.faceLandmarks, FACEMESH_RIGHT_EYEBROW,
    { color: 'rgb(0,217,231)' });
  drawConnectors(
    canvasCtx, results.faceLandmarks, FACEMESH_LEFT_EYE,
    { color: 'rgb(255,138,0)' });
  drawConnectors(
    canvasCtx, results.faceLandmarks, FACEMESH_LEFT_EYEBROW,
    { color: 'rgb(255,138,0)' });
  drawConnectors(
    canvasCtx, results.faceLandmarks, FACEMESH_FACE_OVAL,
    { color: '#E0E0E0' });
  drawConnectors(
    canvasCtx, results.faceLandmarks, FACEMESH_LIPS,
    { color: '#E0E0E0' });

  canvasCtx.restore();
}

const holistic = new Holistic({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.3.1620694839/${file}`;
  }
});
holistic.onResults(onResults);

/**
 * Instantiate a camera. We'll feed each frame we receive into the solution.
 */
const camera = new Camera(videoElement, {
  onFrame: async () => {
    await holistic.send({ image: videoElement });
  },
  width: 1280,
  height: 720
});
camera.start();

// Present a control panel through which the user can manipulate the solution
// options.
new ControlPanel(controlsElement, {
  selfieMode: true,
  modelComplexity: 1,
  smoothLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
})
  .add([
    new StaticText({ title: 'MediaPipe Holistic' }),
    fpsControl,
    new Toggle({ title: 'Selfie Mode', field: 'selfieMode' }),
    new Slider({
      title: 'Model Complexity',
      field: 'modelComplexity',
      discrete: ['Lite', 'Full', 'Heavy'],
    }),
    new Toggle(
      { title: 'Smooth Landmarks', field: 'smoothLandmarks' }),
    new Slider({
      title: 'Min Detection Confidence',
      field: 'minDetectionConfidence',
      range: [0, 1],
      step: 0.01
    }),
    new Slider({
      title: 'Min Tracking Confidence',
      field: 'minTrackingConfidence',
      range: [0, 1],
      step: 0.01
    }),
  ])
  .on(options => {
    videoElement.classList.toggle('selfie', options.selfieMode);
    holistic.setOptions(options);
  });
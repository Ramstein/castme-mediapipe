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

let activeEffect = 'mask';
function onResults(results) {
  // Hide the spinner.
  document.body.classList.add('loaded');

  // Update the frame rate.
  fpsControl.tick();

  // Draw the overlays.
  canvasCtx.save();

  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  canvasCtx.drawImage(
      results.segmentationMask, 0, 0, canvasElement.width,
      canvasElement.height);


  // Only overwrite existing pixels.
  canvasCtx.globalCompositeOperation = 'source-in';
  if (activeEffect === 'mask') {
    // This can be a color or a texture or whatever...
    canvasCtx.fillStyle = '#00FF00';
    canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);
  } else {
    canvasCtx.drawImage(
        results.image, 0, 0, canvasElement.width, canvasElement.height);
  }

  // Only overwrite missing pixels.
  canvasCtx.globalCompositeOperation = 'destination-atop';
  if (activeEffect === 'background') {
    // This can be a color or a texture or whatever...
    canvasCtx.fillStyle = '#0000FF';
    canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);
  } else {
    canvasCtx.drawImage(
        results.image, 0, 0, canvasElement.width, canvasElement.height);
  }

  canvasCtx.restore();
}

const selfieSegmentation = new SelfieSegmentation({locateFile: (file) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1/${file}`;
}});
// INPUT
// MODEL_SELECTION - An integer index 0 or 1. Use 0 to select the general model, and 1 to select the landscape model (see details in Models). Default to 0 if not specified.
// OUTPUT
// SEGMENTATION_MASK - The output segmentation mask, which has the same dimension as the input image.

// selfieSegmentation.setOptions({
//   modelSelection: 1,
// });
selfieSegmentation.onResults(onResults);

// Instantiate a camera. We'll feed each frame we receive into the solution.
const camera = new Camera(videoElement, {
  onFrame: async () => {
    await selfieSegmentation.send({image: videoElement});
  },
  width: 1280,
  height: 720
});
camera.start();

// Present a control panel through which the user can manipulate the solution
// options.
new ControlPanel(controlsElement, {
      selfieMode: true,
      modelSelection: 1,
      effect: 'background',
    })
    .add([
      new StaticText({title: 'MediaPipe Selfie Segmentation'}),
      fpsControl,
      new Toggle({title: 'Selfie Mode', field: 'selfieMode'}),
      new Slider({
        title: 'Model Selection',
        field: 'modelSelection',
        discrete: ['General', 'Landscape'],
      }),
      new Slider({
        title: 'Effect',
        field: 'effect',
        discrete: {'background': 'Background', 'mask': 'Foreground'},
      }),
    ])
    .on(x => {
      const options = x;
      videoElement.classList.toggle('selfie', options.selfieMode);
      activeEffect = x['effect'];
      selfieSegmentation.setOptions(options);
    });
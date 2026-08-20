// MediaPipe (BlazeFace short range) face scanning helpers for graduate face registration.
//
// This version avoids importing @mediapipe/tasks-vision through Webpack.
// MediaPipe is loaded in the browser at runtime so old Webpack versions
// do not need to parse vision_bundle.mjs.

const MEDIAPIPE_VERSION = '0.10.3'

const LOCAL_WASM_PATH =
  process.env.VUE_APP_MEDIAPIPE_WASM_PATH || '/mediapipe/wasm'

const CDN_PACKAGE_ROOT =
  `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}`

const CDN_VISION_BUNDLE =
  `${CDN_PACKAGE_ROOT}/vision_bundle.mjs`

const CDN_WASM_PATH =
  `${CDN_PACKAGE_ROOT}/wasm`

const LOCAL_MODEL_PATH =
  process.env.VUE_APP_FACE_DETECTOR_MODEL ||
  '/models/mediapipe/blaze_face_short_range.tflite'

const CDN_MODEL_PATH =
  'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite'

export const FACE_DETECTOR_MODEL_NAME = 'blaze_face_short_range'

export const FACE_SCAN_SOURCE =
  `mediapipe-${FACE_DETECTOR_MODEL_NAME}`

export const FACE_SCAN_THRESHOLDS = {
  minScore: 0.6,
  minCoverage: 0.26,
  maxCoverage: 0.8,
  maxOffsetX: 0.15,
  maxOffsetY: 0.17,
  maxRoll: 14,
  maxYaw: 0.36,
  minBrightness: 42,
  maxBrightness: 242
}

export const FACE_SCAN_MESSAGES = {
  NO_FACE: 'ไม่พบใบหน้าในกรอบ กรุณาหันหน้าเข้ากล้อง',
  MULTIPLE_FACES: 'พบใบหน้ามากกว่า 1 คน กรุณาให้เหลือเฉพาะบัณฑิตในกรอบ',
  LOW_SCORE: 'ระบบยังตรวจจับใบหน้าได้ไม่ชัดเจน กรุณาอยู่นิ่งและมองตรง',
  TOO_FAR: 'ใบหน้าเล็กเกินไป กรุณาขยับเข้าใกล้กล้องมากขึ้น',
  TOO_CLOSE: 'ใบหน้าใหญ่เกินไป กรุณาถอยห่างจากกล้องเล็กน้อย',
  OFF_CENTER: 'กรุณาจัดใบหน้าให้อยู่กลางกรอบ',
  TILTED: 'ศีรษะเอียงมากเกินไป กรุณาตั้งศีรษะให้ตรง',
  TURNED: 'กรุณามองตรงเข้ากล้อง ไม่หันหน้าไปด้านข้าง',
  TOO_DARK: 'แสงน้อยเกินไป กรุณาย้ายไปบริเวณที่มีแสงสว่างเพียงพอ',
  TOO_BRIGHT: 'แสงจ้าเกินไป กรุณาหลีกเลี่ยงแสงย้อนหลัง',
  READY: 'ตรวจพบใบหน้าชัดเจน อยู่นิ่ง ๆ ระบบกำลังถ่ายภาพ'
}

let detectorPromise = null
let detectorInstance = null
let visionBundlePromise = null
let brightnessCanvas = null

function numberOrNull (value) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

function roundTo (value, digits) {
  const numeric = numberOrNull(value)

  if (numeric === null) {
    return null
  }

  const factor = Math.pow(10, digits)

  return Math.round(numeric * factor) / factor
}

/*
 * IMPORTANT:
 *
 * Do NOT change this back to:
 *
 * import('@mediapipe/tasks-vision')
 *
 * because Webpack 4 will try to parse vision_bundle.mjs and can fail with:
 *
 * Module parse failed: Unexpected token
 *
 * new Function() is used intentionally so Webpack does not process the import.
 */
function importVisionBundle () {
  if (visionBundlePromise) {
    return visionBundlePromise
  }

  try {
    // eslint-disable-next-line no-new-func
    const nativeImport = new Function(
      'url',
      'return import(url)'
    )

    visionBundlePromise = nativeImport(CDN_VISION_BUNDLE)
      .catch(error => {
        visionBundlePromise = null
        throw error
      })

    return visionBundlePromise
  } catch (error) {
    visionBundlePromise = null

    return Promise.reject(error)
  }
}

async function resolveFileset (FilesetResolver) {
  try {
    return await FilesetResolver.forVisionTasks(
      LOCAL_WASM_PATH
    )
  } catch (error) {
    console.warn(
      '[MediaPipe] Local WASM unavailable. Using CDN.',
      error
    )

    return FilesetResolver.forVisionTasks(
      CDN_WASM_PATH
    )
  }
}

async function createDetector () {
  const vision = await importVisionBundle()

  if (!vision) {
    throw new Error('Unable to load MediaPipe Tasks Vision')
  }

  const FaceDetector = vision.FaceDetector
  const FilesetResolver = vision.FilesetResolver

  if (!FaceDetector || !FilesetResolver) {
    throw new Error(
      'MediaPipe FaceDetector or FilesetResolver is unavailable'
    )
  }

  const fileset = await resolveFileset(
    FilesetResolver
  )

  const localOptions = {
    baseOptions: {
      modelAssetPath: LOCAL_MODEL_PATH,
      delegate: 'GPU'
    },

    runningMode: 'VIDEO',

    minDetectionConfidence: 0.5
  }

  try {
    return await FaceDetector.createFromOptions(
      fileset,
      localOptions
    )
  } catch (error) {
    console.warn(
      '[MediaPipe] Local model/GPU failed. Using CDN model + CPU.',
      error
    )

    const fallbackOptions = {
      baseOptions: {
        modelAssetPath: CDN_MODEL_PATH,
        delegate: 'CPU'
      },

      runningMode: 'VIDEO',

      minDetectionConfidence: 0.5
    }

    return FaceDetector.createFromOptions(
      fileset,
      fallbackOptions
    )
  }
}

export function loadFaceDetector () {
  if (detectorInstance) {
    return Promise.resolve(
      detectorInstance
    )
  }

  if (!detectorPromise) {
    detectorPromise = createDetector()
      .then(detector => {
        detectorInstance = detector

        return detector
      })
      .catch(error => {
        detectorPromise = null

        console.error(
          '[MediaPipe] Failed to create FaceDetector:',
          error
        )

        throw error
      })
  }

  return detectorPromise
}

export function disposeFaceDetector () {
  if (
    detectorInstance &&
    typeof detectorInstance.close === 'function'
  ) {
    detectorInstance.close()
  }

  detectorInstance = null
  detectorPromise = null
}

function normalizedBox (
  detection,
  frameWidth,
  frameHeight
) {
  const box =
    detection &&
    detection.boundingBox

  if (
    !box ||
    !frameWidth ||
    !frameHeight
  ) {
    return null
  }

  const originX =
    numberOrNull(
      box.originX !== undefined
        ? box.originX
        : box.x
    ) || 0

  const originY =
    numberOrNull(
      box.originY !== undefined
        ? box.originY
        : box.y
    ) || 0

  const width =
    numberOrNull(box.width) || 0

  const height =
    numberOrNull(box.height) || 0

  if (
    width <= 0 ||
    height <= 0
  ) {
    return null
  }

  return {
    x: originX / frameWidth,
    y: originY / frameHeight,
    width: width / frameWidth,
    height: height / frameHeight
  }
}

function detectionScore (detection) {
  const categories =
    detection &&
    Array.isArray(detection.categories)
      ? detection.categories
      : []

  return categories.reduce(
    (best, category) => {
      const score = numberOrNull(
        category &&
        category.score
      )

      return (
        score !== null &&
        score > best
      )
        ? score
        : best
    },
    0
  )
}

function keypointGeometry (detection) {
  const keypoints =
    detection &&
    Array.isArray(detection.keypoints)
      ? detection.keypoints
      : []

  const rightEye = keypoints[0]
  const leftEye = keypoints[1]
  const nose = keypoints[2]

  if (
    !rightEye ||
    !leftEye
  ) {
    return {
      roll: null,
      yaw: null
    }
  }

  const rightEyeX =
    numberOrNull(rightEye.x)

  const rightEyeY =
    numberOrNull(rightEye.y)

  const leftEyeX =
    numberOrNull(leftEye.x)

  const leftEyeY =
    numberOrNull(leftEye.y)

  if (
    rightEyeX === null ||
    rightEyeY === null ||
    leftEyeX === null ||
    leftEyeY === null
  ) {
    return {
      roll: null,
      yaw: null
    }
  }

  const eyeDeltaX =
    leftEyeX - rightEyeX

  const eyeDeltaY =
    leftEyeY - rightEyeY

  const eyeDistance =
    Math.sqrt(
      (eyeDeltaX * eyeDeltaX) +
      (eyeDeltaY * eyeDeltaY)
    )

  const rawRoll =
    Math.abs(
      Math.atan2(
        eyeDeltaY,
        eyeDeltaX
      ) *
      (180 / Math.PI)
    )

  const roll =
    rawRoll > 90
      ? 180 - rawRoll
      : rawRoll

  let yaw = null

  if (
    nose &&
    eyeDistance > 0
  ) {
    const noseX =
      numberOrNull(nose.x)

    if (noseX !== null) {
      const eyeMidX =
        (
          leftEyeX +
          rightEyeX
        ) / 2

      yaw =
        Math.abs(
          (noseX - eyeMidX) /
          eyeDistance
        )
    }
  }

  return {
    roll,
    yaw
  }
}

function issueFor (
  metrics,
  thresholds
) {
  if (
    metrics.faceCount === 0
  ) {
    return 'NO_FACE'
  }

  if (
    metrics.faceCount > 1
  ) {
    return 'MULTIPLE_FACES'
  }

  if (
    metrics.coverage === null
  ) {
    return 'NO_FACE'
  }

  if (
    metrics.coverage <
    thresholds.minCoverage
  ) {
    return 'TOO_FAR'
  }

  if (
    metrics.coverage >
    thresholds.maxCoverage
  ) {
    return 'TOO_CLOSE'
  }

  if (
    metrics.offsetX >
    thresholds.maxOffsetX ||
    metrics.offsetY >
    thresholds.maxOffsetY
  ) {
    return 'OFF_CENTER'
  }

  if (
    metrics.roll !== null &&
    metrics.roll >
    thresholds.maxRoll
  ) {
    return 'TILTED'
  }

  if (
    metrics.yaw !== null &&
    metrics.yaw >
    thresholds.maxYaw
  ) {
    return 'TURNED'
  }

  if (
    metrics.brightness !== null &&
    metrics.brightness <
    thresholds.minBrightness
  ) {
    return 'TOO_DARK'
  }

  if (
    metrics.brightness !== null &&
    metrics.brightness >
    thresholds.maxBrightness
  ) {
    return 'TOO_BRIGHT'
  }

  if (
    metrics.score <
    thresholds.minScore
  ) {
    return 'LOW_SCORE'
  }

  return ''
}

export function evaluateFaceScan (
  result,
  frame,
  overrides
) {
  const thresholds =
    Object.assign(
      {},
      FACE_SCAN_THRESHOLDS,
      overrides || {}
    )

  const detections =
    result &&
    Array.isArray(result.detections)
      ? result.detections
      : []

  const frameWidth =
    numberOrNull(
      frame &&
      frame.width
    ) || 0

  const frameHeight =
    numberOrNull(
      frame &&
      frame.height
    ) || 0

  const best =
    detections.reduce(
      (current, detection) => {
        if (!current) {
          return detection
        }

        return (
          detectionScore(detection) >
          detectionScore(current)
        )
          ? detection
          : current
      },
      null
    )

  const box =
    normalizedBox(
      best,
      frameWidth,
      frameHeight
    )

  const geometry =
    keypointGeometry(best)

  const metrics = {
    faceCount: detections.length,

    score:
      roundTo(
        detectionScore(best),
        4
      ) || 0,

    coverage:
      box
        ? roundTo(
            box.height,
            4
          )
        : null,

    offsetX:
      box
        ? roundTo(
            Math.abs(
              (
                box.x +
                (box.width / 2)
              ) -
              0.5
            ),
            4
          )
        : null,

    offsetY:
      box
        ? roundTo(
            Math.abs(
              (
                box.y +
                (box.height / 2)
              ) -
              0.5
            ),
            4
          )
        : null,

    roll:
      roundTo(
        geometry.roll,
        2
      ),

    yaw:
      roundTo(
        geometry.yaw,
        4
      ),

    brightness:
      roundTo(
        frame &&
        frame.brightness,
        2
      ),

    frameWidth,
    frameHeight
  }

  const code =
    issueFor(
      metrics,
      thresholds
    )

  return {
    ok: !code,

    code:
      code || 'READY',

    message:
      FACE_SCAN_MESSAGES[
        code || 'READY'
      ],

    metrics,
    box
  }
}

export function frameBrightness (video) {
  if (
    !video ||
    !video.videoWidth ||
    !video.videoHeight
  ) {
    return null
  }

  if (
    typeof document === 'undefined'
  ) {
    return null
  }

  if (!brightnessCanvas) {
    brightnessCanvas =
      document.createElement(
        'canvas'
      )
  }

  brightnessCanvas.width = 40
  brightnessCanvas.height = 30

  const context =
    brightnessCanvas.getContext(
      '2d'
    )

  if (!context) {
    return null
  }

  try {
    context.drawImage(
      video,
      0,
      0,
      brightnessCanvas.width,
      brightnessCanvas.height
    )

    const imageData =
      context.getImageData(
        0,
        0,
        brightnessCanvas.width,
        brightnessCanvas.height
      )

    const data =
      imageData.data

    let total = 0

    for (
      let index = 0;
      index < data.length;
      index += 4
    ) {
      total +=
        (0.299 * data[index]) +
        (0.587 * data[index + 1]) +
        (0.114 * data[index + 2])
    }

    return (
      total /
      (data.length / 4)
    )
  } catch (error) {
    return null
  }
}

export function captureFaceImage (
  video,
  canvas,
  options
) {
  const settings =
    Object.assign(
      {
        maxWidth: 720,
        quality: 0.86
      },
      options || {}
    )

  if (
    !video ||
    !canvas ||
    !video.videoWidth ||
    !video.videoHeight
  ) {
    return null
  }

  const scale =
    Math.min(
      1,
      settings.maxWidth /
      video.videoWidth
    )

  canvas.width =
    Math.round(
      video.videoWidth *
      scale
    )

  canvas.height =
    Math.round(
      video.videoHeight *
      scale
    )

  const context =
    canvas.getContext('2d')

  if (!context) {
    return null
  }

  context.drawImage(
    video,
    0,
    0,
    canvas.width,
    canvas.height
  )

  const dataUrl =
    canvas.toDataURL(
      'image/jpeg',
      settings.quality
    )

  return {
    dataUrl,

    width:
      canvas.width,

    height:
      canvas.height,

    bytes:
      Math.floor(
        (
          (
            dataUrl.split(',')[1] ||
            ''
          ).length *
          3
        ) / 4
      )
  }
}
/**
 * Scan current video frame with MediaPipe FaceDetector
 * and evaluate whether the face is good enough for capture.
 */
export async function scanFaceFrame (video) {
  if (
    !video ||
    !video.videoWidth ||
    !video.videoHeight
  ) {
    return {
      ok: false,
      code: 'VIDEO_NOT_READY',
      message: 'กล้องยังไม่พร้อม',
      metrics: null,
      box: null
    }
  }

  try {
    const detector = await loadFaceDetector()

    const timestamp =
      typeof performance !== 'undefined'
        ? performance.now()
        : Date.now()

    const result = detector.detectForVideo(
      video,
      timestamp
    )

    const brightness =
      frameBrightness(video)

    return evaluateFaceScan(
      result,
      {
        width: video.videoWidth,
        height: video.videoHeight,
        brightness
      }
    )
  } catch (error) {
    console.error(
      '[MediaPipe] scanFaceFrame failed:',
      error
    )

    return {
      ok: false,
      code: 'SCAN_ERROR',
      message: 'ไม่สามารถตรวจจับใบหน้าได้',
      metrics: null,
      box: null,
      error
    }
  }
}
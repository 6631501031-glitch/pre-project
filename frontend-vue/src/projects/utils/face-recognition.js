import * as faceapi from 'face-api.js'

const MODEL_URL = '/models'
const MATCH_THRESHOLD = 0.55
let modelPromise = null

export function loadFaceRecognitionModels () {
  if (!modelPromise) {
    modelPromise = Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
    ]).catch(error => {
      modelPromise = null
      throw error
    })
  }
  return modelPromise
}

async function descriptorFromInput (input) {
  const result = await faceapi
    .detectSingleFace(input, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptor()
  return result ? result.descriptor : null
}

function imageFromDataUrl (dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('REFERENCE_FACE_IMAGE_INVALID'))
    image.src = dataUrl
  })
}

export async function buildFaceRosterDescriptors (rows) {
  await loadFaceRecognitionModels()
  const descriptors = []
  for (const row of rows || []) {
    try {
      const image = await imageFromDataUrl(row.facePhoto)
      const descriptor = await descriptorFromInput(image)
      if (descriptor) descriptors.push({ row, descriptor })
    } catch (error) {
      // Skip an unreadable legacy image; other saved faces remain available.
    }
  }
  return descriptors
}

export async function matchFaceDataUrl (dataUrl, roster, threshold = MATCH_THRESHOLD) {
  await loadFaceRecognitionModels()
  const image = await imageFromDataUrl(dataUrl)
  const probe = await descriptorFromInput(image)
  if (!probe) return { matched: false, reason: 'NO_FACE' }

  let best = null
  ;(roster || []).forEach(candidate => {
    const distance = faceapi.euclideanDistance(probe, candidate.descriptor)
    if (!best || distance < best.distance) best = { row: candidate.row, distance }
  })

  if (!best || best.distance > threshold) {
    return { matched: false, reason: 'NO_MATCH', distance: best && best.distance }
  }
  return {
    matched: true,
    row: best.row,
    distance: best.distance,
    confidence: Math.max(0, Math.min(1, 1 - best.distance))
  }
}

export { MATCH_THRESHOLD }

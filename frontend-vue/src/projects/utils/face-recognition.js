let runtimePromise
const ASSET_PATH = '/face-recognition'

export function loadRecognition () {
  if (!runtimePromise) {
    runtimePromise = new Promise((resolve, reject) => {
      if (window.faceapi) return resolve(window.faceapi)
      const script = document.createElement('script')
      script.src = ASSET_PATH + '/face-api.min.js'
      script.onload = () => window.faceapi ? resolve(window.faceapi) : reject(new Error('Face runtime unavailable'))
      script.onerror = () => { script.remove(); reject(new Error('Face runtime unavailable')) }
      document.head.appendChild(script)
    }).then(async faceapi => {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(ASSET_PATH),
        faceapi.nets.faceLandmark68Net.loadFromUri(ASSET_PATH),
        faceapi.nets.faceRecognitionNet.loadFromUri(ASSET_PATH)
      ])
      return faceapi
    }).catch(error => { runtimePromise = null; throw error })
  }
  return runtimePromise
}

export async function describeFaces (input) {
  const faceapi = await loadRecognition()
  return faceapi.detectAllFaces(input, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.6 }))
    .withFaceLandmarks().withFaceDescriptors()
}

export async function referenceDescriptor (dataUrl) {
  const image = new Image()
  await new Promise((resolve, reject) => {
    image.onload = resolve
    image.onerror = () => reject(new Error('Invalid reference image'))
    image.src = dataUrl
  })
  const faces = await describeFaces(image)
  return faces.length === 1 ? faces[0].descriptor : null
}

export function matchFace (descriptor, gallery) {
  if (!descriptor || descriptor.length !== 128 || !Array.from(descriptor).every(Number.isFinite)) return null
  const ranked = gallery.map(item => {
    let sum = 0
    for (let i = 0; i < 128; i++) sum += Math.pow(descriptor[i] - item.descriptor[i], 2)
    return { row: item.row, distance: Math.sqrt(sum) }
  }).filter(item => Number.isFinite(item.distance)).sort((a, b) => a.distance - b.distance)
  const best = ranked[0]
  // Reject unknown faces and near-ties rather than assigning the closest name blindly.
  if (!best || best.distance > 0.5 || (ranked[1] && ranked[1].distance - best.distance < 0.08)) return null
  return best
}

export function createConfirmationTracker () {
  const observations = new Map()
  return {
    observe (matches, now) {
      const current = new Set(matches.map(match => String(match.row._id)))
      for (const id of observations.keys()) if (!current.has(id)) observations.delete(id)
      return matches.filter(match => {
        const id = String(match.row._id)
        const prior = observations.get(id)
        const count = prior && now - prior.time < 2500 ? prior.count + 1 : 1
        observations.set(id, { count, time: now })
        return count >= 2
      })
    },
    clear () { observations.clear() }
  }
}

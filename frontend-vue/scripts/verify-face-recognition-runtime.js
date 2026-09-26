// Smoke-test the actual locally served models in a headless Edge browser.
const http = require('http')
const fs = require('fs')
const path = require('path')
const os = require('os')
const { spawn } = require('child_process')
const WebSocket = require('ws')
const root = path.resolve(__dirname, '../public/face-recognition')
const server = http.createServer((req, res) => {
  if (req.url === '/') {
    res.setHeader('Content-Type', 'text/html')
    return res.end('<script src="/face-api.min.js"></script>')
  }
  const file = path.join(root, path.basename(req.url))
  if (!fs.existsSync(file)) { res.statusCode = 404; return res.end() }
  res.setHeader('Content-Type', file.endsWith('.js') ? 'application/javascript' : 'application/octet-stream')
  fs.createReadStream(file).pipe(res)
})
let browser, socket
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
async function main () {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const url = 'http://127.0.0.1:' + server.address().port
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'graduate-face-smoke-'))
  browser = spawn(process.env.EDGE_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', [
    '--headless=new', '--no-first-run', '--disable-gpu', '--remote-debugging-port=0', '--user-data-dir=' + profile, url
  ], { windowsHide: true, stdio: 'ignore' })
  let port
  for (let i = 0; i < 50; i++) {
    try { port = fs.readFileSync(path.join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0]; break } catch (error) { await sleep(200) }
  }
  if (!port) throw new Error('Browser did not start')
  const targets = await (await fetch('http://127.0.0.1:' + port + '/json')).json()
  socket = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl)
  await new Promise(resolve => socket.on('open', resolve))
  await sleep(1500)
  const result = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Browser inference timeout')), 45000)
    socket.on('message', data => {
      const message = JSON.parse(data)
      if (message.method === 'Inspector.targetCrashed') { clearTimeout(timeout); reject(new Error('Browser target crashed')); return }
      if (message.id === 1) { clearTimeout(timeout); resolve(message) }
    })
    socket.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: {
      expression: `(async () => {
        for (let i = 0; i < 100 && !window.faceapi; i++) await new Promise(r => setTimeout(r, 100));
        const f = window.faceapi;
        await f.tf.setBackend('cpu');
        await Promise.all([f.nets.tinyFaceDetector.loadFromUri('/'), f.nets.faceLandmark68Net.loadFromUri('/'), f.nets.faceRecognitionNet.loadFromUri('/')]);
        const canvas = document.createElement('canvas'); canvas.width = 160; canvas.height = 160;
        const faces = await f.detectAllFaces(canvas, new f.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors();
        const descriptor = await f.computeFaceDescriptor(canvas);
        return { emptyFrameFaces: faces.length, descriptorLength: descriptor.length, finite: Array.from(descriptor).every(Number.isFinite) };
      })()`, awaitPromise: true, returnByValue: true
    } }))
  })
  if (result.error || result.result.exceptionDetails) throw new Error(JSON.stringify(result))
  const value = result.result.result.value
  if (value.emptyFrameFaces !== 0 || value.descriptorLength !== 128 || !value.finite) throw new Error('Invalid model inference: ' + JSON.stringify(value))
  console.log('PASS: local browser model inference', value)
}
main().catch(error => { console.error(error.message); process.exitCode = 1 }).finally(() => {
  if (socket) socket.close()
  if (browser) browser.kill()
  server.close()
})

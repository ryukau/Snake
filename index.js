// const start
const EPS = 1e-5
const screenMargin = 10
const snakeLength = 1
const snakeBodyDelay = 10
const snakeExplodeSpeed = 5
const popupLifetimeMax = 120
// const end

class Snake {
  constructor(canvas, position) {
    this.canvas = canvas
    this.speed = 1
    this.speedRotation = this.setSpeedRotation()
    this.position = position.clone()
    this.velocity = new Vec2(0, this.speed)
    this.radius = 5
    this.isCrashed = false
    this.reasonOfDeath = "was bitten by some bug"
    this.speedUpTimer = 0

    // snakeの体は2次元配列 this.body[n][m] で表現される。
    // nは体節の数。
    // mは遅延の数。
    this.body = [this.makeDelayline(this.position)]
    for (var i = 1; i < snakeLength - 1; ++i) {
      this.body.push(this.makeDelayline(this.position))
    }
  }

  get length() {
    return this.body.length
  }

  setSpeedRotation() {
    return this.speed * 0.1
  }

  makeDelayline(position) {
    this.delay = new Array(snakeBodyDelay)
    for (var i = 0; i < this.delay.length; ++i) {
      this.delay[i] = position.clone()
    }
    return this.delay
  }

  draw(canvas) {
    // 体をつなぐ線。
    if (!this.isCrashed) {
      canvas.context.lineWidth = 2
      canvas.context.strokeStyle = "#888888"
      for (var i = 1; i < this.body.length; ++i) {
        canvas.drawLine(this.body[i - 1][0], this.body[i][0])
      }
    }

    // 頭だけ色を変える。
    canvas.context.fillStyle = "#ffa060"
    canvas.drawPoint(this.body[0][0], this.radius)

    canvas.context.fillStyle = "#1237b9"
    for (var i = 1; i < this.body.length; ++i) {
      canvas.drawPoint(this.body[i][0], this.radius)
    }
  }

  move(control) {
    if (this.isCrashed) {
      for (var i = 0; i < this.body.length; ++i) {
        // 壁にはね返る。
        if (this.body[i][0].x < 0) {
          this.body[i][1].x = -this.body[i][1].x
          this.body[i][0].x = 0
        } else if (this.body[i][0].x >= this.canvas.width) {
          this.body[i][1].x = -this.body[i][1].x
          this.body[i][0].x = this.canvas.width - 1
        } else if (this.body[i][0].y < 0) {
          this.body[i][1].y = -this.body[i][1].y
          this.body[i][0].y = 0
        } else if (this.body[i][0].y >= this.canvas.height) {
          this.body[i][1].y = -this.body[i][1].y
          this.body[i][0].y = this.canvas.height - 1
        }
        this.body[i][0].add(this.body[i][1])
      }
    } else {
      // 旋回
      if (control.left.isActive) {
        this.velocity.rotate(-this.speedRotation)
      } else if (control.right.isActive) {
        this.velocity.rotate(this.speedRotation)
      }

      // アクセル
      if (this.speedUpTimer > 0) {
        this.speedUpTimer -= 1
        this.speed = 3
      } else {
        this.speed = 1
      }

      this.velocity.normalize().mul(this.speed)
      this.position.add(this.velocity)

      var position = this.position.clone()
      for (var i = 0; i < this.body.length; ++i) {
        this.body[i].push(position)
        position = this.body[i].shift(position)
      }

      if (this.isCrashing()) {
        this.isCrashed = true

        // 体がバラバラになるときの速度を決める。
        for (var i = 0; i < this.body.length; ++i) {
          this.body[i][1] = new Vec2(
            (Math.random() - 0.5) * snakeExplodeSpeed,
            (Math.random() - 0.5) * snakeExplodeSpeed
          )
        }
      }
    }
  }

  isCrashing() {
    if (this.isSelfIntersecting()) {
      this.reasonOfDeath = "was self intersecting"
      play(audioContext, audioBufferDie)
      return true
    }
    if (this.isOutOfScreen()) {
      this.reasonOfDeath = "went out of screen"
      play(audioContext, audioBufferDie)
      return true
    }
    return false
  }

  isSelfIntersecting() {
    for (var i = 1; i < this.body.length; ++i) {
      var a = this.body[i - 1][0]
      var b = this.body[i][0]
      // 隣合う体節は常に交差していないことにするのでi + 2。
      for (var j = i + 2; j < this.body.length; ++j) {
        var c = this.body[j - 1][0]
        var d = this.body[j][0]
        if (intersectSegmentSegment(a, b, c, d) !== null) {
          return true
        }
      }
    }
    return false
  }

  isOutOfScreen(canvas) {
    if (this.position.x >= -screenMargin
      && this.position.x < this.canvas.width + screenMargin
      && this.position.y >= -screenMargin
      && this.position.y < this.canvas.height + screenMargin
    ) {
      return false
    }
    return true
  }

  hitTest(food) {
    var distance = Vec2.sub(this.position, food.position)
    if (distance.length() < this.radius + food.radius) {
      var lastBodyPosition = this.body[this.body.length - 1][0]
      this.body.push(this.makeDelayline(lastBodyPosition))
      this.speedUpTimer += this.body.length
      if (highScore < this.body.length) {
        highScore = this.body.length
      }
      return true
    }
    return false
  }
}

class Food {
  constructor(canvas) {
    this.canvas = canvas
    this.position = null
    this.fillIndex = Math.floor(Math.random() * paletteFood.length)
    this.radius = 10

    this.replace(true)
  }

  draw(canvas) {
    var color = paletteFood[this.fillIndex]
    canvas.context.fillStyle = color
    canvas.context.shadowBlur = 1
    canvas.context.shadowColor = color
    canvas.drawPoint(this.position, 10)
    this.fillIndex = (this.fillIndex + 1) % paletteFood.length

    canvas.context.shadowBlur = 0
    canvas.context.shadowColor = "#000000"
  }

  replace(init) {
    var position = new Vec2(1, 0)
    position.rotate(2 * Math.PI * Math.random())

    var x = this.canvas.center.x
    var y = this.canvas.center.y
    var radius = Math.abs(x > y ? y : x) - this.radius
    if (init === true) {
      position.mul(radius * (0.5 + 0.5 * Math.random()))
    } else {
      play(audioContext, audioBufferFood[soundIndexFood])
      soundIndexFood = (soundIndexFood + 1) % audioBufferFood.length
      position.mul(radius * Math.random())
    }
    position.add(new Vec2(x, y))

    this.position = position
  }
}

class ScorePopup {
  constructor(canvas) {
    this.canvas = canvas
    this.popup = []
  }

  push(position, score) {
    this.popup.push({
      position: position,
      score: score,
      lifetime: popupLifetimeMax - 1,
    })
  }

  draw(canvas) {
    for (var i = 0; i < this.popup.length; ++i) {
      var color = paletteScorePopup[this.popup[i].lifetime]
      canvas.context.fillStyle = color
      canvas.context.font = "16px serif"
      canvas.drawText(this.popup[i].position, `${this.popup[i].score}`)
    }

    for (var i = 0; i < this.popup.length; ++i) {
      this.popup[i].position.y -= 0.4
      this.popup[i].lifetime -= 1
    }

    this.popup = this.popup.filter((element, index, array) => {
      return element.lifetime >= 0
    })
  }
}

/// utils
function mod(n, m) {
  return (n % m + m) % m
}

// 線分(a, b)と線分(c, d)の交差。
function intersectSegmentSegment(a, b, c, d) {
  var s1x = b.x - a.x
  var s1y = b.y - a.y
  var s2x = d.x - c.x
  var s2y = d.y - c.y
  var denom = s1x * s2y - s2x * s1y
  var acx = a.x - c.x
  var acy = a.y - c.y
  var ss = s1x * acy - s1y * acx
  var tt = s2x * acy - s2y * acx
  if (Math.abs(denom) < EPS) { // 2つの線分は平行。
    // if (Math.abs(ss) < EPS || Math.abs(tt) < EPS) { // 2つの線分は一直線上。
    //   var A = Math.sign(acx) === Math.sign(b.x - c.x)
    //   var B = Math.sign(acy) === Math.sign(b.y - c.y)
    //   if (!(A && B)) { // c は(a, b)の間にある。
    //     var CC = Math.sign(-acx) === Math.sign(d.x - a.x)
    //     var DD = Math.sign(-acy) === Math.sign(d.y - a.y)
    //     if (!(CC && DD)) { // a は(c, d)の間にある。
    //       return Vec2.mid(c, a)
    //     }
    //     return Vec2.mid(c, b) // b は(c, d)の間にある。
    //   }
    //   var C = Math.sign(a.x - d.x) === Math.sign(b.x - d.x)
    //   var D = Math.sign(a.y - d.y) === Math.sign(b.y - d.y)
    //   if (!(C && D)) { // d は(a, b)の間にある。
    //     var AA = Math.sign(-acx) === Math.sign(d.x - a.x)
    //     var BB = Math.sign(-acy) === Math.sign(d.y - a.y)
    //     if (!(CC && DD)) { // a は(c, d)の間にある。
    //       return Vec2.mid(d, a)
    //     }
    //     return Vec2.mid(d, b) // b は(c, d)の間にある。
    //   }
    // }
    return null
  }
  var s = ss / denom
  var t = tt / denom

  if (0 <= s && s <= 1 && 0 <= t && t <= 1) {
    return new Vec2(a.x + t * s1x, a.y + t * s1y)
  }
  return null
}

// http://stackoverflow.com/questions/17242144/javascript-convert-hsb-hsv-color-to-rgb-accurately
// h = [0.0, 1.0]
// s = [0.0, 1.0]
// v = [0.0, 1.0]
function HSVtoRGB(h, s, v) {
  var r, g, b, i, f, p, q, t;
  if (arguments.length === 1) {
    s = h.s, v = h.v, h = h.h;
  }
  i = Math.floor(h * 6);
  f = h * 6 - i;
  p = v * (1 - s);
  q = v * (1 - f * s);
  t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: r = v, g = t, b = p; break;
    case 1: r = q, g = v, b = p; break;
    case 2: r = p, g = v, b = t; break;
    case 3: r = p, g = q, b = v; break;
    case 4: r = t, g = p, b = v; break;
    case 5: r = v, g = p, b = q; break;
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

function makeFoodPalette() {
  var max = 128
  var palette = []
  for (var index = 0; index < max; ++index) {
    var h = 0.05 * Math.sin(Math.PI * index / max) + 0.1
    var s = 0.02 * Math.sin(Math.PI * index / max) + 0.92
    var { r, g, b } = HSVtoRGB(h, s, 0.95)
    palette.push(`rgb(${r},${g},${b})`)
  }
  return palette
}

function makeScorePopupPalette() {
  var palette = []
  for (var i = 0; i < popupLifetimeMax; ++i) {
    var h = 0.52
    var { r, g, b } = HSVtoRGB(h, 1, 1)
    var a = 0.8 * i / (popupLifetimeMax - 1)
    palette.push(`rgba(${r},${g},${b},${a})`)
  }
  return palette
}

function makePolyTitle() {
  var poly = []
  poly.push(new Vec2(canvas.width, canvas.height))
  poly.push(new Vec2(canvas.width, 0))
  var xBase = canvas.width - 100
  var x = xBase
  var y = 0
  var t = Date.now() * 0.0015
  while (y < canvas.height) {
    var yt = y * 0.1 + t
    x = xBase + 50 * Math.sin(yt + Math.sin(yt * 0.1) * 3 * Math.sin(yt * 2.01))
    poly.push(new Vec2(x, y))
    y += 4
    poly.push(new Vec2(x, y))
  }
  return poly
}

/// Game
function gameLoop(canvas, control) {
  gameDraw(canvas)
  gameMove(control)
}

function gameDraw(canvas) {
  canvas.clearWhite()
  for (var i = 0; i < food.length; ++i) {
    food[i].draw(canvas)
  }
  scorePopup.draw(canvas)
  snake.draw(canvas)
}

function gameMove(control) {
  snake.move(control)

  if (snake.isCrashed) {
    canvas.context.fillStyle = "#000000"
    canvas.context.font = "20px serif"
    canvas.context.fillText(`Your snake ${snake.reasonOfDeath} and died.`, 30, 200)
    canvas.context.fillText(`Your snake was ${snake.body.length}cm.`, 30, 250)
    canvas.context.fillText("Press enter to return menu.", 30, 300)

    if (control.enter.isTriggered) {
      ambienceTitle(audioContext)
      snake = null
      food = null
      scorePopup = null
      return
    }
  } else {
    for (var i = 0; i < food.length; ++i) {
      if (snake.hitTest(food[i])) {
        console.log("yey!")
        // scorePopup.push(food[i].position, snake.length)
        scorePopup.push(food[i].position, snake.length)
        food[i].replace()
      }
    }
  }
}

/// Title
function titleLoop(canvas, control) {
  titleDraw(canvas, highScore)
}

function titleDraw(canvas, highScore) {
  canvas.clearWhite()

  canvas.context.fillStyle = paletteFood[paletteFoodIndexTitle]
  canvas.context.strokeStyle = paletteFood[paletteFoodIndexTitle]
  canvas.drawPath(makePolyTitle())
  paletteFoodIndexTitle = (paletteFoodIndexTitle + 1) % paletteFood.length

  canvas.context.fillStyle = "#000000"
  canvas.context.font = "40px serif"
  canvas.context.fillText("Snake", 100, 100)

  canvas.context.fillStyle = "#000000"
  canvas.context.font = "20px serif"
  canvas.context.fillText("**Instruction**", 100, 200)
  canvas.context.fillText("←→: Turn", 100, 250)

  var text = `High Score: ${highScore > 0 ? highScore : "N/A"}`
  canvas.context.fillText(text, 100, 350)

  canvas.context.fillStyle = paletteScorePopup[paletteScorePopupIndexTitle]
  canvas.context.font = "20px serif"
  canvas.context.fillText("Press arrow key to start", 100, 400)
  paletteScorePopupIndexTitle = mod(paletteScorePopupIndexTitle - 1, paletteScorePopup.length)

  if (control.isTriggered) {
    ambienceGame(audioContext)
    snake = new Snake(canvas, canvas.center)
    food = []
    for (var i = 0; i < 10; ++i) {
      food.push(new Food(canvas))
    }
    scorePopup = new ScorePopup(canvas)
  }
}

/// animation
function animate() {
  if (snake !== null) {
    gameLoop(canvas, control)
  } else {
    titleLoop(canvas, control)
  }
  control.resetTriggered()
  requestAnimationFrame(animate)
}

/// audio
class Envelope {
  constructor(x1, y1, x2, y2) {
    this.easing = bezier(x1, y1, x2, y2)
    this.x1 = x1
    this.y1 = y1
    this.x2 = x2
    this.y2 = y2
  }

  set(x1, y1, x2, y2) {
    this.easing = bezier(x1, y1, x2, y2)
  }

  attack(value) {
    return this.easing(value)
  }

  decay(value) {
    return 1 - this.easing(value)
  }
}

function shiftCent(frequency, cent) {
  return frequency * Math.pow(2, cent / 1200)
}

function makeChord() {
  var length = Math.floor(Math.random() * 16) + 2
  var bass = 50 + Math.random() * 150
  var highLimit = bass * 5
  var chord = []
  for (var i = 1; i < length; ++i) {
    chord.push((bass * 3 * i) % highLimit)
  }
  return chord
}

function makeChordDie() {
  var bass = 456 * Math.random()
  var shift = 12 + Math.floor(Math.random() * 3)
  var chord = []
  chord.push(bass)
  chord.push(shiftCent(bass, 202))
  chord.push(shiftCent(bass, 412 + shift))
  chord.push(shiftCent(bass, 500))
  chord.push(shiftCent(bass, 701 + shift))
  chord.push(shiftCent(bass, 850))
  chord.push(shiftCent(bass, 922 + shift))
  return chord
}

// chord: [周波数]
// attack: 秒
// decay: 秒
function synth(audioContext, chord, attack, decay) {
  var sampleRate = audioContext.sampleRate
  var attackLength = attack * sampleRate
  var decayLength = decay * sampleRate
  var length = attackLength + decayLength
  var amp = 0.5 / chord.length
  var tickPhase = 2 * Math.PI / sampleRate
  var phase = 0
  var wave = new Array(length).fill(0)

  var oscillator = (chord, phase, env) => {
    var osc = 0
    for (var note = 0; note < chord.length; ++note) {
      osc += Math.sin(chord[note] * phase)
    }
    return amp * env * osc
  }
  var envelope = new Envelope(0.3, 0.0, 0.2, 1.0)

  var denom = 1 / (attackLength - 1)
  for (var i = 0; i < attackLength; ++i) {
    wave[i] = oscillator(chord, phase, envelope.attack(i * denom))
    phase += tickPhase
  }

  var denom = 1 / (decayLength - 1)
  for (var i = attackLength; i < wave.length; ++i) {
    wave[i] = oscillator(chord, phase, envelope.decay(i * denom))
    phase += tickPhase
  }

  return toAudioBuffer(audioContext, [wave])
}

function toAudioBuffer(audioContext, wave) {
  var channel = wave.length //wave.channels
  var frame = wave[0].length //wave.frames
  var buffer = audioContext.createBuffer(channel, frame, audioContext.sampleRate)

  for (var i = 0; i < channel; ++i) {
    var waveFloat32 = new Float32Array(wave[i])
    buffer.copyToChannel(waveFloat32, i, 0)
  }
  return buffer
}

function play(audioContext, buffer) {
  var source = audioContext.createBufferSource()
  source.buffer = buffer
  source.connect(audioMaster)
  // source.loop = true
  source.start()
}

function ambienceNoise(audioContext) {
  var gain = audioContext.createGain()
  gain.gain.value = 0.04
  gain.connect(audioMaster)

  var oscillator = audioContext.createOscillator()
  oscillator.type = "sine"
  oscillator.frequency.value = 100
  oscillator.detune.value = 0
  oscillator.connect(gain)
  oscillator.start()

  for (var i = 0; i < 4; ++i) {
    gain = audioContext.createGain()
    gain.gain.value = 20.01 + 300.02 * Math.random()
    gain.connect(oscillator.frequency)

    oscillator = audioContext.createOscillator()
    oscillator.type = "sine"
    oscillator.frequency.value = 10 + Math.random() * 0.1
    oscillator.detune.value = 0
    oscillator.connect(gain)
    oscillator.start()
  }
}

function makeOscillator(audioContext, gainValue, frequency) {
  var gain = audioContext.createGain()
  gain.gain.value = gainValue
  // gain.connect(audioMaster)

  var oscillator = audioContext.createOscillator()
  oscillator.type = "sine"
  oscillator.frequency.value = frequency
  oscillator.detune.value = 0
  oscillator.connect(gain)
  oscillator.start()

  return gain
}

function ambienceTone(audioContext) {
  var bass = 60 + 60 * Math.random()
  var shift = 198 * Math.floor(Math.random() * 2)
  var osc = []
  osc.push(makeOscillator(audioContext, 0.1, bass))
  osc.push(makeOscillator(audioContext, 0.1, shiftCent(bass, 34)))
  osc.push(makeOscillator(audioContext, 0.1, shiftCent(bass, 78)))
  osc.push(makeOscillator(audioContext, 0.1, shiftCent(bass, 190 + shift)))
  osc.push(makeOscillator(audioContext, 0.1, shiftCent(bass, 214)))
  osc.push(makeOscillator(audioContext, 0.1, shiftCent(bass, 714 + shift)))
  osc.push(makeOscillator(audioContext, 0.1, shiftCent(bass, 734 + shift)))
  osc.push(makeOscillator(audioContext, 0.1, shiftCent(bass, 735)))
  osc.push(makeOscillator(audioContext, 0.1, shiftCent(bass, 1009)))
  osc.push(makeOscillator(audioContext, 0.1, shiftCent(bass, 1211)))
  osc.push(makeOscillator(audioContext, 0.1, shiftCent(bass, 1421)))

  var gain = audioContext.createGain()
  gain.gain.value = 0.11
  gain.connect(audioMaster)

  var gainLfo = audioContext.createGain()
  gainLfo.gain.value = 0.2
  gainLfo.connect(gain.gain)

  var gainMod = audioContext.createOscillator()
  gainMod.type = "sine"
  gainMod.frequency.value = 0.01 + 2 * Math.random() * Math.random()
  gainMod.detune.value = 0
  gainMod.connect(gainLfo)
  gainMod.start()

  var gainMod = audioContext.createOscillator()
  gainMod.type = "sine"
  gainMod.frequency.value = 0.03
  gainMod.detune.value = 0
  gainMod.connect(gainLfo)
  gainMod.start()

  for (var i = 0; i < osc.length; ++i) {
    osc[i].connect(gain)
  }
}

function ambienceGame(audioContext) {
  refreshAudio(audioContext)
  ambienceNoise(audioContext)
  ambienceTone(audioContext)
}

function ambienceTone2(audioContext) {
  var bass = 60 + 60 * Math.random()
  var shift = 198 * Math.floor(Math.random() * 2)
  var osc = []
  osc.push(makeOscillator(audioContext, 0.1, bass))
  osc.push(makeOscillator(audioContext, 0.1, shiftCent(bass, 33)))
  osc.push(makeOscillator(audioContext, 0.1, shiftCent(bass, 77)))
  osc.push(makeOscillator(audioContext, 0.1, shiftCent(bass, 191 + shift)))
  osc.push(makeOscillator(audioContext, 0.1, shiftCent(bass, 213)))
  osc.push(makeOscillator(audioContext, 0.1, shiftCent(bass, 715 + shift)))
  osc.push(makeOscillator(audioContext, 0.1, shiftCent(bass, 732 + shift)))
  osc.push(makeOscillator(audioContext, 0.1, shiftCent(bass, 736)))
  osc.push(makeOscillator(audioContext, 0.1, shiftCent(bass, 1019)))
  osc.push(makeOscillator(audioContext, 0.1, shiftCent(bass, 1209)))
  osc.push(makeOscillator(audioContext, 0.1, shiftCent(bass, 1431)))
  osc.push(makeOscillator(audioContext, 0.1, shiftCent(bass, 1709 + shift)))
  osc.push(makeOscillator(audioContext, 0.1, shiftCent(bass, 1911)))

  var gain = audioContext.createGain()
  gain.gain.value = 0.11
  gain.connect(audioMaster)

  for (var i = 0; i < osc.length; ++i) {
    osc[i].connect(gain)
  }
}

function ambienceTitle(audioContext) {
  refreshAudio(audioContext)
  ambienceTone2(audioContext)
}

function refreshAudio(audioContext) {
  audioBufferDie = synth(audioContext, makeChordDie(), 0.1, 3.0)
  audioBufferFood = []
  for (var i = 0; i < 16; ++i) {
    audioBufferFood.push(synth(audioContext, makeChord(), 0.05, 0.34))
  }
  audioMaster.disconnect()
  audioMaster = audioContext.createGain()
  var time = audioContext.currentTime
  audioMaster.gain.setValueAtTime(0.0, time)
  audioMaster.gain.linearRampToValueAtTime(0.98, time + 3.0)
  audioMaster.connect(audioContext.destination)
}

/// 非対応ブラウザのための表示を消す。
var pUnsupported = document.getElementById("unsupported")
pUnsupported.textContent = ""

/// ここから開始。
// function resizeCanvas() {
//   var width = window.innerWidth
//   var height = window.innerHeight
//   var min = `${Math.min(width, height) - 32}px`
//   canvas.element.style.width = min
//   canvas.element.style.height = min
// }
var canvas = new Canvas(document.body, 512, 512)
// canvas.context.imageSmoothingEnabled = false
var control = new Control(canvas.element)

// resizeCanvas()
// window.addEventListener("resize", resizeCanvas, false)

var paletteFood = makeFoodPalette()
var paletteScorePopup = makeScorePopupPalette()

var highScore = 0

var soundIndexFood = 0
var paletteFoodIndexTitle = 0
var paletteScorePopupIndexTitle = 0

var snake = null
var food = null
var scorePopup = null

var audioContext = new AudioContext()
var audioBufferDie = synth(audioContext, makeChordDie(), 0.1, 3.0)
var audioBufferFood = []
for (var i = 0; i < 16; ++i) {
  audioBufferFood.push(synth(audioContext, makeChord(), 0.05, 0.34))
}
var audioMaster = audioContext.createGain()
audioMaster.gain.value = 1
audioMaster.connect(audioContext.destination)

animate()

// test()

function test() {
  // (0.5, 0.5)で交差。
  console.log(intersectSegmentSegment(
    new Vec2(0, 0),
    new Vec2(1, 1),
    new Vec2(0, 1),
    new Vec2(1, 0)
  ))

  // y軸に並行。
  console.log(intersectSegmentSegment(
    new Vec2(0, 0),
    new Vec2(0, 2),
    new Vec2(0, 1),
    new Vec2(0, 3)
  ))

  // x軸に並行。
  console.log(intersectSegmentSegment(
    new Vec2(1, 0),
    new Vec2(3, 0),
    new Vec2(0, 0),
    new Vec2(1.1, 0)
  ))
}

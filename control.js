class ControlElement {
  constructor(key) {
    this.isActive = false
    this.isTriggered = false
    this.key = new Set(key)
  }

  addKey(key) {
    this.key.push(key)
  }

  removeKey(key) {
    this.key.delete(key)
  }

  activate(key) {
    if (this.key.has(key)) {
      if (!this.isActive) {
        this.isTriggered = true
      }
      this.isActive = true
    }
  }

  inactivate(key) {
    if (this.key.has(key)) {
      this.isActive = false
    }
  }
}

class Control {
  constructor(canvasElement) {
    this.canvas = canvasElement

    this.canvas.tabIndex = 1 // keydown を有効にするためフォーカスできるように設定。
    this.canvas.focus()

    this.canvas.addEventListener("load", (event) => this.onLoad(event), false)
    this.canvas.addEventListener("mousedown",
      (event) => this.onMouseDown(event), false)
    this.canvas.addEventListener("mousemove",
      (event) => this.onMouseMove(event), false)
    this.canvas.addEventListener("mouseup",
      (event) => this.onMouseUp(event), false)
    this.canvas.addEventListener("mouseout",
      (event) => this.onMouseOut(event), false)
    this.canvas.addEventListener("keydown",
      (event) => this.onKeyDown(event), false)
    this.canvas.addEventListener("keyup",
      (event) => this.onKeyUp(event), false)
    window.addEventListener("visibilitychange",
      (event) => this.reset(), false)

    // 右クリックメニューを無効化。
    this.enableContextMenu = false
    this.contextMenu = this.canvas.oncontextmenu

    this.actionSet = [
      this.up = new ControlElement(["w", "W", "ArrowUp"]),
      this.down = new ControlElement(["s", "S", "ArrowDown"]),
      this.left = new ControlElement(["a", "A", "ArrowLeft"]),
      this.right = new ControlElement(["d", "D", "ArrowRight"]),
      this.enter = new ControlElement(["Enter"]),
    ]

    this.isMouseLeftDown = false
    this.isMouseRightDown = false
    this.currentMousePosition = new Vec2(0, 0)
    this.previousMousePosition = new Vec2(0, 0)
    this.deltaMousePosition = new Vec2(0, 0)
  }

  reset() {
    this.isKeyPressed = false
    this.isMouseLeftDown = false
    this.isMouseRightDown = false
    this.deltaMousePosition = new Vec2(0, 0)
    for (var i = 0; i < this.actionSet.length; ++i) {
      this.actionSet[i].isActive = false
    }
  }

  get isTriggered() {
    for (var i = 0; i < this.actionSet.length; ++i) {
      if (this.actionSet[i].isTriggered) return true
    }
    return false
  }

  resetTriggered() {
    for (var i = 0; i < this.actionSet.length; ++i) {
      this.actionSet[i].isTriggered = false
    }
  }

  onLoad(event) {
    this.isMouseLeftDown = false
    this.isMouseRightDown = false
  }

  mousePosition(event) {
    var rect = event.target.getBoundingClientRect()
    var x = event.clientX - rect.left
    var y = event.clientY - rect.top
    return new Vec2(x, y)
  }

  onMouseDown(event) {
    if (event.button === 0) {
      this.isMouseLeftDown = true
    }
    if (event.button === 2) {
      this.isMouseRightDown = true
    }

    this.previousMousePosition = this.mousePosition(event)
    this.currentMousePosition.copy(this.previousMousePosition)
    this.deltaMousePosition.set(0, 0)
  }

  onMouseMove(event) {
    // マウスボタンが押下されていなければ処理しない。
    if ((!this.isMouseLeftDown || isNaN(this.isMouseLeftDown))
      && (!this.isMouseRightDown || isNaN(this.isMouseRightDown))) {
      return
    }

    this.previousMousePosition.copy(this.currentMousePosition)
    this.currentMousePosition = this.mousePosition(event)

    this.deltaMousePosition.copy(this.currentMousePosition)
    this.deltaMousePosition.sub(this.previousMousePosition)
  }

  onMouseUp(event) {
    if (event.button === 0) {
      this.isMouseLeftDown = false
    }
    if (event.button === 2) {
      this.isMouseRightDown = false
    }
  }

  onMouseOut(event) {
    this.isMouseLeftDown = false
    this.isMouseRightDown = false
  }

  onKeyDown(event) {
    // console.log(event) // debug

    event.preventDefault() // ブラウザのショートカットキーを無効化。
    // chrome v52 では ctrl + w/t/n を無効化できない。

    if (event.key === "Escape") { // パニックボタン。
      this.reset()
    }

    if (event.key === "\\") { // 右クリックメニューの有効・無効をトグル。
      this.toggleRightClickMenu()
    }

    for (var i = 0; i < this.actionSet.length; ++i) {
      this.actionSet[i].activate(event.key)
    }
  }

  onKeyUp(event) {
    for (var i = 0; i < this.actionSet.length; ++i) {
      this.actionSet[i].inactivate(event.key)
    }
  }

  toggleRightClickMenu() {
    if (this.enableContextMenu) {
      this.canvas.oncontextmenu = () => false
      this.enableContextMenu = false
    }
    else {
      this.canvas.oncontextmenu = this.contextMenu
      this.enableContextMenu = true
    }
  }
}

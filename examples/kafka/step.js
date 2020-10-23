class StepBase extends HTMLElement {
  constructor() {
    super()
  }

  static current = null

  static animating = false

  static impress = null

  static connectedSteps = []

  static lastAction = null

  static register(step) {
    const s = Object.create(step.prototype)
    customElements.define(s.name(), step)
  }

  static gotoStep(step) {
    if (typeof step === 'number') {
      StepBase.impress.goto(step)
    } else if (step === 'prev') {
      if (StepBase.current) {
        StepBase.current.resetSteps()
      }
      StepBase.impress.prev()
    } else if (step === 'next') {
      if (StepBase.current) {
        StepBase.current.redoSteps()
      }
      StepBase.impress.next()
    } else {
      throw new Error(`Invalid step for goto: ${step}. Should be a number, 'next', or 'prev'`)
    }
    StepBase.animating = false
    StepBase.current = null
  }

  name() {
    throw new Error('must name element')
  }

  startSprites() {
    return []
  }

  substeps() {
    return []
  }

  initialize() {
    if (this.initialized) return
    this.addEventListener('impress:substep:enter', this.doNext)
    this.addEventListener('impress:substep:leave', this.doPrev)
    this.step = this.step === undefined ? -1 : this.step // Never before seen step starts @ -1
    this.initialized = true

    if (this.step === -1) {
      this.buildSprites()

      const step = this.retrieveStep()
      if (step) {
        this.redoSteps(step)
      }
    } else {
      // If step visited before, just ensure proper state with impress.js
      this.storeStep()
    }

    setTimeout(() => this.setSubstepClasses(this.step), 0)
  }

  destroy() {
    if (!this.initialized) return
    this.removeEventListener('impress:substep:enter', this.doNext)
    this.removeEventListener('impress:substep:leave', this.doPrev)
    // this.step = -1    // All animations now keep state between steps, leaving for posterity
    this.initialized = false
    this.removeStep()
  }

  resetStep(step) {
    const s = this.steps[step]
    s.reset()
    if (s.onReset) s.onReset()
  }

  resetSteps() {
    for (let i = this.step; i >= 0; i--) {
      this.resetStep(i)
    }
    this.steps = []
    this.step = -1
    this.removeSubsteps()
    this.resetSprites()
  }

  removeSubsteps() {
    const substeps = this.querySelectorAll('.substep')
    for (const substep of substeps) {
      this.removeChild(substep)
    }
  }

  resetSprites() {
    this.destroySprites()
    this.buildSprites()
  }

  buildNewStep(i) {
    if (i === undefined || i === null) i = this.step
    if (!this.steps) this.steps = []
    this.steps[i] = this.buildStep(i)
    return this.steps[i]
  }

  currentStep() {
    if (this.steps && this.steps[this.step]) {
      return this.steps[this.step]
    }
  }

  previousStep() {
    if (this.steps && this.steps[this.step + 1]) {
      return this.steps[this.step]
    }
  }

  buildStep(i) {
    if (i === undefined || i === null) i = this.step
    let current = this.substeps()[i]
    // Allow for string which will just grab the animation as a property
    if (typeof current === 'string') current = this[current]

    // Allow for a "builder" function, useful for building timelines
    if (typeof current === 'function' && !current.play) {
      current = current()
    }

    if (current.enterStep) {
      current.enterStep()
    }

    // If start/end/leaveStep is on an animation object, attach it to the anime object
    const leaveStep = current.leaveStep
    const startPlayStep = current.startPlayStep
    const endPlayStep = current.endPlayStep
    const startReverseStep = current.startReverseStep
    const endReverseStep = current.endReverseStep
    const onReset = current.onReset

    if (current.anime) {
      current = typeof current.anime === 'function' ? current.anime() : current.anime
    } else {
      current = current.play ? current : anime(current)
    }
    current.leaveStep = leaveStep
    current.startPlayStep = startPlayStep
    current.endPlayStep = endPlayStep
    current.startReverseStep = startReverseStep
    current.endReverseStep = endReverseStep
    current.onReset = onReset
    return current
  }

  async doNext(e) {
    console.log('NEXT SUBSTEP: ', e)
    if (this.step + 1 >= this.substeps().length) {
      console.error('INVALID SUBSTEP DETECTED')
      return
    }
    const prev = this.currentStep()
    if (prev && prev.leaveStep) {
      prev.leaveStep(prev, false)
    }

    this.step++
    this.storeStep()

    const current = this.buildNewStep()
    if (current && current.startPlayStep) {
      current.startPlayStep(current)
    }

    await this.play(current)

    if (current && current.endPlayStep) {
      current.endPlayStep(current)
    }
  }

  async doPrev(e) {
    console.log('PREV SUBSTEP: ', e)
    if (!this.steps > 0) {
      console.error('INVALID SUBSTEP DETECTED')
      return
    }

    const current = this.currentStep()
    if (current && current.leaveStep) {
      current.leaveStep(current, true)
    }

    this.step--
    this.storeStep()

    if (current && current.startReverseStep) {
      current.startReverseStep(current)
    }

    await this.reverse(current) // reverse animation on backwards

    if (current && current.endReverseStep) {
      current.endReverseStep(current)
    }

    this.destroySprites(this.step + 1)
  }

  storeStep() {
    if (!window.localStorage) return
    window.localStorage.setItem(`store-step-${this.name()}`, this.step)
  }

  removeStep() {
    if (!window.localStorage) return
    window.localStorage.removeItem(`store-step-${this.name()}`)
  }

  showSpinner() {
    for (const child of this.children) {
      child.hidden = true
    }

    document.getElementById('spinner').style.display = 'block'
  }

  removeSpinner() {
    document.getElementById('spinner').style.display = 'none'

    for (const child of this.children) {
      child.hidden = false
    }
  }

  retrieveStep() {
    if (!window.localStorage) return
    const step = window.localStorage.getItem(`store-step-${this.name()}`)
    if (step === undefined || step === null) return
    return parseInt(step)
  }

  /**
   * This is used to load up a steps state from localstorage
   * Replays the animations and syncs substep state with impress.js
   */
  redoSteps(step) {
    const from = step === undefined && this.step > -1 ? this.step + 1 : 0
    step = step === undefined ? this.substeps().length - 1 : step
    this.showSpinner()
    for (let i = from; i <= step; i++) {
      const current = this.buildNewStep(i)
      this.seek(current)
    }
    this.removeSpinner()

    this.step = step
    this.setSubstepClasses(step)
  }

  /**
   * Impress.js keep substep state as classes on elems.
   * Make sure it has the proper state: https://github.com/impress/impress.js/tree/master/src/plugins/substep
   */
  removeSubstepClasses(step) {
    const substeps = this.querySelectorAll('.substep')
    for (let i = 0; i < substeps.length; i++) {
      substeps[i].classList.remove('substep-visible')
      substeps[i].classList.remove('substep-active')
    }
  }

  /**
   * Impress.js keep substep state as classes on elems.
   * Make sure it has the proper state: https://github.com/impress/impress.js/tree/master/src/plugins/substep
   */
  setSubstepClasses(step) {
    const substeps = this.querySelectorAll('.substep')
    for (let i = 0; i <= step; i++) {
      substeps[i].classList.add('substep-visible')
      if (i === step) {
        substeps[i].classList.add('substep-active')
      }
    }
  }

  /**
   * async/await play step
   */
  async play(step) {
    StepBase.animating = true
    if (step.finished) {
      // anime object promises
      step.play()
      return step.finished.then(() => (StepBase.animating = false))
    } else {
      // objects implementing play/reverse/seek
      await step.play()
      StepBase.animating = false
    }
  }

  /**
   * async/await play reverse step
   */
  async reverse(step) {
    StepBase.animating = true
    if (step.finished) {
      step.reverse()
      step.play()
      return step.finished.then(() => step.reverse()).then(() => (StepBase.animating = false))
    } else {
      // objects implementing play/reverse/seek
      await step.reverse()
      StepBase.animating = false
    }
  }

  seek(step, to) {
    to = to === undefined ? step.duration : to
    step.seek(to)
    StepBase.animating = false
  }

  buildSprites() {
    if (this.sprites && this.sprites.length) return
    this.sprites = []
    for (const sprite of this.startSprites()) {
      this.createSprite(sprite)
    }

    // Add a substep class for each substep of this slide
    for (const step in this.substeps()) {
      const el = document.createElement('span')
      el.classList.add('substep')
      el.classList.add(`substep-${step}`)
      this.appendChild(el)
    }
  }

  destroySprites(step) {
    if (!this.sprites) return
    let sprites = this.sprites
    if (step) {
      sprites = sprites.filter((s) => s.step === step)
      this.sprites = this.sprites.filter((s) => s.step !== step)
    } else {
      this.sprites = []
    }
    sprites.forEach((s) => {
      this.removeChild(s.el)
    })
  }

  createSprite(sprite) {
    const tag = sprite.tag || 'img'
    const el = document.createElement(tag)
    if (!sprite.id) throw new Error('Sprite must have id')
    if (tag === 'img' && !sprite.src) throw new Error('Sprite must have src')
    el.id = sprite.id
    el.setAttribute('src', sprite.src)
    if (sprite.attrs) {
      Object.keys(sprite.attrs).forEach((key) => el.setAttribute(key, sprite.attrs[key]))
    }
    if (sprite.styles) Object.assign(el.style, sprite.styles)
    this.appendChild(el)

    const retSprite = {
      el,
      step: this.step,
      sprite,
    }
    this.sprites.push(retSprite)

    return retSprite
  }

  /**
   * Clone a node into a grid of nodes
   * className: the name of the class to apply to all clones. If an element exists with it, abort
   * selector: the selector used to get the node to clone
   * columns: the number of columns in the grid
   * rows: the number of rows in the grid
   * colSize: the size of each grid column in pixels
   * rowSize: the size of each grid row in pixels
   * style: extra style to apply to the cloned nodes
   * colSplit: how many cols on each side of the existing node
   * rowSplit: how many rows on each side of the existing node
   */
  cloneGrid(className, selector, columns, rows, colSize, rowSize, style, colSplit, rowSplit) {
    if (this.querySelectorAll('.' + className).length) return // Don't need to create payload clones again

    const payload = this.querySelector(selector)

    const payloadTop = parseInt(payload.style.top)
    const payloadLeft = parseInt(payload.style.left)
    for (let i = 1; i < rows * columns; i++) {
      const column = Math.floor(i / rows)
      const row = i % rows

      const newPayload = this.cloneNode(payload, payload.id + `_${i}`)
      newPayload.classList.add(className)

      Object.assign(newPayload.style, style)
      const left = Math.floor(
        column > colSplit ? payloadLeft + (column - colSplit) * colSize : payloadLeft - column * colSize
      )
      const top = Math.floor(row > rowSplit ? payloadTop + (row - rowSplit) * rowSize : payloadTop - row * rowSize)
      newPayload.style.left = `${left}px`
      newPayload.style.top = `${top}px`

      this.appendChild(newPayload)
    }
  }

  cloneNode(selector, id) {
    if (typeof selector === 'string') selector = this.querySelector(selector)

    const el = selector.cloneNode()
    el.id = id

    this.appendChild(el)

    this.sprites.push({
      el,
      step: this.step,
      sprite: this.getSpriteByID(selector.id),
    })

    return el
  }

  getSpriteByID(id) {
    for (const sprite of this.sprites) {
      if (sprite.el.id === id) return sprite
    }
  }

  /**
   * Create a new animation step for a single animation
   */
  animeStep(targets, props, events = {}) {
    if (typeof targets === 'string') targets = `${this.name()} ${targets}`
    return Object.assign({ targets, autoplay: false, ...events }, props || {})
  }

  connectedCallback() {
    console.log('CONN')
    StepBase.connectedSteps.push(this)
    this.buildSprites()
  }

  disconnectedCallback() {
    console.log('DISCONN')
    for (let i = 0; i < StepBase.connectedSteps.length; i++) {
      if (this === StepBase.connectedSteps[i]) {
        StepBase.connectedSteps.splice(i, 1)
        break
      }
    }
  }
}

document.addEventListener('impress:init', (e, a) => {
  StepBase.impress = e.detail.api
})

document.addEventListener('impress:stepenter', (e) => {
  console.log('STEP ENTER: ', e)

  if (e.target && e.target.initialize) {
    e.target.initialize()
    StepBase.current = e.target
  } else {
    StepBase.current = null
  }
})

document.addEventListener('impress:stepleave', (e) => {
  console.log('STEP LEAVE: ', e)
  if (e.target && e.target.destroy) {
    e.target.destroy()
  }
  StepBase.current = null
})

document.addEventListener('keydown', (e) => {
  if (e.code === 'ArrowLeft' || (e.shiftKey && e.code === 'Tab') || e.code === 'KeyB') {
    StepBase.lastAction = 'prev'
  } else if (e.code === 'ArrowRight' || e.code === 'Tab' || e.code == 'Space' || e.code === 'KeyF') {
    StepBase.lastAction = 'next'
  } else {
    StepBase.lastAction = null
  }

  switch (e.code) {
    case 'KeyR':
    case 'KeyF':
    case 'KeyB':
    case 'KeyS':
      return
  }

  if (StepBase.current && StepBase.animating) {
    return cancelThis(e)
  }
})

const cancelThis = (e) => {
  e.preventDefault()
  e.stopImmediatePropagation()
  return false
}

document.addEventListener('keyup', (e) => {
  if (StepBase.current && StepBase.animating) {
    switch (e.code) {
      case 'ArrowRight':
      case 'Space':
      case 'Tab':
        const current = StepBase.current.currentStep()
        if (current) {
          StepBase.current.seek(current)
        }
        break
    }
    return cancelThis(e)
  }

  switch (e.code) {
    case 'KeyR':
      if (window.localStorage) window.localStorage.clear()
      StepBase.connectedSteps.forEach((s) => s.resetSteps())
      StepBase.gotoStep(0)
      return cancelThis(e)
    case 'KeyF':
      StepBase.gotoStep('next')
      return cancelThis(e)
    case 'KeyB':
      StepBase.gotoStep('prev')
      return cancelThis(e)
    case 'KeyS':
      if (StepBase.current) StepBase.current.resetSteps()
      return cancelThis(e)
  }
})

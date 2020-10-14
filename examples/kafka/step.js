class StepBase extends HTMLElement {
  constructor() {
    super()
  }

  static current = null

  static animating = false

  static register(step) {
    const s = Object.create(step.prototype)
    customElements.define(s.name(), step)
  }

  name() {
    throw new Error('must name element')
  }

  styles() {
    return {}
  }

  substeps() {
    return []
  }

  view() {
    return ''
  }

  initialize() {
    if (this.initialized) return
    this.addEventListener('impress:substep:enter', this.doNext)
    this.addEventListener('impress:substep:leave', this.doPrev)
    this.step = this.step === undefined ? -1 : this.step // Never before seen step starts @ -1
    this.initialized = true

    if (this.step === -1) {
      // If this step never visited before, build view & step animations
      this.buildView()
      this.setStyles()

      const step = this.retrieveStep()
      if (step) {
        this.step = step
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
    // TODO: allow resets?
    // this.resetSteps() // This was used to reset all animations after leaving the step
    // this.step = -1    // All animations now keep state between steps, leaving for posterity
    this.initialized = false
    this.removeStep()
  }

  // TODO: allow resets?
  // resetSteps() {
  //   for (let i = this.step; i >= 0; i--) {
  //     this.steps[i].reset()
  //   }
  // }

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

    // If start/leaveStep is on an animation object, attach it to the anime object
    const leaveStep = current.leaveStep
    const startStep = current.startStep
    current = current.play ? current : anime(current)
    current.leaveStep = leaveStep
    current.startStep = startStep
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
    if (current && current.startStep) {
      current.startStep(current, false)
    }

    await this.play(current)
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

    const next = this.currentStep() || this.buildNewStep()
    if (next && next.startStep) {
      next.startStep(next, true)
    }

    await this.reverse(current) // reverse animation on backwards
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
    this.showSpinner()
    for (let i = 0; i <= step; i++) {
      const current = this.buildNewStep(i)
      this.seek(current)
    }
    this.removeSpinner()

    this.setSubstepClasses(step)
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

  buildView() {
    let view = this.view()

    // Add a substep class for each substep of this slide
    for (const step in this.substeps()) {
      view += `<span class="substep substep-${step}"></span>`
    }

    this.innerHTML = view
  }

  setStyles() {
    for (const selector of Object.keys(this.styles())) {
      const styles = this.styles()[selector]
      const els = document.querySelectorAll(`${this.name()} ${selector}`)
      for (const el of els) {
        Object.assign(el.style, styles)
      }
    }
  }

  /**
   * Create a new animation step for a single animation
   */
  animeStep(targets, props, startStep, leaveStep) {
    if (typeof targets === 'string') targets = `${this.name()} ${targets}`
    return Object.assign({ targets, autoplay: false, startStep, leaveStep }, props || {})
  }
}

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
  console.log('keydown', StepBase.animating)
  if (StepBase.current && StepBase.animating) {
    e.preventDefault()
    e.stopImmediatePropagation()
    return false
  }
})

document.addEventListener('keyup', (e) => {
  console.log('keyup', StepBase.animating)
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
      // case 'ArrowLeft':
      //   const previous = StepBase.current.currentStep()
      //   if (previous) {
      //     StepBase.seeking = true
      //     StepBase.current.seek(previous, 0)
      //     StepBase.seeking = false
      //   }
      //   break
    }
    e.preventDefault()
    e.stopImmediatePropagation()
    return false
  }
})

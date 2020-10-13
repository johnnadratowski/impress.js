class StepBase extends HTMLElement {
  constructor() {
    super()
  }

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
    this.addEventListener('impress:substep:enter', this.doNext)
    this.addEventListener('impress:substep:leave', this.doPrev)
    this.step = this.step === undefined ? -1 : this.step // Never before seen step starts @ -1
    this.initialized = true
  }

  resetSteps() {
    for (let i = this.step; i >= 0; i--) {
      this.steps[i].reset()
    }
  }

  destroy() {
    this.removeEventListener('impress:substep:enter', this.doNext)
    this.removeEventListener('impress:substep:leave', this.doPrev)
    // this.resetSteps() // This was used to reset all animations after leaving the step
    // this.step = -1    // All animations now keep state between steps, leaving for posterity
    this.initialized = false
  }

  buildStep(current) {
    // Allow for functions which can take a 'play', 'reverse', 'reset'
    if (typeof current === 'function' && !current.play) {
      return {
        play() {
          current('play')
        },
        reverse() {
          current('reverse')
        },
        reset() {
          current('reset')
        }
      }
    }
    return current.play ? current : anime(current)
  }

  stepEnter(e) {
    console.log('STEP ENTER: ', e)
    if (!e.target === this) return // Do not do anything if this isn't the current step
    if (this.initialized) return

    this.initialize()
    if (this.step === -1) {  // If this step never visited before, build view & step animations
      this.buildView()
      this.setStyles()

      this.steps = this.substeps().map(this.buildStep)

      const step = this.retrieveStep()
      if (step) {
        this.step = step
        this.redoSteps(step)
      }
    } else {                 // If step visited before, just ensure proper state with impress.js
      setTimeout(() => this.setSubstepClasses(this.step), 0)
      this.storeStep()
    }
  }

  stepLeave(e) {
    console.log('STEP LEAVE: ', e)
    if (!e.target === this) return // Do not do anything if this isn't the current step
    if (!this.initialized) return
    this.destroy()
    this.removeStep()
  }

  async doNext(e) {
    console.log('NEXT SUBSTEP: ', e)
    if (this.step + 1 >= this.steps.length) {
      console.error("INVALID SUBSTEP DETECTED")
      return
    }
    this.step++

    const current = this.steps[this.step]
    if (!current) return

    await this.play(current)

    this.storeStep()
  }

  async doPrev(e) {
    console.log('PREV SUBSTEP: ', e)
    if (!this.steps > 0) {
      console.error("INVALID SUBSTEP DETECTED")
      return
    }

    const current = this.steps[this.step]

    this.step--
    this.storeStep()
    await this.reverseStep(current) // reverse animation on backwards
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
  async redoSteps(step) {
    this.showSpinner()
    const all = []
    for (let i = 0; i <= step; i++) {
      all.push(this.play(this.steps[i]))
    }
    await Promise.all(all)
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
  play(step) {
    step.play()
    return step.finished
  }

  /**
    * async/await play reverse step
    */
  async reverseStep(step) {
    step.reverse()
    step.play()
    return step.finished.then(() => step.reverse())
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
  animeStep(targets, props) {
    if (typeof targets === 'string') targets = `${this.name()} ${targets}`
    return Object.assign({ targets, autoplay: false }, props || {})
  }

  /**
    * Create a new animation step for multiple animations at once
    * NOTE: to do sequential animations at once, consider anime's timeline feature
    */
  animeMultiStep(targets, props) {
    const all = []
    for (let i = 0; i < props.length; i++) {
      const target = Array.isArray(targets) ? targets[i] : targets
      all.push(anime(this.animeStep(target, props[i])))
    }

    return {
      play() {
        all.forEach((a) => a.play())
      },
      reverse() {
        all.forEach((a) => this.reverseStep(a))
      },
      reset() {
        all.forEach((a) => a.reset())
      }
    }
  }

  async connectedCallback() {
    if (!this.isConnected) return
    this.addEventListener('impress:stepenter', this.stepEnter)
    this.addEventListener('impress:stepleave', this.stepLeave)
  }

  async disconnectedCallback() {
    this.removeEventListener('impress:stepenter', this.stepEnter)
    this.removeEventListener('impress:stepleave', this.stepLeave)
  }
}

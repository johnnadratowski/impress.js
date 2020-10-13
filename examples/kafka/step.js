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
    this.step = -1
    this.initialized = true
  }

  resetSteps() {
    for (let i = this.step; i >= 0; i--) {
      this.steps[i].reset()
    }
  }

  destroy() {
    this.resetSteps()
    this.step = -1
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
    if (this.initialized) return

    this.initialize()
    this.buildView()
    this.setStyles()

    this.steps = this.substeps().map(this.buildStep)
  }

  stepLeave(e) {
    console.log('STEP LEAVE: ', e)
    if (!this.initialized) return
    this.destroy()
  }

  doNext(e) {
    console.log('NEXT SUBSTEP: ', e)
    if (this.step + 1 >= this.steps.length) {
      return
    }
    this.step++

    const current = this.steps[this.step]
    if (!current) return

    current.play()
  }

  doPrev(e) {
    console.log('PREV SUBSTEP: ', e)
    const current = this.steps[this.step]
    if (!current) return

    this.reverseStep(current)
    this.step--
  }

  reverseStep(step) {
    step.reverse()
    step.play()
    step.finished.then(() => step.reverse())
  }

  buildView() {
    let view = this.view()

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

  animeStep(target, props) {
    return Object.assign({ targets: `${this.name()} ${target}`, autoplay: false }, props || {})
  }

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
    this.addEventListener('impress:substep:enter', this.doNext)
    this.addEventListener('impress:substep:leave', this.doPrev)
    this.addEventListener('impress:stepenter', this.stepEnter)
    this.addEventListener('impress:stepleave', this.stepLeave)
  }

  async disconnectedCallback() {
    this.removeEventListener('impress:substep:enter', this.doNext)
    this.removeEventListener('impress:substep:leave', this.doPrev)
    this.removeEventListener('impress:stepenter', this.stepEnter)
    this.removeEventListener('impress:stepleave', this.stepLeave)
  }
}

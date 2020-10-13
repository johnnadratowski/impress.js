class Step1 extends StepBase {
  constructor() {
    super()
  }

  name() {
    return 'step-1'
  }

  view() {
    return `
      <img id="payload" src="./img/payload.png" />
      <img id="database" src="./img/database.png" />
    `
  }

  substeps() {
    return [
      anime(
        this.animeStep('#payload', {
          left: '0px',
          opacity: 1,
          duration: 1000
        })
      ),

      () => {
        debugger
        const step = this.steps[0]
        step.reverse()
        step.play()
      },

      anime
        .timeline(this.animeStep('#database'), {
          easing: 'easeInOutQuart'
        })
        .add({
          top: '200px',
          opacity: 1,
          duration: 1000
        })
        .add({
          top: '250px',
          opacity: 0,
          duration: 1000
        })
    ]
  }

  styles() {
    return {
      '#payload': {
        height: '275px',
        position: 'absolute',
        top: '200px',
        left: '-2100px',
        opacity: 0
      },
      '#database': {
        height: '275px',
        position: 'absolute',
        left: '450px',
        top: '150px',
        opacity: 0
      }
    }
  }
}

StepBase.register(Step1)

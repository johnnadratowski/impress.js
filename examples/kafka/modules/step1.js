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
      <img id="email" src="./img/email.png" />
      <img id="server" src="./img/server.png" />
    `
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
      },
      '#email': {
        height: '375px',
        position: 'absolute',
        left: '450px',
        top: '100px',
        opacity: 0
      },
      '#server': {
        height: '275px',
        position: 'absolute',
        left: '450px',
        top: '150px',
        opacity: 0
      }
    }
  }

  substeps() {
    return [
      this.animeStep('#payload', {
        left: '0px',
        opacity: 1,
        duration: 1000
      }),

      () => this.createDestAnim('database', '200px'),

      () => this.createDestAnim('email', '150px'),

      () => this.createDestAnim('server', '200px', false),

      this.animeStep('*', {
        scale: .5,
        duration: 1000,
        easing: 'linear'
      }),

      this.animeStep('*', {
        scale: .2,
        duration: 1000,
        easing: 'linear'
      })

    ]
  }

  createDestAnim(target, top, goAway = true) {
    const t = anime
        .timeline(this.animeStep('#' + target, {
          easing: 'easeInOutQuint' 
        }))
        .add({
          top,
          opacity: 1,
          duration: 1000
        })
    if (goAway) {
        t.add({
          top: '250px',
          opacity: -0.1, // setting this to 0 causes a flicker
          duration: 1000
        })
    }
    return t
  }
}

StepBase.register(Step1)

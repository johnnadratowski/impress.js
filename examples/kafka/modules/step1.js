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
      <img id="to-server-arrow" src="./img/left-arrow.png" />
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
      },
      '#to-server-arrow': {
        height: '175px',
        position: 'absolute',
        left: '320px',
        top: '250px',
        transform: 'rotate(180deg) scale(0.2)',
        opacity: 0
      }
    }
  }

  substeps() {
    return [
      'intro',

      () => this.createDestAnim('database', '200px'),

      () => this.createDestAnim('email', '150px'),

      () => this.createDestAnim('server', '200px', false),

      'zoomOut'
    ]
  }

  intro = this.animeStep('#payload', {
    left: '0px',
    opacity: 1,
    duration: 1000
  })

  createDestAnim(target, top, goAway = true) {
    const t = anime
      .timeline(
        this.animeStep('#' + target, {
          easing: 'easeInOutQuint'
        })
      )
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

  zoomOut = () => {
    return anime
      .timeline()
      .add(
        this.animeStep('#server', {
          scale: 0.2,
          duration: 2000,
          easing: 'linear'
        })
      )
      .add(
        this.animeStep('#payload', {
          scale: {
            value: 0.2,
            duration: 2000
          },
          translateX: {
            value: 1500,
            duration: 1057,
            delay: 1000
          },
          easing: 'easeInSine',
          duration: 2000
        }),
        0
      )
      .add(
        this.animeStep('#to-server-arrow', {
          opacity: 1,
          duration: 1,
          easing: 'linear'
        })
      )
  }
}

StepBase.register(Step1)

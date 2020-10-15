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
        height: '100px',
        width: 0,
        position: 'absolute',
        left: '255px',
        top: '280px',
        transform: 'rotate(180deg)'
      }
    }
  }

  substeps() {
    return [
      'intro',

      () => this.createDestAnim('database', '200px'),

      () => this.createDestAnim('email', '150px'),

      () => this.createDestAnim('server', '200px', false),

      'arrow',

      'zoomOut',

      'multiplyPayload'
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

  arrow = this.animeStep('#to-server-arrow', {
    width: 205,
    duration: 300,
    easing: 'linear'
  })

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
          left: {
            value: 340,
            duration: 1000,
            delay: 1000
          },
          easing: 'easeInSine',
          duration: 2000
        }),
        0
      )
      .add(
        this.animeStep('#to-server-arrow', {
          scale: {
            value: 0.2,
            duration: 2000
          },
          width: {
            value: 360,
            duration: 1000,
            delay: 1000
          },
          left: {
            value: 340,
            duration: 1000,
            delay: 1000
          },
          top: {
            value: 250,
            duration: 1000,
            delay: 1000
          },
          height: {
            value: 175,
            duration: 1000,
            delay: 1000
          },
          easing: 'easeInSine'
        }),
        0
      )
  }

  createPayloadClones = () => {
    if (this.querySelectorAll('.payload-clone').length) return // Don't need to create payload clones again

    const payload = this.querySelector('#payload')

    const rows = 13
    const columns = 20
    const colSize = 50
    const rowSize = 70
    const rowSplit = 6
    const payloadTop = parseInt(payload.style.top)
    const payloadLeft = parseInt(payload.style.left)
    for (let i = 1; i < rows * columns; i++) {
      const column = Math.floor(i / rows)
      const row = i % rows

      const newPayload = payload.cloneNode()
      newPayload.classList.add('payload-clone')

      newPayload.style.opacity = 1
      newPayload.style.transform += ' scale(0.0)'
      const left = Math.floor(payloadLeft - column * colSize)
      const top = Math.floor(row > rowSplit ? payloadTop - (row - rowSplit) * rowSize : payloadTop + row * rowSize)
      newPayload.style.left = `${left}px`
      newPayload.style.top = `${top}px`

      this.appendChild(newPayload)
    }
  }

  deletePayloadClones = () => this.querySelectorAll('.payload-clone').forEach((c) => c.remove())

  multiplyPayload = this.animeStep(
    '.payload-clone',
    {
      opacity: 1,
      scale: 0.2,
      rotate: 720,
      duration: 1000,
      delay: anime.stagger([1, 1000]),
      easing: 'linear'
    },
    {
      enterStep: this.createPayloadClones,
      endReverseStep: this.deletePayloadClones
    }
  )
}

StepBase.register(Step1)

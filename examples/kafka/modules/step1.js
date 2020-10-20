class Step1 extends StepBase {
  constructor() {
    super()
  }

  name() {
    return 'step-1'
  }

  startSprites() {
    return [
      {
        id: 'payload',
        src: './img/payload.png',
        styles: {
          height: '275px',
          position: 'absolute',
          top: '200px',
          left: '-2100px',
          opacity: 0,
        },
      },
      {
        id: 'database',
        src: './img/database.png',
        styles: {
          height: '275px',
          position: 'absolute',
          left: '450px',
          top: '150px',
          opacity: 0,
        },
      },
      {
        id: 'email',
        src: './img/email.png',
        styles: {
          height: '375px',
          position: 'absolute',
          left: '450px',
          top: '100px',
          opacity: 0,
        },
      },
      {
        id: 'server',
        src: './img/server.png',
        styles: {
          height: '275px',
          position: 'absolute',
          left: '450px',
          top: '150px',
          opacity: 0,
        },
      },
      {
        id: 'to-server-arrow',
        src: './img/left-arrow.png',
        styles: {
          height: '100px',
          width: 0,
          position: 'absolute',
          left: '255px',
          top: '280px',
          transform: 'rotate(180deg)',
        },
      },
      {
        id: 'tombstone',
        src: './img/tombstone.png',
        styles: {
          height: '0px',
          width: '70px',
          position: 'absolute',
          left: '585px',
          bottom: '330px',
          animation: 'linearwipe 1s steps(100, end)',
        },
      },
    ]
  }

  substeps() {
    return [
      'intro',

      () => this.createDestAnim('database', '200px'),

      () => this.createDestAnim('email', '150px'),

      () => this.createDestAnim('server', '200px', false),

      'arrow',

      'zoomOut',

      'multiplyPayload',

      'deadServer',

      'goAway',
    ]
  }

  intro = this.animeStep('#payload', {
    left: '0px',
    opacity: 1,
    duration: 1000,
  })

  createDestAnim(target, top, goAway = true) {
    const t = anime
      .timeline(
        this.animeStep('#' + target, {
          easing: 'easeInOutQuint',
        })
      )
      .add({
        top,
        opacity: 1,
        duration: 1000,
      })
    if (goAway) {
      t.add({
        top: '250px',
        opacity: -0.1, // setting this to 0 causes a flicker
        duration: 1000,
      })
    }
    return t
  }

  arrow = this.animeStep('#to-server-arrow', {
    width: 205,
    duration: 300,
    easing: 'linear',
  })

  zoomOut = {
    anime: () =>
      anime
        .timeline()
        .add(
          this.animeStep('#server', {
            scale: 0.2,
            duration: 2000,
            easing: 'linear',
          })
        )
        .add(
          this.animeStep('#payload', {
            scale: {
              value: 0.2,
              duration: 2000,
            },
            left: {
              value: 340,
              duration: 1000,
              delay: 1000,
            },
            easing: 'easeInSine',
            duration: 2000,
          }),
          0
        )
        .add(
          this.animeStep('#to-server-arrow', {
            scale: {
              value: 0.2,
              duration: 2000,
            },
            width: {
              value: 360,
              duration: 1000,
              delay: 1000,
            },
            left: {
              value: 340,
              duration: 1000,
              delay: 1000,
            },
            top: {
              value: 250,
              duration: 1000,
              delay: 1000,
            },
            height: {
              value: 175,
              duration: 1000,
              delay: 1000,
            },
            easing: 'easeInSine',
          }),
          0
        ),
    endPlayStep: () => setTimeout(StepBase.impress.next(), 0),
  }

  createPayloadClones = () => {
    this.cloneGrid(
      'payload-clone',
      '#payload',
      20,
      13,
      50,
      70,
      { opacity: 1, transform: document.querySelector('#payload').style.transform + ' scale(0.0)' },
      99,
      6
    )
  }

  multiplyPayload = this.animeStep(
    '.payload-clone',
    {
      opacity: 1,
      scale: 0.2,
      rotate: 720,
      duration: 1000,
      delay: anime.stagger([1, 1000]),
      easing: 'linear',
    },
    {
      enterStep: this.createPayloadClones,
      onReset: this.deletePayloadClones,
    }
  )

  deadServer = () => {
    return anime
      .timeline({ easing: 'linear' })
      .add(
        this.animeStep('#server', {
          rotate: '90deg',
          duration: 1000,
          left: '+=30px',
          top: '+=10px',
        })
      )
      .add(
        this.animeStep('#server', {
          opacity: 0,
          duration: 500,
        })
      )
      .add(
        this.animeStep('#tombstone', {
          height: '70px',
          duration: 500,
        })
      )
  }

  goAway = () => {
    return anime
      .timeline({ easing: 'linear' })
      .add(
        this.animeStep('.payload-clone, #to-server-arrow, #tombstone', {
          translateX: {
            value: function () {
              return anime.random(1, 2) % 2 === 1 ? anime.random(-10000, -5000) : anime.random(10000, 5000)
            },
            delay: anime.stagger(1),
            duration: 1500,
          },
          translateY: {
            value: function () {
              return anime.random(1, 2) % 2 === 1 ? anime.random(-10000, -5000) : anime.random(10000, 5000)
            },
            delay: anime.stagger(1),
            duration: 1500,
          },
        })
      )
      .add(
        this.animeStep('#payload', {
          scale: 1,
          left: '-=100px',
          duration: 1500,
        }),
        0
      )
  }
}

StepBase.register(Step1)

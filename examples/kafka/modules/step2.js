class Step2 extends StepBase {
  constructor() {
    super()
  }

  name() {
    return 'step-2'
  }

  startSprites() {
    return [
      {
        id: 'payload',
        src: './img/payload.png',
        styles: {
          height: '175px',
          position: 'absolute',
          top: '250px',
          left: '-700px',
          opacity: 1,
        },
      },
      {
        id: 'pipe',
        src: './img/pipe.png',
        styles: {
          height: '350px',
          position: 'absolute',
          top: '15px',
          left: '290px',
          opacity: 1,
          transform: 'rotate(90deg)',
        },
      },
      {
        id: 'harddrive',
        src: './img/hard-drive.png',
        styles: {
          height: '205px',
          position: 'absolute',
          left: '235px',
          top: '400px',
        },
      },
    ]
  }

  substeps() {
    return ['focusPipe']
  }

  focusPipe = () => {
    return anime
      .timeline({ easing: 'linear' })
      .add(
        this.animeStep('#payload', {
          duration: 1000,
          left: '-100px',
        })
      )
      .add(
        this.animeStep('#harddrive', {
          opacity: 0,
          duration: 500,
        })
      )
      .add(
        this.animeStep('#pipe', {
          height: '587px',
          top: '50px',
          left: '507px',
          width: '142px',
          duration: 1000,
        })
      )
  }
}

StepBase.register(Step2)

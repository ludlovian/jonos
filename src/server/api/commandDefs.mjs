export const presets = {
  standard: {
    leader: 'bookroom',
    members: [
      ['bookroom', 25],
      ['bedroom', 25],
      ['parlour', 25],
      ['kitchen', 25],
      ['study', 12],
      ['archive', 12],
      ['diningroom', 12]
    ]
  },
  south: {
    leader: 'bookroom',
    members: [
      ['bookroom', 25],
      ['bedroom', 25],
      ['parlour', 25],
      ['kitchen', 25],
      ['archive', 12]
    ]
  },
  zoom: {
    leader: 'bookroom',
    members: [
      ['bookroom', 25],
      ['bedroom', 25],
      ['kitchen', 25],
      ['archive', 12],
      ['diningroom', 12]
    ]
  },
  guests: {
    leader: 'bookroom',
    members: [
      ['bookroom', 15],
      ['bedroom', 50],
      ['diningroom', 10],
      ['kitchen', 50],
      ['archive', 50],
      ['parlour', 12],
      ['study', 10]
    ]
  }
}

export const notifies = {
  test: {
    leader: 'study',
    uri:
      'https://media-readersludlow.s3.eu-west-1.amazonaws.com/public/feed-me-now.mp3',
    volume: 25,
    resume: true
  },
  downstairs: {
    leader: 'bookroom',
    uri:
      'https://media-readersludlow.s3-eu-west-1.amazonaws.com/public/come-downstairs.mp3',
    volume: 50
  },
  feedme: {
    leader: 'bookroom',
    uri:
      'https://media-readersludlow.s3.eu-west-1.amazonaws.com/public/feed-me-now.mp3',
    volume: 50,
    resume: true
  }
}

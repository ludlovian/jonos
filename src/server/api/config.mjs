export const presets = {
  standard: {
    leader: 'bedroom',
    members: [
      ['bedroom', 25],
      ['parlour', 25],
      ['bookroom', 25],
      ['kitchen', 25],
      ['office', 12],
      ['diningroom', 12]
    ]
  }
}

export const notifies = {
  test: {
    leader: 'roam',
    uri:
      'https://media-readersludlow.s3.eu-west-1.amazonaws.com/public/feed-me-now.mp3',
    volume: 25,
    resume: true
  },
  downstairs: {
    leader: 'bedroom',
    uri:
      'https://media-readersludlow.s3-eu-west-1.amazonaws.com/public/come-downstairs.mp3',
    volume: 50
  },
  feedme: {
    leader: 'bedroom',
    uri:
      'https://media-readersludlow.s3.eu-west-1.amazonaws.com/public/feed-me-now.mp3',
    volume: 50,
    resume: true
  }
}

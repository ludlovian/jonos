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
  },
  guests: {
    leader: 'bedroom',
    members: [
      ['bedroom', 50],
      ['bookroom', 15],
      ['diningroom', 10],
      ['kitchen', 50],
      ['office', 50],
      ['parlour', 12],
      ['roam', 50]
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

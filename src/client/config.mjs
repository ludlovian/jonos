export const presets = {
  standard: [
    {
      url: '/group/members/bedroom',
      body: [
        'bedroom',
        'parlour',
        'bookroom',
        'kitchen',
        'office',
        'diningroom'
      ]
    },
    {
      url: '/group/volume',
      body: {
        bedroom: 25,
        parlour: 25,
        bookroom: 25,
        kitchen: 25,
        office: 12,
        diningroom: 12
      }
    }
  ]
}

export const notifies = {
  downstairs: {
    url: '/group/notify/bedroom',
    body: {
      uri:
        'https://media-readersludlow.s3-eu-west-1.amazonaws.com/public/come-downstairs.mp3',
      volume: 50
    }
  }
}

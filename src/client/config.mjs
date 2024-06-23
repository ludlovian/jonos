export default {
  volumeThrottle: 250,
  volumeDisplayDelay: 2000,
  searchThrottle: 1000,

  presets: [
    {
      name: 'Standard',
      leader: 'bookroom',
      volumes: {
        bookroom: 25,
        bedroom: 25,
        parlour: 25,
        kitchen: 25,
        archive: 18,
        study: 12,
        diningroom: 12
      }
    },
    {
      name: 'Zoom',
      leader: 'bookroom',
      volumes: {
        bookroom: 25,
        bedroom: 25,
        kitchen: 25,
        archive: 18,
        diningroom: 12
      }
    },
    {
      name: 'Guests',
      leader: 'bookroom',
      volumes: {
        bookroom: 15,
        bedroom: 50,
        parlour: 12,
        kitchen: 50,
        archive: 50,
        study: 10,
        diningroom: 10
      }
    }
  ],

  notifies: [
    {
      name: 'Downstairs',
      player: 'bookroom',
      url:
        'https://media-readersludlow.s3-eu-west-1.amazonaws.com/public/come-downstairs.mp3',
      opts: { volume: 50 }
    },
    {
      name: 'Feed Us',
      player: 'bookroom',
      url:
        'https://media-readersludlow.s3.eu-west-1.amazonaws.com/public/feed-us-now.mp3',
      opts: { volume: 50, play: true }
    },
    {
      name: 'Test',
      player: 'study',
      url:
        'https://media-readersludlow.s3.eu-west-1.amazonaws.com/public/feed-me-now.mp3',
      opts: { volume: 20, play: true }
    }
  ]
}

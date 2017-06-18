module.exports = {
  FIXTURE_MAP_ID: '/assets/map_1',
  FIXTURE_MAP_POINTS: [
    {
      type: 'baseA',
      x: 10,
      y: 50,
    },
    {
      type: 'baseB',
      x: 100,
      y: 2,
    },
    {
      type: 'neutral',
      capacity: 100,
      x: 15,
      y: 15,
    },
    {
      type: 'neutral',
      capacity: 75,
      x: 40,
      y: 30,
    },
  ],
  MAP_COLONIES: [
    { image: 'colony:ally', type: 'ally', x: 10, y: 200 },
    { image: 'colony:neutral', type: 'neutral', x: 420, y: 320 },
    { image: 'colony:neutral', type: 'neutral', x: 120, y: 50 },
    { image: 'colony:neutral', type: 'neutral', x: 200, y: 250 },
    { image: 'colony:neutral', type: 'neutral', x: 300, y: 100 },
    { image: 'colony:enemy', type: 'enemy', x: 600, y: 200 },
  ],
};

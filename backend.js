const express = require('express');
const app = express();

const http = require('http');
const server = http.createServer(app);

const { Server } = require('socket.io');
const io = new Server(server, { pingInterval: 2000, pingTimeout: 5000 });

const port = 3000;

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

const backendPlayers = {};
const backendProjectiles = {};
let projectileId = 0;

io.on('connection', (socket) => {
  console.log(`User:${socket.id} connetected.`);
  backendPlayers[socket.id] = {
    x: 500 * Math.random(),
    y: 500 * Math.random(),
    color: `hsl(${Math.random() * 360}, 100%, 50%)`,
  };

  io.emit('updatePlayers', backendPlayers);

  socket.on("initCanvas", ({width, height})=>{
    backendPlayers[socket.id].canvas = {
      width,
      height
    }

  })

  socket.on('shoot', ({ x, y, angle }) => {
    projectileId++;

    const velocity = {
      x: Math.cos(angle) * 3,
      y: Math.sin(angle) * 3,
    };

    backendProjectiles[projectileId] = {
      x,
      y,
      velocity,
      playerId: socket.id,
    };
  });

  setInterval(() => {
    for (const id in backendProjectiles) {
      backendProjectiles[id].x += backendProjectiles[id].velocity.x;
      backendProjectiles[id].y += backendProjectiles[id].velocity.y;
  
      const radius_projectiles = 5;
      if (
        backendProjectiles[id].x - radius_projectiles >=
          backendPlayers[backendProjectiles[id].playerId]?.canvas?.width ||
        backendProjectiles[id].x + radius_projectiles <= 0 ||
        backendProjectiles[id].y - radius_projectiles >=
          backendPlayers[backendProjectiles[id].playerId]?.canvas?.height ||
        backendProjectiles[id].y + radius_projectiles <= 0
      ) {
        delete backendProjectiles[id];
      }
    }
  
    io.emit('updateProjectiles', backendProjectiles);
    io.emit('updatePlayers', backendPlayers);
  }, 15);
  


  
  socket.on('disconnect', (reason) => {
    console.log(reason);
    delete backendPlayers[socket.id];
    io.emit('updatePlayers', backendPlayers);
  });

  const speed = 4
  
  socket.on('keydown', (key) => {
    const player = backendPlayers[socket.id];
    if (!player) return;
  
    switch (key.keycode) {
      case 'KeyA':
      case 'ArrowLeft':
        player.x -= speed;
        break;
      case 'KeyD':
      case 'ArrowRight':
        player.x += speed;
        break;
      case 'KeyW':
      case 'ArrowUp':
        player.y -= speed;
        break;
      case 'KeyS':
      case 'ArrowDown':
        player.y += speed;
        break;
      default:
        break;
    }
  });
  

});

server.listen(port, () => {
  console.log(`app listening on port ${port}`);
});

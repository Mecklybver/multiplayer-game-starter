const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')
const socket = io()

const scoreEl = document.querySelector('#scoreEl')

const devicePixelRatio = window.devicePixelRatio || 1
canvas.width = innerWidth * devicePixelRatio
canvas.height = innerHeight * devicePixelRatio


const frontendPlayers = {}
const frontendProjectiles = {}

socket.on('connect', () => {
  socket.emit('initCanvas', {
    width: canvas.width,
    height: canvas.height,
    devicePixelRatio
  })
})

socket.on('gameOver', () => {
  showGameOverMessage();
});

function showGameOverMessage() {
  ctx.fillStyle = 'red';
  ctx.font = '48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
  animationId = cancelAnimationFrame(animate)

}

socket.on('updateProjectiles', (backendProjectiles) => {
  for (const id in backendProjectiles) {
    const backendProjectile = backendProjectiles[id];

    if (!frontendProjectiles[id]) {
      frontendProjectiles[id] = new Projectile({
        x: backendProjectile.x,
        y: backendProjectile.y,
        radius: 5,
        color: frontendPlayers[backendProjectile.playerId]?.color,
        velocity: backendProjectile.velocity,
      });
    } else {
      // Update the x and y coordinates of the frontend projectile directly from the backend data.
      frontendProjectiles[id].x = backendProjectile.x;
      frontendProjectiles[id].y = backendProjectile.y;
    }
  }

  // Remove any frontend projectiles that don't exist on the backend.
  for (const frontendProjectileId in frontendProjectiles) {
    if (!backendProjectiles[frontendProjectileId]) {
      delete frontendProjectiles[frontendProjectileId];
    }
  }
});


socket.on('updatePlayers', (backendPlayers) => {
  for (const id in backendPlayers) {
    const backendPlayer = backendPlayers[id]
    if (!frontendPlayers[id]) {
      frontendPlayers[id] = new Player({
        x: backendPlayer.x,
        y: backendPlayer.y,
        radius: 10,
        color: backendPlayer.color,
      })

      document.querySelector("#playerLabel").innerHTML +=
      `<div data-id="${id}">${id}: ${backendPlayer.score}</div>`
    } else {
      document.querySelector(`div[data-id="${id}"]`).innerHTML = 
      `${id}: ${backendPlayer.score}`

      document.querySelector(`div[data-id="${id}"]`)
      .setAttribute("data-score" , backendPlayer.score)

      const parentDiv = document.querySelector("#playerLabel")
      const childDivs = Array.from(parentDiv.querySelectorAll("div"))

      childDivs.sort((a, b) => {
        const scoreA = Number(a.getAttribute("data-score"))
        const scoreB = Number(b.getAttribute("data-score"))

        return scoreB - scoreA
      })

      childDivs.forEach(div => {
        parentDiv.removeChild(div)
      })
      childDivs.forEach(div => {
        parentDiv.appendChild(div)
      })



      if (id === socket.id) {
        // if a player already exists
        frontendPlayers[id].x = backendPlayer.x
        frontendPlayers[id].y = backendPlayer.y
        const lastBackendInputIndex = playerInputs.findIndex((input) => {
          return backendPlayer.sequenceNumber === input.sequenceNumber
        })
        if (lastBackendInputIndex > -1)
          playerInputs.splice(0, lastBackendInputIndex + 1)
        playerInputs.forEach((input) => {
          frontendPlayers[id].x += input.dx
          frontendPlayers[id].y += input.dy
        })
      } else {
        // for all other players
        gsap.to(frontendPlayers[id], {
          x: backendPlayer.x,
          y: backendPlayer.y,
          duration: 0.015,
          ease: 'linear'
        })
      }
    }
  }

  // this is where we delete frontendPlayers
  for (const id in frontendPlayers) {
    if (!backendPlayers[id]) {
      const divToDelete = document.querySelector(`div[data-id="${id}"]`)
      divToDelete.parentNode.removeChild(divToDelete)
      delete frontendPlayers[id]
    }
  }
})
let animationId
function animate() {
  animationId = requestAnimationFrame(animate)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  for (const id in frontendPlayers) {
    const frontEndPlayer = frontendPlayers[id]
    frontEndPlayer.draw()
  }

  for (const id in frontendProjectiles) {
    const frontEndProjectile = frontendProjectiles[id]
    frontEndProjectile.draw()
  }


}


animate()
const keys = {
  w: { pressed: false },
  a: { pressed: false },
  s: { pressed: false },
  d: { pressed: false },
  ArrowLeft: { pressed: false },
  ArrowRight: { pressed: false },
  ArrowDown: { pressed: false },
  ArrowUp: { pressed: false }
};

const SPEED = 10;
const playerInputs = [];
let sequenceNumber = 0;

setInterval(() => {
  if (keys.w.pressed || keys.ArrowUp.pressed) {
    sequenceNumber++;
    playerInputs.push({ sequenceNumber, dx: 0, dy: -SPEED });
    frontendPlayers[socket.id].y -= SPEED;
    socket.emit('keydown', { keycode: 'KeyW', sequenceNumber });
  }

  if (keys.a.pressed || keys.ArrowLeft.pressed) {
    sequenceNumber++;
    playerInputs.push({ sequenceNumber, dx: -SPEED, dy: 0 });
    frontendPlayers[socket.id].x -= SPEED;
    socket.emit('keydown', { keycode: 'KeyA', sequenceNumber });
  }

  if (keys.s.pressed || keys.ArrowDown.pressed) {
    sequenceNumber++;
    playerInputs.push({ sequenceNumber, dx: 0, dy: SPEED });
    frontendPlayers[socket.id].y += SPEED;
    socket.emit('keydown', { keycode: 'KeyS', sequenceNumber });
  }

  if (keys.d.pressed || keys.ArrowRight.pressed) {
    sequenceNumber++;
    playerInputs.push({ sequenceNumber, dx: SPEED, dy: 0 });
    frontendPlayers[socket.id].x += SPEED;
    socket.emit('keydown', { keycode: 'KeyD', sequenceNumber });
  }
}, 15);

window.addEventListener('keydown', (e) => {
  if (!frontendPlayers[socket.id]) return;

  switch (e.code) {
    case 'KeyW':
      keys.w.pressed = true;
      break;

    case 'KeyA':
      keys.a.pressed = true;
      break;

    case 'KeyS':
      keys.s.pressed = true;
      break;

    case 'KeyD':
      keys.d.pressed = true;
      break;

    case 'ArrowUp':
      keys.ArrowUp.pressed = true;
      break;

    case 'ArrowLeft':
      keys.ArrowLeft.pressed = true;
      break;

    case 'ArrowDown':
      keys.ArrowDown.pressed = true;
      break;

    case 'ArrowRight':
      keys.ArrowRight.pressed = true;
      break;
  }
});

window.addEventListener('keyup', (e) => {
  if (!frontendPlayers[socket.id]) return;

  switch (e.code) {
    case 'KeyW':
      keys.w.pressed = false;
      break;

    case 'KeyA':
      keys.a.pressed = false;
      break;

    case 'KeyS':
      keys.s.pressed = false;
      break;

    case 'KeyD':
      keys.d.pressed = false;
      break;

    case 'ArrowUp':
      keys.ArrowUp.pressed = false;
      break;

    case 'ArrowLeft':
      keys.ArrowLeft.pressed = false;
      break;

    case 'ArrowDown':
      keys.ArrowDown.pressed = false;
      break;

    case 'ArrowRight':
      keys.ArrowRight.pressed = false;
      break;
  }
});

addEventListener('click', (e) => {
 

  const playerPosition = {
    x: frontendPlayers[socket.id].x,
    y: frontendPlayers[socket.id].y
  }

  const angle = Math.atan2(e.offsetY * window.devicePixelRatio - playerPosition.y,
    e.offsetX * window.devicePixelRatio - playerPosition.x);
  // const velocity = {
  //   x: Math.cos(angle) * 5,
  //   y: Math.sin(angle) * 5
  // };
  socket.emit("shoot", {
    x: playerPosition.x,
    y: playerPosition.y,
    angle
    
  })
  // frontendProjectiles.push(
  //   new Projectile({
  //     x: playerPosition.x,
  //     y: playerPosition.y,
  //     radius: 5,
  //     color: 'white',
  //     velocity
  //   })
  // );
  console.log(frontendProjectiles);
});

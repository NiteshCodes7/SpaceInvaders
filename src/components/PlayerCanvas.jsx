import React, { useState, useRef, useEffect } from 'react';

const PlayerCanvas = () => {
  const canvasRef = useRef(null);
  const playerRef = useRef({
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    width: 0,
    height: 0,
    rotate: 0,
    image: null,
  });

  const invadersRef = useRef([]);
  const firstGridCreatedRef = useRef(false);
  const projectilesRef = useRef([]);
  const invadersProjectilesRef = useRef([]);
  const canShootRef = useRef(true);
  const invaderCanShootRef = useRef(true);
  const keysPressed = useRef({ a: false, d: false, space: false });
  let nextGridMovingRight = true;
  const particlesRef = useRef([]);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const score = useRef(0);

  const enemyKillSoundRef = useRef(new Audio('../sounds/explode.wav'));
  const backGroundMusic = useRef(new Audio('../sounds/backgroundMusic.wav'))
  const shootMusic = useRef(new Audio('../sounds/shoot.wav'))
  const enemyShootMusic = useRef(new Audio('../sounds/enemyShoot.wav'))


  // Start the game when the "Start Game" button is clicked
  const startGame = () => {
    setGameStarted(true);
  };


  // Player 
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const image = new Image();
    image.src = './img/spaceship.png';
    image.onload = () => {
      const scale = 0.15;
      playerRef.current.width = image.width * scale;
      playerRef.current.height = image.height * scale;
      playerRef.current.position = {
        x: canvas.width / 2 - playerRef.current.width / 2,
        y: canvas.height - playerRef.current.height - 20,
      };
      playerRef.current.image = image;
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      playerRef.current.position = {
        x: window.innerWidth / 2 - playerRef.current.width / 2,
        y: window.innerHeight - playerRef.current.height - 20,
      };
    };
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Invaders 
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    const createInvaderGrid = () => {
      const image = new Image();
      image.src = './img/invader.png';
      image.onload = () => {
        const scale = 1;
        const invaderWidth = image.width * scale;
        const invaderHeight = image.height * scale;
        const rows = Math.floor(Math.random() * 5) + 2;
        const columns = Math.floor(Math.random() * 10) + 5;
        const spacing = 30;

        const totalInvadersWidth = columns * (invaderWidth + spacing) - spacing;

        const startX = (canvas.width - totalInvadersWidth) / 2;
        const invaderGrid = [];
        for (let i = 0; i < columns; i++) {
          for (let j = 0; j < rows; j++) {
            invaderGrid.push({
              position: {
                x: startX + (i * spacing), 
                y: j * spacing
              },
              velocity: { 
                x: 4, 
                y: 13 
              },
              width: invaderWidth,
              height: invaderHeight,
              image,
              movingRight: nextGridMovingRight,
            });
          }
        }
        invadersRef.current.push(invaderGrid);
        nextGridMovingRight = !nextGridMovingRight;
      };
    };
    if (!firstGridCreatedRef.current) {
      createInvaderGrid();
      firstGridCreatedRef.current = true;
    }
    const gridInterval = setInterval(() => {
      createInvaderGrid();
    }, 15000);

    return () => clearInterval(gridInterval);
  }, []);


  // Create falling particles
  const createBackgroundParticles = () => {
    const numParticles = 50; 

    for (let i = 0; i < numParticles; i++) {
      const particle = {
        x: Math.random() * canvasRef.current.width, 
        y: Math.random() * canvasRef.current.height, 
        radius: Math.random() * 2 + 1, 
        velocity: {
          x: 0, 
          y: Math.random() * 2 + 1,
        },
        alpha: 0.25, 
      };
      particlesRef.current.push(particle);
    }
  };

  // Update and draw the falling particles
  const updateBackgroundParticles = () => {
    const ctx = canvasRef.current.getContext('2d');
    particlesRef.current.forEach((particle, index) => {
      particle.y += particle.velocity.y;

      // Reset particle to top when it reaches the bottom
      if (particle.y > canvasRef.current.height) {
        particle.y = -particle.radius; 
        particle.x = Math.random() * canvasRef.current.width;
      }

      // Draw the particle
      ctx.fillStyle = `rgba(255, 255, 255, ${particle.alpha})`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.closePath();
    });
  };

  const checkGameOver = () => {
    // Check if any invader projectile collides with the player
    for (const proj of invadersProjectilesRef.current) {
      if (
        proj.x > playerRef.current.position.x &&
        proj.x < playerRef.current.position.x + playerRef.current.width &&
        proj.y > playerRef.current.position.y &&
        proj.y < playerRef.current.position.y + playerRef.current.height
      ) {
        setGameOver(true);
        return true;
      }
    }

    // Check if any invader collides with the player
    for (const invaderGrid of invadersRef.current) {
      for (const invader of invaderGrid) {
        if (
          invader.position.x < playerRef.current.position.x + playerRef.current.width &&
          invader.position.x + invader.width > playerRef.current.position.x &&
          invader.position.y < playerRef.current.position.y + playerRef.current.height &&
          invader.position.y + invader.height > playerRef.current.position.y
        ) {
          setGameOver(true);
          return true;
        }
      }
    }

    return false;
  };

  // Canvas
  useEffect(() => {
    if (gameOver) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    createBackgroundParticles();

    if (gameStarted) {
      backGroundMusic.current.loop = true; // Loop the background music
      backGroundMusic.current.play().catch((error) => console.log("Audio play error:", error));
    }

    else return () => {
      backGroundMusic.current.pause();
    };

    const updatePosition = () => {
      if (
        playerRef.current.position.x + playerRef.current.velocity.x >= 0 &&
        playerRef.current.position.x + playerRef.current.velocity.x + playerRef.current.width <= window.innerWidth
      ) {
        playerRef.current.position.x += playerRef.current.velocity.x;
      }

      if (playerRef.current.velocity.x > 0) {
        playerRef.current.rotate = 0.17;
      } else if (playerRef.current.velocity.x < 0) {
        playerRef.current.rotate = -0.17;
      } else {
        playerRef.current.rotate = 0;
      }
    };

    const shootProjectile = () => {
      if (canShootRef.current && keysPressed.current.space) {
        shootMusic.current.play();
        const projectile = {
          x: playerRef.current.position.x + playerRef.current.width / 2,
          y: playerRef.current.position.y,
          radius: 4,
          velocity: { y: 10 },
        };
        projectilesRef.current.push(projectile);
        canShootRef.current = false;

        setTimeout(() => {
          canShootRef.current = true;
        }, 160);
      }
    };

    //invader shoot projectile
    const invaderShootProjectile = () => {
      invadersRef.current.forEach((invaderGrid) => {
        const randomInvader = invaderGrid[Math.floor(Math.random() * invaderGrid.length)];
        if (randomInvader) {
          enemyShootMusic.current.play();
          const invaderProjectile = {
            x: randomInvader.position.x + randomInvader.width / 2,
            y: randomInvader.position.y + randomInvader.height,
            velocity: { y: 5 },
          };

          invadersProjectilesRef.current.push(invaderProjectile);
        }
      });
    };

    //move invaders downwards
    const moveInvaderProjectiles = () => {
      invadersProjectilesRef.current.forEach((proj) => {
        proj.y += proj.velocity.y;

        if (proj.y > canvas.height) {
          invadersProjectilesRef.current.splice(invadersProjectilesRef.current.indexOf(proj), 1);
        }
      });
    };

    if(invaderCanShootRef.current){
      setInterval(() => {
        invaderShootProjectile();
      }, 3000)
      invaderCanShootRef.current = !invaderCanShootRef.current;
    }

    //check collision between player projectile and invader
    const checkCollision = (projectile, invader) => {
      return (
        projectile.x - projectile.radius < invader.position.x + invader.width &&
        projectile.x + projectile.radius > invader.position.x &&
        projectile.y - projectile.radius < invader.position.y + invader.height &&
        projectile.y + projectile.radius > invader.position.y
      );
    };

    const updateProjectiles = () => {
      projectilesRef.current.forEach((proj, projIndex) => {
        proj.y += -proj.velocity.y;

        if (proj.y + proj.radius <= 0) {
          projectilesRef.current.splice(projIndex, 1);
        }

        invadersRef.current.forEach((invaderGrid, gridIndex) => {
          invaderGrid.forEach((invader, invIndex) => {
            if (checkCollision(proj, invader)) {
              invaderGrid.splice(invIndex, 1);
              projectilesRef.current.splice(projIndex, 1);

              enemyKillSoundRef.current.play();
              //score increment
              score.current = score.current + 50;

              if (invaderGrid.length === 0) {
                invadersRef.current.splice(gridIndex, 1);
              }
              return;
            }
          });
        });
      });

      moveInvaderProjectiles();
    };

    const updateInvaders = () => {
      invadersRef.current.forEach((invaderGrid) => {
        const leftmostInvader = Math.min(...invaderGrid.map((invd) => invd.position.x));
        const rightmostInvader = Math.max(...invaderGrid.map((invd) => invd.position.x + invd.width));

        if (rightmostInvader >= window.innerWidth || leftmostInvader <= 0) {
          invaderGrid.forEach((invd) => {
            invd.movingRight = !invd.movingRight;
            invd.position.y += invd.velocity.y;
          });
        }

        invaderGrid.forEach((invd) => {
          invd.position.x += invd.movingRight ? invd.velocity.x : -invd.velocity.x;
        });
      });
    };

    const draw = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = 'black';
      context.fillRect(0, 0, canvas.width, canvas.height);

      if (playerRef.current.image) {
        context.save();

        context.translate(playerRef.current.position.x + playerRef.current.width / 2, playerRef.current.position.y + playerRef.current.width / 2);

        context.rotate(playerRef.current.rotate);

        context.drawImage(
          playerRef.current.image,
          -playerRef.current.width / 2,
          -playerRef.current.height / 2,
          playerRef.current.width,
          playerRef.current.height
        );
        context.restore();
      }

      invadersRef.current.forEach((invaderGrid) => {
        invaderGrid.forEach((invader) => {
          if (invader.image) {
            context.drawImage(
              invader.image, 
              invader.position.x, 
              invader.position.y, 
              invader.width, 
              invader.height
            );
          }
        });
      });

      projectilesRef.current.forEach((proj) => {
        context.fillStyle = 'red';
        context.beginPath();
        context.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
        context.fill();
        context.closePath();
      });

      invadersProjectilesRef.current.forEach((projs) => {
        context.fillStyle = 'white';
        context.fillRect(projs.x, projs.y, 3, 10);
      });

      
    // Display score
    context.fillStyle = 'white';
    context.font = '24px Arial';
    context.fillText(`Score: ${score.current}`, 20, 40);
    };

    const animate = () => {
      if (checkGameOver()) return;

      updatePosition();
      shootProjectile();
      updateProjectiles();
      updateInvaders();
      draw();
      updateBackgroundParticles();
      requestAnimationFrame(animate);
    };
    animate();

    const handleKeyDown = (event) => {
      if (event.key === 'a'){
        playerRef.current.velocity.x = -7
        keysPressed.current.a = true
      };
      if (event.key === 'd'){
        playerRef.current.velocity.x = 7
        keysPressed.current.a = true
      };
      if (event.key === ' ') keysPressed.current.space = true;
    };

    const handleKeyUp = (event) => {
      if (event.key === 'a'){
        playerRef.current.velocity.x = 0;
        keysPressed.current.a = false
      };
      if (event.key === 'd'){
        playerRef.current.velocity.x = 0;
        keysPressed.current.a = false
      };
      if (event.key === ' ') keysPressed.current.space = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameStarted, gameOver]);

  return (
      <div className='bg-black'>
        {!gameStarted && (
          <button
            onClick={startGame}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              padding: '1em 2em',
              fontSize: '1.5em',
              cursor: 'pointer',
              zIndex: 10,  
              backgroundColor: 'blue', 
              color: 'white',
              border: 'none',
              borderRadius: '8px',
            }}
          >
            Start Game
          </button>
        )}

    {gameOver && (
    <div style={{ 
      position: 'absolute', 
      top: '50%', 
      left: '50%', 
      transform: 'translate(-50%, -50%)', 
      color: 'red', 
      fontSize: '2em' 
      }}>
      Game Over
    </div>
  )}

  <canvas ref={canvasRef} style={{ height: '100vh' }} />;
  </div>
)
};

export default PlayerCanvas;

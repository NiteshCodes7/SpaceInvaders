import React, { useRef, useEffect } from 'react';

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
  const projectilesRef = useRef([])
  const canShootRef = useRef(true)

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

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    const updatePosition = () => {
        if(playerRef.current.position.x + playerRef.current.velocity.x >= 0 && playerRef.current.position.x + playerRef.current.velocity.x + playerRef.current.width <= window.innerWidth){
            playerRef.current.position.x += playerRef.current.velocity.x;
        }

        if (playerRef.current.velocity.x > 0) {
            playerRef.current.rotate = 0.17; 
        }
        else if (playerRef.current.velocity.x < 0) {
            playerRef.current.rotate = -0.17; 
        }
        else{
            playerRef.current.rotate = 0
        }
    };

    const updateProjectiles = () => {
        projectilesRef.current.forEach((proj) => {
            proj.y += -proj.velocity.y;
        })
    }

    const draw = () => {
      context.clearRect(0, 0, canvas.width, canvas.height); 
      context.fillStyle = 'black';
      context.fillRect(0, 0, canvas.width, canvas.height); 

      if (playerRef.current.image) {
        context.save();

        context.translate(playerRef.current.position.x + playerRef.current.width / 2, playerRef.current.position.y + playerRef.current.width / 2)

        context.rotate(playerRef.current.rotate)

        context.drawImage(
          playerRef.current.image,
          -playerRef.current.width / 2,
          -playerRef.current.height / 2,
          playerRef.current.width,
          playerRef.current.height
        );
        context.restore();
      }

      projectilesRef.current.forEach((proj) => {
        context.fillStyle = 'red';
        context.beginPath();
        context.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2); 
        context.fill();
        context.closePath();
      });
    };

    const animate = () => {
      updatePosition();
      updateProjectiles();
      draw();
      requestAnimationFrame(animate);
    };
    animate(); 

    const handleKeyDown = (event) => {
      switch (event.key) {
        case 'a':
          playerRef.current.velocity.x = -7;
          break;
        case 'd':
          playerRef.current.velocity.x = 7;
          break;
        case ' ':
            shootProjectile();
            canShootRef.current = false
            setTimeout(() => {
                canShootRef.current = true
            }, 1000)
            break;
        default:
          break;
      }
    };

    const handleKeyUp = () => {
      playerRef.current.velocity.x = 0;
    };

    const shootProjectile = () => {
        const projectile = {
          x: playerRef.current.position.x + playerRef.current.width / 2 ,
          y: playerRef.current.position.y, 
          radius: 5,
          velocity: { y: 10 },
        };
        projectilesRef.current.push(projectile); 
      };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ height: '100vh' }} />;
};

export default PlayerCanvas;

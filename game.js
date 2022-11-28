const canvas = document.querySelector("canvas");
const startGameBtn = document.querySelector("#startGameBtn");
const modalEl = document.querySelector("#modalEl");
const scoreEl = document.querySelector("#scoreEl");
const bigScoreEl = document.querySelector("#bigScoreEl");

const ctx = canvas.getContext("2d");

canvas.width = innerWidth;
canvas.height = innerHeight;

class Player {
  constructor(x, y, radius, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}

class Projectile {
  constructor(x, y, radius, color, velocity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    ctx.fill();
  }

  update() {
    this.draw();
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
  }
}

class Enemy {
  constructor(x, y, radius, color, velocity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    ctx.fill();
  }

  update() {
    this.draw();
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
  }
}

const friction = 0.99;

class Particle {
  constructor(x, y, radius, color, velocity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
    this.alpha = 1;
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.restore();
  }

  update() {
    this.draw();
    this.velocity.x *= friction;
    this.velocity.y *= friction;
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
    this.alpha -= 0.01;
  }
}

const startX = canvas.width / 2;
const startY = canvas.height / 2;

let player = new Player(startX, startY, 10, "white");
let projectiles = [];
let enemies = [];
let particles = [];
let score = 0;

const init = () => {
  player = new Player(startX, startY, 10, "white");
  projectiles = [];
  enemies = [];
  particles = [];
  score = 0;
  scoreEl.innerHTML = score;
  bigScoreEl.innerHTML = score;
};

let spawnEnemiesTimerId;

const spawnEnemies = () => {
  spawnEnemiesTimerId = setInterval(() => {
    const radius = Math.random() * (30 - 10) + 10;

    let x;
    let y;

    if (Math.random() < 0.5) {
      x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
      y = Math.random() * canvas.height;
    } else {
      x = Math.random() * canvas.width;
      y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
    }

    const color = `hsl(${Math.random() * 360}, 50%, 50%)`;

    const angle = Math.atan2(startY - y, startX - x);
    const velocity = {
      x: Math.cos(angle),
      y: Math.sin(angle),
    };

    enemies.push(new Enemy(x, y, radius, color, velocity));
  }, 1000);
};

let animationId;

const animate = () => {
  animationId = requestAnimationFrame(animate);
  ctx.fillStyle = "rgb(0, 0, 0, 0.1)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  player.draw();

  particles.forEach((particle, particleIdx) => {
    if (particle.alpha <= 0) {
      setTimeout(() => {
        particles.slice(particleIdx, 1);
      }, 0);
    } else {
      particle.update();
    }
  });

  projectiles.forEach((projectile, projectileIdx) => {
    projectile.update();

    if (
      projectile.x + projectile.radius < 0 ||
      projectile.x - projectile.radius > canvas.width ||
      projectile.y + projectile.radius < 0 ||
      projectile.y - projectile.radius > canvas.height
    ) {
      setTimeout(() => {
        projectiles.splice(projectileIdx, 1);
      }, 0);
    }
  });

  enemies.forEach((enemy, enemyIdx) => {
    enemy.update();

    const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);

    // end game
    if (dist - enemy.radius - player.radius < 1) {
      cancelAnimationFrame(animationId);
      modalEl.style.display = "flex";
      bigScoreEl.innerHTML = score;
      clearInterval(spawnEnemiesTimerId);
    }

    projectiles.forEach((projectile, projectileIdx) => {
      const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);

      // projectile collides enemy
      if (dist - enemy.radius - projectile.radius < 1) {
        // create explosions
        for (let i = 0; i < enemy.radius * 2; i++) {
          particles.push(
            new Particle(
              projectile.x,
              projectile.y,
              Math.random() * 2,
              enemy.color,
              {
                x: (Math.random() - 0.5) * (Math.random() * 6),
                y: (Math.random() - 0.5) * (Math.random() * 6),
              }
            )
          );
        }

        if (enemy.radius - 10 > 5) {
          // hurt enemy and increase score
          score += 100;
          scoreEl.innerHTML = score;

          gsap.to(enemy, {
            radius: enemy.radius - 10,
          });
          setTimeout(() => {
            projectiles.splice(projectileIdx, 1);
          }, 0);
        } else {
          // kill enemy increase score
          score += 250;
          scoreEl.innerHTML = score;

          setTimeout(() => {
            enemies.splice(enemyIdx, 1);
            projectiles.splice(projectileIdx, 1);
          }, 0);
        }
      }
    });
  });
};

addEventListener("click", (event) => {
  const angle = Math.atan2(event.clientY - startY, event.clientX - startX);
  const velocity = {
    x: Math.cos(angle) * 5,
    y: Math.sin(angle) * 5,
  };

  projectiles.push(new Projectile(startX, startY, 5, "white", velocity));
});

startGameBtn.addEventListener("click", () => {
  init();
  animate();
  spawnEnemies();
  modalEl.style.display = "none";
});

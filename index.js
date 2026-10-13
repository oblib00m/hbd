const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const button = document.getElementById("start");

let W, H;
let particles = [];
let started = false;
let audioCtx;
let musicTimer;

// UKURAN LAYAR
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  W = window.innerWidth;
  H = window.innerHeight;

  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + "px";
  canvas.style.height = H + "px";

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  createParticles();
}

// TULISAN JADI TITIK

function getTextPoints(text, font, maxWidth) {
  const temp = document.createElement("canvas");
  const tctx = temp.getContext("2d");

  temp.width = Math.floor(maxWidth);
  temp.height = 120;

  tctx.font = font;
  tctx.textAlign = "center";
  tctx.textBaseline = "middle";
  tctx.fillStyle = "#fff";

  tctx.fillText(text, temp.width / 2, 60);

  const pixels = tctx.getImageData(
    0, 0, temp.width, temp.height
  ).data;

  const points = [];
  const step = 3;

  for (let y = 0; y < temp.height; y += step) {
    for (let x = 0; x < temp.width; x += step) {
      const alpha = pixels[(y * temp.width + x) * 4 + 3];

      if (alpha > 100) {
        points.push({
          x: x - temp.width / 2,
          y: y - 60
        });
      }
    }
  }

  return points;
}


// HATI
function getHeartPoints(centerX, centerY, size) {
  const points = [];

  // Persamaan matematika bentuk hati.
  // Grid rapat membuat bagian dalam hati terisi.
  const step = 0.045;

  for (let x = -1.2; x <= 1.2; x += step) {
    for (let y = -1.2; y <= 1.2; y += step) {

      const equation =
        Math.pow(x * x + y * y - 1, 3)
        - x * x * Math.pow(y, 3);

      if (equation <= 0) {
        points.push({
          x: centerX + x * size,
          y: centerY - y * size
        });
      }
    }
  }

  return points;
}

// =============================
// 4. MEMBUAT TARGET PARTIKEL

function createParticles() {
  particles = [];

  // Ukuran hati menyesuaikan layar
  const heartSize = Math.min(W * 0.205, H * 0.19);

  const heart = getHeartPoints(
    W / 2,
    H * 0.33,
    heartSize
  );

  // Ukuran tulisan
  const fontSize = Math.max(
    14,
    Math.min(W * 0.065, 42)
  );

  const text = getTextPoints(
    "HAPPY BIRTHDAY MAMAH IS!",
    `bold ${fontSize}px Arial`,
    W * 0.94
  ).map(point => ({
    x: W / 2 + point.x,
    y: H * 0.72 + point.y
  }));

  // Pisahkan target hati dan target tulisan
  const allTargets = [
    ...heart,
    ...text
  ];

  // 1800 partikel
  const count = Math.min(
    1800,
    Math.max(900, Math.floor(W * H / 500))
  );

  // Acak target supaya partikel tersebar merata
  for (let i = allTargets.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allTargets[i], allTargets[j]] =
      [allTargets[j], allTargets[i]];
  }

  for (let i = 0; i < count; i++) {
    const target = allTargets[
      Math.floor(i * allTargets.length / count)
    ];

    particles.push({
      x: Math.random() * W,
      y: Math.random() * H,

      tx: target.x,
      ty: target.y,

      size: Math.random() * 1.7 + 0.7,
      alpha: Math.random() * 0.55 + 0.45,
      speed: Math.random() * 0.025 + 0.025,
      hue: 265 + Math.random() * 55,
      phase: Math.random() * Math.PI * 2,

      // Gerakan halus saat debu masih menyebar
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8
    });
  }
}


// ANIMASI DEBU UNGU
function draw() {
  requestAnimationFrame(draw);

  ctx.clearRect(0, 0, W, H);

  const time = performance.now() * 0.001;

  // Latar belakang bercahaya
  const background = ctx.createRadialGradient(
    W / 2, H * 0.4, 0,
    W / 2, H * 0.4, Math.max(W, H) * 0.7
  );

  background.addColorStop(0, "#241039");
  background.addColorStop(0.55, "#13091f");
  background.addColorStop(1, "#07040d");

  ctx.fillStyle = background;
  ctx.fillRect(0, 0, W, H);

  for (const p of particles) {
    if (started) {
      // Partikel bergerak menuju target masing-masing
      p.x += (p.tx - p.x) * p.speed;
      p.y += (p.ty - p.y) * p.speed;

      // Getaran kecil agar bentuk terasa hidup
      p.x += Math.sin(time * 1.5 + p.phase) * 0.12;
      p.y += Math.cos(time * 1.5 + p.phase) * 0.12;
    } else {
      // Debu berterbangan sebelum membentuk hati
      p.x += p.vx + Math.sin(time + p.phase) * 0.35;
      p.y += p.vy + Math.cos(time + p.phase) * 0.35;

      if (p.x < 0) p.x = W;
      if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H;
      if (p.y > H) p.y = 0;
    }

    const twinkle =
      0.65 + 0.35 * Math.sin(time * 3 + p.phase);

    const radius =
      p.size * (0.8 + 0.2 * twinkle);

    // Cahaya debu
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);

    ctx.fillStyle =
      `hsla(${p.hue}, 100%, 78%, ${p.alpha * twinkle})`;

    ctx.shadowColor =
      `hsl(${p.hue}, 100%, 70%)`;

    ctx.shadowBlur = 7;
    ctx.fill();
  }

  ctx.shadowBlur = 0;
}

const song = document.getElementById("birthdaySong");
button.addEventListener("click", async () => {
  if (started) return;

  started = true;
  button.style.display = "none";

  song.currentTime = 0;
  song.volume = 0.8;

  try {
    await song.play();
  } catch (error) {
    console.error("Lagu gagal diputar:", error);
  }
});

// 7. TOMBOL START
button.addEventListener("click", async () => {
  if (started) return;

  started = true;
  button.style.display = "none";

  birthdayMusic();
});

// Jalankan
resize();
draw();
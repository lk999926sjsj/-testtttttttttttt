
(function(){
  if(document.getElementById("khz-panel")) return;

  const style = document.createElement("style");
  style.textContent = `
    @keyframes fadeOut {
      0% { opacity: 1 }
      100% { opacity: 0 }
    }
    .khz-splash {
      position: fixed;
      top: 0; left: 0;
      width: 100vw; height: 100vh;
      background: #000;
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 999999;
      color: #800080;
      font-size: 42px;
      font-family: sans-serif;
      font-weight: bold;
      transition: opacity 1s ease;
    }
    .khz-splash.fadeout {
      animation: fadeOut 1s ease forwards;
    }
    .khz-toggle {
      position: fixed;
      bottom: 20px;
      left: 20px;
      width: 40px;
      height: 40px;
      background: #111;
      border: 2px solid #800080;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 100000;
      color: #fff;
      font-size: 20px;
      font-weight: bold;
      box-shadow: 0 0 10px #800080;
      font-family: sans-serif;
      transition: 0.3s;
    }
    .khz-toggle:hover {
      background: #800080;
    }
    .khz-panel {
      position: fixed;
      top: 100px;
      left: 100px;
      width: 280px;
      background: rgba(0, 0, 0, 0.95);
      border-radius: 16px;
      padding: 20px;
      z-index: 99999;
      color: #fff;
      font-family: sans-serif;
      box-shadow: 0 0 20px rgba(128, 0, 128, 0.6);
      cursor: grab;
      display: none;
    }
    .khz-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .khz-title {
      font-weight: bold;
      font-size: 20px;
      background: linear-gradient(to right, #800080, #000);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .khz-button {
      display: block;
      width: 100%;
      margin: 10px 0;
      padding: 10px;
      background: #111;
      color: white;
      border: 2px solid #800080;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      transition: 0.3s;
    }
    .khz-button:hover {
      background: #800080;
      border-color: #fff;
    }
  `;
  document.head.appendChild(style);

  const splash = document.createElement("div");
  splash.className = "khz-splash";
  splash.textContent = "KHANZITOS";
  document.body.appendChild(splash);

  setTimeout(() => {
    splash.classList.add("fadeout");
    setTimeout(() => {
      splash.remove();

      const btn = document.createElement("div");
      btn.innerHTML = "≡";
      btn.className = "khz-toggle";
      btn.onclick = function () {
        const p = document.getElementById("khz-panel");
        p.style.display = p.style.display === "none" ? "block" : "none";
      };
      document.body.appendChild(btn);

      const panel = document.createElement("div");
      panel.className = "khz-panel";
      panel.id = "khz-panel";
      panel.style.left = "100px";
      panel.style.top = "100px";
      panel.innerHTML = `
        <div class="khz-header">
          <div class="khz-title">KHANZITOS</div>
          <div>V1.0.0</div>
        </div>
        <button class="khz-button" onclick="console.log('Question Spoof ativado')">Question Spoof</button>
        <button class="khz-button" onclick="console.log('Video Spoof ativado')">Video Spoof</button>
        <button class="khz-button" onclick="console.log('Dark Mode ativado')">Dark Mode</button>
      `;
      document.body.appendChild(panel);

      let dragging = false, offsetX = 0, offsetY = 0;
      panel.addEventListener("mousedown", e => {
        if (e.target.closest("button")) return;
        dragging = true;
        offsetX = e.clientX - panel.offsetLeft;
        offsetY = e.clientY - panel.offsetTop;
        panel.style.cursor = "grabbing";
      });

      document.addEventListener("mousemove", e => {
        if (dragging) {
          panel.style.left = (e.clientX - offsetX) + "px";
          panel.style.top = (e.clientY - offsetY) + "px";
        }
      });

      document.addEventListener("mouseup", () => {
        dragging = false;
        panel.style.cursor = "grab";
      });

    }, 1000);
  }, 2000);
})();

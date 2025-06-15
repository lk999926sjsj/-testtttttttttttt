(function() {
  if (document.getElementById("khz-panel")) return;

  const features = {
    questionSpoof: false,
    videoSpoof: false,
    darkMode: true
  };

  const style = document.createElement("style");
  style.textContent = `
    @keyframes fadeOut { 0% { opacity: 1 } 100% { opacity: 0 } }
    .khz-splash { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: #000; display: flex; justify-content: center; align-items: center; z-index: 999999; color: #800080; font-size: 42px; font-family: sans-serif; font-weight: bold; transition: opacity 1s ease; }
    .khz-splash.fadeout { animation: fadeOut 1s ease forwards; }
    .khz-toggle { position: fixed; bottom: 20px; left: 20px; width: 40px; height: 40px; background: #111; border: 2px solid #800080; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 100000; color: #fff; font-size: 20px; font-weight: bold; box-shadow: 0 0 10px #800080; font-family: sans-serif; transition: 0.3s; }
    .khz-toggle:hover { background: #800080; }
    .khz-panel { position: fixed; top: 100px; left: 100px; width: 280px; background: rgba(0, 0, 0, 0.95); border-radius: 16px; padding: 20px; z-index: 99999; color: #fff; font-family: sans-serif; box-shadow: 0 0 20px rgba(128, 0, 128, 0.6); cursor: grab; display: none; }
    .khz-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .khz-title { font-weight: bold; font-size: 20px; background: linear-gradient(to right, #800080, #000); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .khz-button { display: block; width: 100%; margin: 10px 0; padding: 10px; background: #111; color: white; border: 2px solid #800080; border-radius: 8px; cursor: pointer; font-size: 14px; transition: 0.3s; }
    .khz-button:hover { background: #800080; border-color: #fff; }
    .khz-button.active { background: #800080; border-color: #0f0; box-shadow: 0 0 8px #0f0; }
    body.khz-dark-mode { filter: invert(1) hue-rotate(180deg); background-color: #fff; }
    body.khz-dark-mode img, body.khz-dark-mode video, body.khz-dark-mode .khz-panel, body.khz-dark-mode .khz-toggle { filter: invert(1) hue-rotate(180deg); }
  `;
  document.head.appendChild(style);

  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    let [input, init] = args;
    let requestBody;

    if (features.videoSpoof) {
      if (input instanceof Request) {
        requestBody = await input.clone().text();
      } else if (init && init.body) {
        requestBody = init.body;
      }

      if (requestBody && requestBody.includes('"operationName":"updateUserVideoProgress"')) {
        try {
          let bodyObj = JSON.parse(requestBody);
          if (bodyObj.variables && bodyObj.variables.input) {
            const duration = bodyObj.variables.input.durationSeconds;
            bodyObj.variables.input.secondsWatched = duration;
            bodyObj.variables.input.lastSecondWatched = duration;
            const newBody = JSON.stringify(bodyObj);
            
            if (input instanceof Request) {
                args[0] = new Request(input, { body: newBody, ...init });
            } else {
                if (!args[1]) args[1] = {};
                args[1].body = newBody;
            }
          }
        } catch (e) {}
      }
    }

    const originalResponse = await originalFetch.apply(this, args);

    if (features.questionSpoof && originalResponse.ok) {
        const clonedResponse = originalResponse.clone();
        try {
            if(clonedResponse.url.includes("/graphql/Assessment")){
                let responseObj = JSON.parse(await clonedResponse.text());
                if (responseObj?.data?.assessmentItem?.item?.itemData) {
                    const phrases = ["Questão modificada!", "Isso foi fácil.", "Próximo!", "✅", "Missão cumprida."];
                    let itemData = JSON.parse(responseObj.data.assessmentItem.item.itemData);
                    
                    itemData.question.content = phrases[Math.floor(Math.random() * phrases.length)] + `[[☃ radio 1]]`;
                    itemData.question.widgets = { "radio 1": { type: "radio", options: { choices: [{ content: "Resposta correta.", correct: true }, { content: "Resposta incorreta.", correct: false }] } } };
                    responseObj.data.assessmentItem.item.itemData = JSON.stringify(itemData);
                    
                    return new Response(JSON.stringify(responseObj), { status: 200, statusText: "OK", headers: originalResponse.headers });
                }
            }
        } catch (e) {}
    }

    return originalResponse;
  };

  const splash = document.createElement("div");
  splash.className = "khz-splash";
  splash.textContent = "KHANZITOS";
  document.body.appendChild(splash);

  setTimeout(() => {
    splash.classList.add("fadeout");
    setTimeout(() => {
      splash.remove();
      
      document.body.classList.add('khz-dark-mode');

      const btn = document.createElement("div");
      btn.innerHTML = "≡";
      btn.className = "khz-toggle";
      btn.onclick = () => {
        const p = document.getElementById("khz-panel");
        p.style.display = p.style.display === "none" ? "block" : "none";
      };
      document.body.appendChild(btn);

      const panel = document.createElement("div");
      panel.id = "khz-panel";
      panel.className = "khz-panel";
      panel.innerHTML = `
        <div class="khz-header">
          <div class="khz-title">KHANZITOS</div>
          <div>V3.1</div>
        </div>
        <button id="khz-btn-question" class="khz-button">Question Spoof [OFF]</button>
        <button id="khz-btn-video" class="khz-button">Video Spoof [OFF]</button>
        <button id="khz-btn-dark" class="khz-button active">Dark Mode [ON]</button>
      `;
      document.body.appendChild(panel);
      
      const setupButton = (buttonId, featureName) => {
          const button = document.getElementById(buttonId);
          button.addEventListener('click', () => {
              features[featureName] = !features[featureName];
              const stateText = features[featureName] ? 'ON' : 'OFF';
              button.textContent = `${button.textContent.split('[')[0]}[${stateText}]`;
              button.classList.toggle('active', features[featureName]);
              
              if(featureName === 'darkMode') {
                  document.body.classList.toggle('khz-dark-mode', features.darkMode);
              }
          });
      };
      
      setupButton('khz-btn-question', 'questionSpoof');
      setupButton('khz-btn-video', 'videoSpoof');
      setupButton('khz-btn-dark', 'darkMode');

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

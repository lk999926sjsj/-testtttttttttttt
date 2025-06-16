(function() {
  if (document.getElementById("khz-panel")) return;

  const features = {
    questionSpoof: false,
    videoSpoof: false,
    revealAnswers: false,
    autoAnswer: false,
    darkMode: true
  };

  const config = {
    autoAnswerDelay: 1.5
  };

  function sendToast(message, gravity = "bottom", duration = 3000) {
    Toastify({
      text: message,
      duration: duration,
      gravity: gravity,
      position: "center",
      stopOnFocus: true,
      style: {
        background: "#111",
        border: "1px solid #800080",
        color: "#fff"
      }
    }).showToast();
  }

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const style = document.createElement("style");
  style.textContent = `
    @keyframes fadeOut { 0% { opacity: 1 } 100% { opacity: 0 } }
    .khz-splash { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: #000; display: flex; justify-content: center; align-items: center; z-index: 999999; color: #800080; font-size: 42px; font-family: sans-serif; font-weight: bold; transition: opacity 1s ease; }
    .khz-splash.fadeout { animation: fadeOut 1s ease forwards; }
    .khz-toggle { position: fixed; bottom: 20px; left: 20px; width: 40px; height: 40px; background: #111; border: 2px solid #800080; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 100000; color: #fff; font-size: 20px; font-weight: bold; box-shadow: 0 0 10px #800080; font-family: sans-serif; transition: 0.3s; }
    .khz-toggle:hover { background: #800080; }
    .khz-panel { position: fixed; top: 100px; left: 100px; width: 300px; background: rgba(0, 0, 0, 0.95); border-radius: 16px; padding: 20px; z-index: 99999; color: #fff; font-family: sans-serif; box-shadow: 0 0 20px rgba(128, 0, 128, 0.6); cursor: grab; display: none; }
    .khz-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .khz-title { font-weight: bold; font-size: 20px; color: #800080; }
    .khz-button { display: block; width: 100%; margin: 10px 0; padding: 10px; background: #111; color: white; border: 2px solid #800080; border-radius: 8px; cursor: pointer; font-size: 14px; transition: 0.3s; }
    .khz-button:hover { background: #800080; border-color: #fff; }
    .khz-button.active { background: #800080; border-color: #0f0; box-shadow: 0 0 8px #0f0; }
    .khz-input-group { display: flex; align-items: center; justify-content: space-between; margin-top: 5px; }
    .khz-input-group label { font-size: 12px; color: #ccc; }
    .khz-input-group input { width: 60px; background: #222; color: #fff; border: 1px solid #800080; border-radius: 4px; padding: 4px; text-align: center; }
  `;
  document.head.appendChild(style);

  const originalParse = JSON.parse;
  JSON.parse = function(text, reviver) {
    let data = originalParse(text, reviver);
    if (features.revealAnswers && data?.data) {
      try {
        const dataValues = Object.values(data.data);
        for (const val of dataValues) {
          if (val?.item?.itemData) {
            let itemData = JSON.parse(val.item.itemData);
            if (itemData.question?.widgets) {
              for (const widget of Object.values(itemData.question.widgets)) {
                widget.options?.choices?.forEach(choice => {
                  if (choice.correct) {
                    choice.content = "✅ " + choice.content;
                    sendToast("Respostas reveladas.", "bottom", 1000);
                  }
                });
              }
            }
            val.item.itemData = JSON.stringify(itemData);
          }
        }
      } catch (e) {}
    }
    return data;
  };

  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    let [input, init] = args;

    if (features.videoSpoof) {
      let requestBody, modifiedBody;
      if (input instanceof Request) {
        requestBody = await input.clone().text().catch(() => null);
      } else if (init?.body) {
        requestBody = init.body;
      }
      
      if (requestBody && requestBody.includes('"operationName":"updateUserVideoProgress"')) {
        try {
          let bodyObj = JSON.parse(requestBody);
          if (bodyObj.variables?.input) {
            const duration = bodyObj.variables.input.durationSeconds;
            bodyObj.variables.input.secondsWatched = duration;
            bodyObj.variables.input.lastSecondWatched = duration;
            modifiedBody = JSON.stringify(bodyObj);
          }
          if (modifiedBody) {
            if (input instanceof Request) {
                args[0] = new Request(input, { body: modifiedBody, ...init });
            } else {
                if (!args[1]) args[1] = {};
                args[1].body = modifiedBody;
            }
          }
        } catch (e) {}
      }
    }
    
    const originalResponse = await originalFetch.apply(this, args);

    if (features.questionSpoof && originalResponse.ok) {
        const clonedResponse = originalResponse.clone();
        try {
            let responseObj = await clonedResponse.json();
            if (responseObj?.data?.assessmentItem?.item?.itemData) {
                const phrases = ["Isso foi fácil.", "Próximo!", "✅", "Questão modificada."];
                let itemData = JSON.parse(responseObj.data.assessmentItem.item.itemData);
                
                itemData.question.content = phrases[Math.floor(Math.random() * phrases.length)] + `[[☃ radio 1]]`;
                itemData.question.widgets = { "radio 1": { type: "radio", options: { choices: [{ content: "Resposta correta.", correct: true }, { content: "Resposta incorreta.", correct: false }] } } };
                responseObj.data.assessmentItem.item.itemData = JSON.stringify(itemData);
                
                sendToast("Questão exploitada.", "bottom", 1000);
                return new Response(JSON.stringify(responseObj), { status: 200, statusText: "OK", headers: originalResponse.headers });
            }
        } catch (e) {}
    }

    return originalResponse;
  };

  (async function autoAnswerLoop() {
    while (true) {
        if (features.autoAnswer) {
            const click = (selector) => document.querySelector(selector)?.click();
            click('[data-testid="choice-icon__library-choice-icon"]');
            await delay(100);
            click('[data-testid="exercise-check-answer"]');
            await delay(100);
            click('[data-testid="exercise-next-question"]');
            await delay(100);
            click('._1udzurba');
            click('._awve9b');
            
            const summaryButton = document.querySelector('._1udzurba[data-test-id="end-of-unit-test-next-button"]');
            if (summaryButton?.innerText.toLowerCase().includes("resumo")) {
                sendToast("🎉 Exercício concluído!");
            }
        }
        await delay(config.autoAnswerDelay * 1000);
    }
  })();

  const splash = document.createElement("div");
  splash.className = "khz-splash";
  splash.textContent = "KHANZITOS";
  document.body.appendChild(splash);

  (async function initializeUI() {
    const toastifyScript = document.createElement('script');
    toastifyScript.src = 'https://cdn.jsdelivr.net/npm/toastify-js';
    document.head.appendChild(toastifyScript);

    const darkReaderScript = document.createElement('script');
    darkReaderScript.src = 'https://cdn.jsdelivr.net/npm/darkreader@4.9.92/darkreader.min.js';
    darkReaderScript.onload = () => {
        DarkReader.setFetchMethod(window.fetch);
        if (features.darkMode) {
            DarkReader.enable();
        }
        sendToast("KHANZITOS Ativado!");
    };
    document.head.appendChild(darkReaderScript);

    setTimeout(() => {
      splash.classList.add("fadeout");
      setTimeout(() => {
        splash.remove();

        const toggleBtn = document.createElement("div");
        toggleBtn.innerHTML = "≡";
        toggleBtn.className = "khz-toggle";
        toggleBtn.onclick = () => {
          const p = document.getElementById("khz-panel");
          p.style.display = p.style.display === "none" ? "block" : "none";
        };
        document.body.appendChild(toggleBtn);
        
        const panel = document.createElement("div");
        panel.id = "khz-panel";
        panel.className = "khz-panel";
        panel.innerHTML = `
          <div class="khz-header">
            <div class="khz-title">KHANZITOS</div>
            <div>V1.0</div>
          </div>
          <button id="khz-btn-question" class="khz-button">Question Spoof [OFF]</button>
          <button id="khz-btn-video" class="khz-button">Video Spoof [OFF]</button>
          <button id="khz-btn-reveal" class="khz-button">Reveal Answers [OFF]</button>
          <button id="khz-btn-auto" class="khz-button">Auto Answer [OFF]</button>
          <div class="khz-input-group">
            <label for="khz-input-speed">Velocidade (s):</label>
            <input type="number" id="khz-input-speed" value="${config.autoAnswerDelay}" step="0.1" min="0.2">
          </div>
          <button id="khz-btn-dark" class="khz-button active">Dark Mode [ON]</button>
        `;
        document.body.appendChild(panel);

        const speedInput = document.getElementById('khz-input-speed');
        speedInput.addEventListener('input', () => {
            const newDelay = parseFloat(speedInput.value);
            if (newDelay >= 0.2) {
                config.autoAnswerDelay = newDelay;
            }
        });

        const setupButton = (buttonId, featureName, buttonText) => {
            const button = document.getElementById(buttonId);
            button.addEventListener('click', () => {
                if (featureName === 'darkMode') {
                    if (features.darkMode) {
                        DarkReader.disable();
                        features.darkMode = false;
                    } else {
                        DarkReader.enable();
                        features.darkMode = true;
                    }
                } else {
                    features[featureName] = !features[featureName];
                }
                
                const stateText = features[featureName] ? 'ON' : 'OFF';
                button.textContent = `${buttonText} [${stateText}]`;
                button.classList.toggle('active', features[featureName]);
            });
        };
        
        setupButton('khz-btn-question', 'questionSpoof', 'Question Spoof');
        setupButton('khz-btn-video', 'videoSpoof', 'Video Spoof');
        setupButton('khz-btn-reveal', 'revealAnswers', 'Reveal Answers');
        setupButton('khz-btn-auto', 'autoAnswer', 'Auto Answer');
        setupButton('khz-btn-dark', 'darkMode', 'Dark Mode');

        let dragging = false, offsetX = 0, offsetY = 0;
        panel.addEventListener("mousedown", e => {
          if (e.target.closest("button") || e.target.closest("input")) return;
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

})();

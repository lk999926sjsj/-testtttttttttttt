(function() {
  if (document.getElementById("lkxz.7-panel")) return;

  const features = {
    questionSpoof: false,
    videoSpoof: false,
    revealAnswers: false,
    autoAnswer: false,
    darkMode: true,
    rgbLogo: false,
    oneko: false
  };

  const config = {
    autoAnswerDelay: 1.5
  };

function sendToast(message, duration = 4000) {
  const toast = document.createElement("div");
  toast.className = "lkxz.7-toast";
  toast.innerHTML = `
    <div class="lkxz.7-toast-message">${message}</div>
    <div class="lkxz.7-toast-progress"></div>
  `;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("hide");
    setTimeout(() => toast.remove(), 500);
  }, duration);
}

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const style = document.createElement("style");
  style.textContent = `
    @keyframes fadeOut { 0% { opacity: 1 } 100% { opacity: 0 } }
    .lkxz.7-splash { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: #000; display: flex; justify-content: center; align-items: center; z-index: 999999; color: #FFFFFF; font-size: 42px; font-family: sans-serif; font-weight: bold; transition: opacity 1s ease; }
    .lkxz.7-splash.fadeout { animation: fadeOut 1s ease forwards; }
    .lkxz.7-toggle { position: fixed; bottom: 20px; left: 20px; width: 40px; height: 40px; background: #111; border: 2px solid #FFFFFF; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 100000; color: #fff; font-size: 20px; font-weight: bold; box-shadow: 0 0 10px #FFFFFF; font-family: sans-serif; transition: 0.3s; }
    .lkxz.7-toggle:hover { background: #FFFFFF; }
    .lkxz.7-panel { position: fixed; top: 100px; left: 100px; width: 300px; background: rgba(0, 0, 0, 0.95); border-radius: 16px; padding: 20px; z-index: 99999; color: #fff; font-family: sans-serif; box-shadow: 0 0 20px rgba(255, 255, 255, 0.6); cursor: grab; display: none; }
    .lkxz.7-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .lkxz.7-title { font-weight: bold; font-size: 20px; color: #FFFFFF; }
    .lkxz.7-button { display: block; width: 100%; margin: 10px 0; padding: 10px; background: #111; color: white; border: 2px solid #FFFFFF; border-radius: 8px; cursor: pointer; font-size: 14px; transition: 0.3s; }
    .lkxz.7-button:hover { background: #FFFFFF; border-color: #fff; }
    .lkxz.7-button.active{background:#FFFFFF;border-color:#FFFFFF;box-shadow:0 0 8px #FFFFFF;}
    .lkxz.7-input-group { display: flex; align-items: center; justify-content: space-between; margin-top: 5px; }
    .lkxz.7-input-group label { font-size: 12px; color: #ccc; }
    .lkxz.7-input-group input { width: 60px; background: #222; color: #fff; border: 1px solid #FFFFFF; border-radius: 4px; padding: 4px; text-align: center; }
    .lkxz.7-toast{position:fixed;bottom:20px;right:20px;background:#111;color:#fff;border:1px solid #FFFFFF;border-radius:8px;padding:12px 16px;margin-top:10px;box-shadow:0 0 10px #FFFFFF;font-size:14px;font-family:sans-serif;z-index:999999;animation:fadeIn 0.3s ease-out;overflow:hidden;width:fit-content;max-width:300px}.lkxz.7-toast.hide{animation:fadeOut 0.5s ease forwards}.lkxz.7-toast-progress{position:absolute;left:0;bottom:0;height:4px;background:#FFFFFF;animation:toastProgress linear forwards;animation-duration:4s;width:100%}.lkxz.7-toast-message{position:relative;z-index:1}@keyframes toastProgress{from{width:100%}to{width:0%}}@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}@keyframes fadeOut{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(10px)}
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
                    sendToast("Questão exploitada.");

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
                const phrases = ["lkxz.7 e ", "lkxz.7", "✅", "manda a proxima."];
                let itemData = JSON.parse(responseObj.data.assessmentItem.item.itemData);
                
                itemData.question.content = phrases[Math.floor(Math.random() * phrases.length)] + `[[☃ radio 1]]`;
                itemData.question.widgets = { "radio 1": { type: "radio", options: { choices: [{ content: "✅", correct: true }, { content: "❌", correct: false }] } } };
                responseObj.data.assessmentItem.item.itemData = JSON.stringify(itemData);
                
                sendToast("Questão exploitada.");
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
  splash.className = "lkxz.7-splash";
  splash.textContent = "aprimored by lkxz.7";
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
        sendToast("lkxz.7 Ativado!");
    };
    document.head.appendChild(darkReaderScript);

    function loadScript(src, id) {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) return resolve();
    const script = document.createElement('script');
    script.src = src;
    script.id = id;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

    setTimeout(() => {
      splash.classList.add("fadeout");
      setTimeout(() => {
        splash.remove();

        const toggleBtn = document.createElement("div");
        toggleBtn.innerHTML = "≡";
        toggleBtn.className = "lkxz.7-toggle";
        toggleBtn.onclick = () => {
          const p = document.getElementById("lkxz.7-panel");
          p.style.display = p.style.display === "none" ? "block" : "none";
        };
        document.body.appendChild(toggleBtn);
        
        const panel = document.createElement("div");
        panel.id = "lkxz.7-panel";
        panel.className = "lkxz.7-panel";
        panel.innerHTML = `
          <div class="lkxz.7-header">
            <div class="lkxz.7-title">lkxz.7</div>
            <div>V1.0</div>
          </div>
          <button id="lkxz.7-btn-question" class="lkxz.7-button">Question Spoof [OFF]</button>
          <button id="lkxz.7-btn-video" class="lkxz.7-button">Video Spoof [OFF]</button>
          <button id="lkxz.7-btn-reveal" class="lkxz.7-button">Reveal Answers [OFF]</button>
          <button id="lkxz.7-btn-auto" class="lkxz.7-button">Auto Answer [OFF]</button>
          <div class="lkxz.7-input-group">
            <label for="lkxz.7-input-speed">Velocidade (s):</label>
            <input type="number" id="lkxz.7-input-speed" value="${config.autoAnswerDelay}" step="0.1" min="0.2">
          </div>
          <button id="lkxz.7-btn-dark" class="lkxz.7-button active">Dark Mode [ON]</button>
          <button id="lkxz.7-btn-rgb" class="lkxz.7-button">RGB Logo [OFF]</button>
          <button id="lkxz.7-btn-oneko" class="lkxz.7-button">OnekoJS [OFF]</button>
        `;
        document.body.appendChild(panel);

        const speedInput = document.getElementById('lkxz.7-input-speed');
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
        
        setupButton('lkxz.7-btn-question', 'questionSpoof', 'Question Spoof');
        setupButton('lkxz.7-btn-video', 'videoSpoof', 'Video Spoof');
        setupButton('lkxz.7-btn-reveal', 'revealAnswers', 'Reveal Answers');
        setupButton('lkxz.7-btn-auto', 'autoAnswer', 'Auto Answer');
        setupButton('lkxz.7-btn-dark', 'darkMode', 'Dark Mode');
        document.getElementById("lkxz.7-btn-rgb").addEventListener("click", toggleRgbLogo);
        features.oneko = false;
        document.getElementById("lkxz.7-btn-oneko").addEventListener("click", toggleOnekoJs);

function toggleRgbLogo() {
  const khanLogo = document.querySelector('path[fill="#14bf96"]');
  const existingStyle = document.querySelector('style.RGBLogo');

  if (!khanLogo) {
    sendToast("❌ Logo do Khan Academy não encontrado.");
    return;
  }

  if (features.rgbLogo) {
    if (existingStyle) existingStyle.remove();
    khanLogo.style.filter = '';
    features.rgbLogo = false;
    sendToast("🎨 RGB Logo desativado.");
  } else {
    const styleElement = document.createElement('style');
    styleElement.className = "RGBLogo";
    styleElement.textContent = `
      @keyframes hueShift {
        0% { filter: hue-rotate(0deg); }
        100% { filter: hue-rotate(360deg); }
      }
      .force-rgb-logo {
        animation: hueShift 5s infinite linear !important;
      }
    `;
    document.head.appendChild(styleElement);

    khanLogo.classList.add("force-rgb-logo");
    features.rgbLogo = true;
    sendToast("🌈 RGB Logo ativado!");
  }

  const rgbBtn = document.getElementById("lkxz.7-btn-rgb");
  const stateText = features.rgbLogo ? "ON" : "OFF";
  rgbBtn.textContent = `RGB Logo [${stateText}]`;
  rgbBtn.classList.toggle("active", features.rgbLogo);
}

function toggleOnekoJs() {
  const onekoBtn = document.getElementById("lkxz.7-btn-oneko");

  if (features.oneko) {
    const el = document.getElementById("oneko");
    if (el) el.remove();
    features.oneko = false;
    onekoBtn.textContent = "OnekoJS [OFF]";
    onekoBtn.classList.remove("active");
    sendToast("🐾 Oneko desativado.");
  } else {
loadScript('https://cdn.jsdelivr.net/gh/adryd325/oneko.js/oneko.js', 'onekoJs').then(() => {
  if (typeof oneko === "function") {
    oneko(); // <- inicia o gato!
    setTimeout(() => {
      const onekoEl = document.getElementById('oneko');
      if (onekoEl) {
        onekoEl.style.backgroundImage = "url('https://raw.githubusercontent.com/adryd325/oneko.js/main/oneko.gif')";
        onekoEl.style.display = "block";
        features.oneko = true;
        onekoBtn.textContent = "OnekoJS [ON]";
        onekoBtn.classList.add("active");
        sendToast("🐱 Oneko ativado!");
      } else {
        sendToast("⚠️ Oneko iniciou, mas não foi encontrado.");
      }
    }, 500);
  } else {
    sendToast("❌ oneko() não está disponível.");
  }
});
  }
}


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

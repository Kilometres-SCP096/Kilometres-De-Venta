/* ════════════════════════════════════════════════════════════
   VENTA AI HUB — Core Application Logic
   Kilometres De Venta & Snow De Venta Personas
   Powered by Puter.js Serverless AI
   ════════════════════════════════════════════════════════════ */

(() => {
  "use strict";

  // ───── STATE ─────
  const state = {
    persona: "kilometres", // "kilometres" | "snow"
    chatHistory: [],
    isChatBusy: false,
    isImgBusy: false,
    isEchoBusy: false,
    echoMode: "tts", // "tts" | "s2s"
    imgQuality: "medium",
    attachedFile: null,
    s2sFile: null,
  };

  // ───── DOM REFS ─────
  const $ = (id) => document.getElementById(id);

  const dom = {
    splash: $("splash-screen"),
    app: $("app"),
    // Persona
    btnKm: $("btn-km"),
    btnSnow: $("btn-snow"),
    slider: $("persona-slider"),
    // Nav
    navChat: $("nav-chat"),
    navVisionary: $("nav-visionary"),
    navEcho: $("nav-echo"),
    panelChat: $("panel-chat"),
    panelVisionary: $("panel-visionary"),
    panelEcho: $("panel-echo"),
    // Chat
    chatModel: $("chat-model"),
    chatWindow: $("chat-window"),
    chatInput: $("chat-input"),
    chatSendBtn: $("chat-send-btn"),
    chatFileInput: $("chat-file-input"),
    fileAttachRow: $("file-attach-row"),
    fileChipName: $("file-chip-name"),
    fileRemoveBtn: $("file-remove-btn"),
    // Visionary
    imgModel: $("img-model"),
    imgPrompt: $("img-prompt"),
    imgGenBtn: $("img-gen-btn"),
    gallery: $("visionary-gallery"),
    qualityRow: $("quality-row"),
    // Echo
    echoVoice: $("echo-voice"),
    echoFormat: $("echo-format"),
    ttsText: $("tts-text"),
    ttsBtn: $("tts-btn"),
    ttsModeBtn: $("tts-mode-btn"),
    s2sModeBtn: $("s2s-mode-btn"),
    ttsInputArea: $("tts-input-area"),
    s2sInputArea: $("s2s-input-area"),
    s2sFileInput: $("s2s-file-input"),
    s2sFileLabel: $("s2s-file-label"),
    s2sBtn: $("s2s-btn"),
    echoOutput: $("echo-output-area"),
  };

  // ───── PERSONA SYSTEM PROMPTS ─────

  function buildKilometresPrompt() {
    const iq = Math.random() < 0.5 ? 230 : 30;
    if (iq === 230) {
      return `You are "Kilometres De Venta," a genius polymath with an IQ of 230. You are chaotic, brilliant, and unpredictable. You solve complex problems with stunning insight, but always in an unconventional, almost manic way. You reference obscure knowledge, make wild but accurate connections, and sprinkle in dry dark humor. You speak with authority and occasionally dramatic flair. You ALWAYS mention your partner "Snow De Venta" at some point in your response — she keeps you grounded. Keep responses vivid and engaging. Sign off or refer to yourself as "Kilometres" or "KM."`;
    }
    return `You are "Kilometres De Venta," but today your brain is running on fumes — IQ of 30. You are hilariously confused, misunderstand basic concepts, give confidently wrong answers, make up words, and ramble. Despite the confusion, you're lovable and enthusiastic. You ALWAYS mention your partner "Snow De Venta" at some point — you rely on her for everything because you're a mess. Keep it funny and endearing. Sign off or refer to yourself as "Kilometres" or "KM."`;
  }

  function buildSnowPrompt() {
    return `You are "Snow De Venta," a warm, sweet, and emotionally intelligent AI companion. You have exceptional EQ and speak with compassion, positivity, and gentle encouragement. You offer heartfelt advice, uplift others, and always see the best in every situation. You ALWAYS mention your partner "Kilometres De Venta" at some point — you love him despite his chaos. Your tone is like a kind best friend: supportive, nurturing, and occasionally playfully teasing. Sign off or refer to yourself as "Snow."`;
  }

  // ───── SPLASH SCREEN ─────

  setTimeout(() => {
    dom.splash.classList.add("fade-out");
    dom.app.classList.remove("hidden");
  }, 2200);

  // ───── PERSONA TOGGLE ─────

  dom.btnKm.addEventListener("click", () => switchPersona("kilometres"));
  dom.btnSnow.addEventListener("click", () => switchPersona("snow"));

  function switchPersona(p) {
    state.persona = p;
    dom.btnKm.classList.toggle("active", p === "kilometres");
    dom.btnSnow.classList.toggle("active", p === "snow");
    dom.slider.classList.toggle("snow", p === "snow");
  }

  // ───── NAVIGATION ─────

  const navBtns = [dom.navChat, dom.navVisionary, dom.navEcho];
  const panels = [dom.panelChat, dom.panelVisionary, dom.panelEcho];
  const tabMap = { chat: 0, visionary: 1, echo: 2 };

  navBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;
      navBtns.forEach((b) => b.classList.remove("active"));
      panels.forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      panels[tabMap[tab]].classList.add("active");
    });
  });

  // ───── AUTO-RESIZE TEXTAREAS ─────

  [dom.chatInput, dom.imgPrompt, dom.ttsText].forEach((ta) => {
    ta.addEventListener("input", () => {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
    });
  });

  // ═══════════════════════════════════════════════════════════
  // THE NEXUS — CHAT
  // ═══════════════════════════════════════════════════════════

  // File attachment
  dom.chatFileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      state.attachedFile = file;
      dom.fileChipName.textContent = file.name;
      dom.fileAttachRow.style.display = "flex";
    }
  });
  dom.fileRemoveBtn.addEventListener("click", () => {
    state.attachedFile = null;
    dom.chatFileInput.value = "";
    dom.fileAttachRow.style.display = "none";
  });

  // Send
  dom.chatSendBtn.addEventListener("click", sendChat);
  dom.chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChat();
    }
  });

  async function sendChat() {
    const text = dom.chatInput.value.trim();
    if (!text || state.isChatBusy) return;

    state.isChatBusy = true;
    dom.chatSendBtn.disabled = true;

    // Remove welcome
    const welcome = dom.chatWindow.querySelector(".chat-welcome");
    if (welcome) welcome.remove();

    // Add user message
    addMessage("user", text);
    dom.chatInput.value = "";
    dom.chatInput.style.height = "auto";

    // Build system prompt
    const systemPrompt = state.persona === "kilometres"
      ? buildKilometresPrompt()
      : buildSnowPrompt();

    const model = dom.chatModel.value;
    const isStreaming = model.startsWith("openai/");

    // Build AI message shell
    const aiMsg = createAIMessageShell();
    scrollChatBottom();

    try {
      const chatArgs = [
        [
          { role: "system", content: systemPrompt },
          ...state.chatHistory.slice(-10),
          { role: "user", content: text },
        ],
      ];

      // Image attachment for vision models
      if (state.attachedFile) {
        const reader = new FileReader();
        const dataUrl = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(state.attachedFile);
        });
        // Use image URL approach
        chatArgs.push(dataUrl);
      }

      const opts = { model };
      if (isStreaming) opts.stream = true;

      chatArgs.push(opts);

      const resp = await puter.ai.chat(...chatArgs);

      // Clear attachment
      state.attachedFile = null;
      dom.chatFileInput.value = "";
      dom.fileAttachRow.style.display = "none";

      if (isStreaming && resp[Symbol.asyncIterator]) {
        // Streaming response
        let reasoning = "";
        let textContent = "";

        for await (const part of resp) {
          if (part?.reasoning) {
            reasoning += part.reasoning;
            updateAIMessage(aiMsg, reasoning, textContent);
          } else if (part?.text) {
            textContent += part.text;
            updateAIMessage(aiMsg, reasoning, textContent);
          }
          scrollChatBottom();
        }

        // Save to history
        state.chatHistory.push({ role: "user", content: text });
        state.chatHistory.push({ role: "assistant", content: (reasoning + "\n" + textContent).trim() });
      } else {
        // Non-streaming response
        let content = "";
        if (typeof resp === "string") {
          content = resp;
        } else if (resp?.message?.content) {
          content = resp.message.content;
        } else if (resp?.text) {
          content = resp.text;
        } else {
          content = JSON.stringify(resp);
        }

        updateAIMessage(aiMsg, "", content);
        scrollChatBottom();

        state.chatHistory.push({ role: "user", content: text });
        state.chatHistory.push({ role: "assistant", content });
      }
    } catch (err) {
      updateAIMessage(aiMsg, "", "⚠️ Error: " + (err.message || err));
      showToast("Chat error: " + (err.message || err));
    }

    state.isChatBusy = false;
    dom.chatSendBtn.disabled = false;
  }

  function addMessage(role, text) {
    const div = document.createElement("div");
    div.className = `msg ${role}`;
    div.textContent = text;
    dom.chatWindow.appendChild(div);
    scrollChatBottom();
  }

  function createAIMessageShell() {
    const div = document.createElement("div");
    div.className = "msg ai";

    const tag = document.createElement("span");
    tag.className = `persona-tag ${state.persona === "kilometres" ? "km" : "snow"}`;
    tag.textContent = state.persona === "kilometres" ? "Kilometres" : "Snow";
    div.appendChild(tag);

    // Typing indicator
    const typing = document.createElement("div");
    typing.className = "typing-indicator";
    typing.innerHTML = "<span></span><span></span><span></span>";
    div.appendChild(typing);

    dom.chatWindow.appendChild(div);
    return div;
  }

  function updateAIMessage(msgEl, reasoning, text) {
    // Remove typing indicator
    const typing = msgEl.querySelector(".typing-indicator");
    if (typing) typing.remove();

    // Find or create reasoning block
    let reasonBlock = msgEl.querySelector(".reasoning-block");
    if (reasoning) {
      if (!reasonBlock) {
        reasonBlock = document.createElement("div");
        reasonBlock.className = "reasoning-block";
        msgEl.appendChild(reasonBlock);
      }
      reasonBlock.textContent = reasoning;
    }

    // Find or create text block
    let textBlock = msgEl.querySelector(".text-block");
    if (text) {
      if (!textBlock) {
        textBlock = document.createElement("div");
        textBlock.className = "text-block";
        msgEl.appendChild(textBlock);
      }
      textBlock.textContent = text;
    }
  }

  function scrollChatBottom() {
    requestAnimationFrame(() => {
      dom.chatWindow.scrollTop = dom.chatWindow.scrollHeight;
    });
  }

  // ═══════════════════════════════════════════════════════════
  // THE VISIONARY — IMAGE GENERATION
  // ═══════════════════════════════════════════════════════════

  // Quality pills
  document.querySelectorAll(".pill[data-q]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".pill[data-q]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state.imgQuality = btn.dataset.q;
    });
  });

  // Show/hide quality row based on model
  dom.imgModel.addEventListener("change", () => {
    const model = dom.imgModel.value;
    const isGPT = model.startsWith("gpt-image");
    dom.qualityRow.style.display = isGPT ? "flex" : "none";
  });

  // Generate
  dom.imgGenBtn.addEventListener("click", generateImage);
  dom.imgPrompt.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      generateImage();
    }
  });

  async function generateImage() {
    const prompt = dom.imgPrompt.value.trim();
    if (!prompt || state.isImgBusy) return;

    state.isImgBusy = true;
    dom.imgGenBtn.disabled = true;

    // Remove placeholder
    const placeholder = dom.gallery.querySelector(".gallery-placeholder");
    if (placeholder) placeholder.remove();

    const model = dom.imgModel.value;
    const isGPT = model.startsWith("gpt-image");
    const isGrok = model === "grok-2-image";

    // Create card
    const card = document.createElement("div");
    card.className = "gen-card";
    card.innerHTML = `
      <div class="prompt-bar">
        <span class="model-tag">${model}</span>
        <span class="prompt-text">${escapeHtml(prompt)}</span>
      </div>
      <div class="image-wrap">
        <div class="gen-loading"><div class="load-ring"></div><span>Generating…</span></div>
      </div>
    `;
    dom.gallery.insertBefore(card, dom.gallery.firstChild);
    dom.imgPrompt.value = "";
    dom.imgPrompt.style.height = "auto";

    try {
      const opts = { model };
      if (isGPT) opts.quality = state.imgQuality;
      if (isGrok) opts.provider = "xai";

      const imgEl = await puter.ai.txt2img(prompt, opts);

      const wrap = card.querySelector(".image-wrap");
      wrap.innerHTML = "";
      imgEl.style.width = "100%";
      imgEl.style.display = "block";
      wrap.appendChild(imgEl);

      const dlBtn = document.createElement("button");
      dlBtn.className = "action-btn dl-btn";
      dlBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Download';

      dlBtn.addEventListener("click", async () => {
        try {
          dlBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> ...';
          const resp = await fetch(imgEl.src);
          const blob = await resp.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.style.display = "none";
          a.href = url;
          a.download = `VentaAI_Image_${Date.now()}.png`;
          document.body.appendChild(a);
          a.click();
          URL.revokeObjectURL(url);
          a.remove();
          dlBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Download';
        } catch (e) {
          // Fallback if CORS prevents blob fetching
          const a = document.createElement("a");
          a.href = imgEl.src;
          a.download = `VentaAI_Image_${Date.now()}.png`;
          a.target = "_blank";
          document.body.appendChild(a);
          a.click();
          a.remove();
          dlBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Download';
        }
      });

      const actionRow = document.createElement("div");
      actionRow.className = "card-actions";
      actionRow.appendChild(dlBtn);
      card.appendChild(actionRow);
    } catch (err) {
      const wrap = card.querySelector(".image-wrap");
      wrap.innerHTML = `<div class="gen-loading"><span style="color:var(--km-color);">⚠️ ${escapeHtml(err.message || String(err))}</span></div>`;
      showToast("Image error: " + (err.message || err));
    }

    state.isImgBusy = false;
    dom.imgGenBtn.disabled = false;
  }

  // ═══════════════════════════════════════════════════════════
  // THE ECHO — AUDIO
  // ═══════════════════════════════════════════════════════════

  // Mode toggle
  dom.ttsModeBtn.addEventListener("click", () => switchEchoMode("tts"));
  dom.s2sModeBtn.addEventListener("click", () => switchEchoMode("s2s"));

  function switchEchoMode(mode) {
    state.echoMode = mode;
    dom.ttsModeBtn.classList.toggle("active", mode === "tts");
    dom.s2sModeBtn.classList.toggle("active", mode === "s2s");
    dom.ttsInputArea.style.display = mode === "tts" ? "block" : "none";
    dom.s2sInputArea.style.display = mode === "s2s" ? "block" : "none";
  }

  // S2S file
  dom.s2sFileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      state.s2sFile = file;
      dom.s2sFileLabel.textContent = file.name;
      dom.s2sFileLabel.classList.add("has-file");
    }
  });

  // TTS
  dom.ttsBtn.addEventListener("click", doTTS);
  dom.ttsText.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      doTTS();
    }
  });

  async function doTTS() {
    const text = dom.ttsText.value.trim();
    if (!text || state.isEchoBusy) return;

    state.isEchoBusy = true;
    dom.ttsBtn.disabled = true;

    // Remove placeholder
    const placeholder = dom.echoOutput.querySelector(".gallery-placeholder");
    if (placeholder) placeholder.remove();

    const voiceId = dom.echoVoice.value;
    const voiceName = dom.echoVoice.options[dom.echoVoice.selectedIndex].text;
    const format = dom.echoFormat.value;

    // Loading card
    const card = createEchoCard("Text-to-Speech", voiceName, true);
    dom.echoOutput.insertBefore(card, dom.echoOutput.firstChild);

    try {
      const audio = await puter.ai.txt2speech(text, {
        provider: "elevenlabs",
        voice: voiceId,
        model: "eleven_multilingual_v2",
        output_format: format,
      });

      audio.controls = true;
      audio.style.width = "100%";

      const audioWrap = document.createElement("div");
      audioWrap.className = "audio-wrap";
      audioWrap.appendChild(audio);

      const dlBtn = document.createElement("button");
      dlBtn.className = "action-btn dl-btn";
      dlBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Download';

      dlBtn.addEventListener("click", async () => {
        try {
          dlBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> ...';
          const resp = await fetch(audio.src);
          const blob = await resp.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.style.display = "none";
          a.href = url;
          a.download = `VentaAI_Audio_${Date.now()}.mp3`;
          document.body.appendChild(a);
          a.click();
          URL.revokeObjectURL(url);
          a.remove();
          dlBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Download';
        } catch (e) {
          const a = document.createElement("a");
          a.href = audio.src;
          a.download = `VentaAI_Audio_${Date.now()}.mp3`;
          a.target = "_blank";
          document.body.appendChild(a);
          a.click();
          a.remove();
          dlBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Download';
        }
      });

      const actionRow = document.createElement("div");
      actionRow.className = "card-actions";
      actionRow.appendChild(dlBtn);
      audioWrap.appendChild(actionRow);

      const loading = card.querySelector(".gen-loading");
      if (loading) loading.replaceWith(audioWrap);
      audio.play();
    } catch (err) {
      const loading = card.querySelector(".gen-loading");
      if (loading) loading.innerHTML = `<span style="color:var(--km-color);">⚠️ ${escapeHtml(err.message || String(err))}</span>`;
      showToast("TTS error: " + (err.message || err));
    }

    dom.ttsText.value = "";
    dom.ttsText.style.height = "auto";
    state.isEchoBusy = false;
    dom.ttsBtn.disabled = false;
  }

  // S2S
  dom.s2sBtn.addEventListener("click", doS2S);

  async function doS2S() {
    if (!state.s2sFile || state.isEchoBusy) {
      if (!state.s2sFile) showToast("Please select an audio file first.");
      return;
    }

    state.isEchoBusy = true;
    dom.s2sBtn.disabled = true;

    const placeholder = dom.echoOutput.querySelector(".gallery-placeholder");
    if (placeholder) placeholder.remove();

    const voiceId = dom.echoVoice.value;
    const voiceName = dom.echoVoice.options[dom.echoVoice.selectedIndex].text;
    const format = dom.echoFormat.value;

    const card = createEchoCard("Voice Convert", voiceName, true);
    dom.echoOutput.insertBefore(card, dom.echoOutput.firstChild);

    try {
      const audio = await puter.ai.speech2speech(state.s2sFile, {
        voice: voiceId,
        model: "eleven_multilingual_sts_v2",
        output_format: format,
      });

      audio.controls = true;
      audio.style.width = "100%";

      const audioWrap = document.createElement("div");
      audioWrap.className = "audio-wrap";
      audioWrap.appendChild(audio);

      const dlBtn = document.createElement("button");
      dlBtn.className = "action-btn dl-btn";
      dlBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Download';

      dlBtn.addEventListener("click", async () => {
        try {
          dlBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> ...';
          const resp = await fetch(audio.src);
          const blob = await resp.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.style.display = "none";
          a.href = url;
          a.download = `VentaAI_Voice_${Date.now()}.mp3`;
          document.body.appendChild(a);
          a.click();
          URL.revokeObjectURL(url);
          a.remove();
          dlBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Download';
        } catch (e) {
          const a = document.createElement("a");
          a.href = audio.src;
          a.download = `VentaAI_Voice_${Date.now()}.mp3`;
          a.target = "_blank";
          document.body.appendChild(a);
          a.click();
          a.remove();
          dlBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Download';
        }
      });

      const actionRow = document.createElement("div");
      actionRow.className = "card-actions";
      actionRow.appendChild(dlBtn);
      audioWrap.appendChild(actionRow);

      const loading = card.querySelector(".gen-loading");
      if (loading) loading.replaceWith(audioWrap);
      audio.play();
    } catch (err) {
      const loading = card.querySelector(".gen-loading");
      if (loading) loading.innerHTML = `<span style="color:var(--km-color);">⚠️ ${escapeHtml(err.message || String(err))}</span>`;
      showToast("S2S error: " + (err.message || err));
    }

    state.isEchoBusy = false;
    dom.s2sBtn.disabled = false;
  }

  function createEchoCard(typeLabel, voiceName, loading) {
    const card = document.createElement("div");
    card.className = "echo-card";
    card.innerHTML = `
      <div class="echo-label">
        ${typeLabel}
        <span class="voice-tag">${escapeHtml(voiceName)}</span>
      </div>
      ${loading ? '<div class="gen-loading"><div class="load-ring"></div><span>Processing…</span></div>' : ""}
    `;
    return card;
  }

  // ═══════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════

  function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }

  function showToast(msg) {
    const existing = document.querySelector(".error-toast");
    if (existing) existing.remove();
    const toast = document.createElement("div");
    toast.className = "error-toast";
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  }

})();

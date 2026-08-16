(() => {
  "use strict";

  const experience = document.querySelector("#experience");
  const scenes = [...document.querySelectorAll(".scene")];
  const enterRoute = document.querySelector("#enterRoute");
  const returnToMap = document.querySelector("#returnToMap");
  const investigate = document.querySelector("#investigate");
  const positionNumber = document.querySelector("#positionNumber");
  const sceneName = document.querySelector("#sceneName");
  const audioToggle = document.querySelector("#audioToggle");
  const iconUnmute = document.querySelector(".icon-unmute");
  const iconMute = document.querySelector(".icon-mute");

  // Cinematic audio track
  const bgm = new Audio("assets/audio/bgm_investigation_loop.mp3");
  bgm.loop = true;
  bgm.volume = 0;
  let audioEnabled = false;
  let hasStartedAudio = false;

  const labels = [
    "Spojrzenie z góry",
    "Zejście w mrok",
    "Początek traktu",
    "Światło w ciemności",
    "Serce ulicy",
    "Przesmyk",
    "Plac przed archiwum",
    "U bramy archiwum"
  ];

  // 7 segments defining the transitions between the 8 frames.
  // Each segment drives scale (zoom) and translation to create a seamless optical flow.
  const segments = [
    { originX: 50, originY: 85, scale: 1.18, tx: 0, ty: 8 },  // 1->2 (Zejście kamery)
    { originX: 50, originY: 60, scale: 1.15, tx: 0, ty: 2 },  // 2->3
    { originX: 53, originY: 55, scale: 1.15, tx: 2, ty: 0 },  // 3->4
    { originX: 47, originY: 55, scale: 1.15, tx: -2, ty: 0 }, // 4->5
    { originX: 52, originY: 52, scale: 1.12, tx: 1, ty: 0 },  // 5->6
    { originX: 50, originY: 50, scale: 1.12, tx: -1, ty: 0 }, // 6->7
    { originX: 50, originY: 50, scale: 1.08, tx: 0, ty: 0 }   // 7->8 (Zwolnienie)
  ];

  const keys = new Set();
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const motionScale = reducedMotion ? .18 : 1;
  
  let phase = "overview";
  let walkProgress = 0;
  let velocity = 0;
  let descentStarted = 0;
  let returnStarted = 0;
  let returnFrom = 0;
  let endPhaseStart = null;
  let pointerLastY = null;
  let pointerTravel = 0;
  let lastFrame = performance.now();
  let lastInput = performance.now();

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const smooth = (value) => value * value * (3 - 2 * value);
  const easeInOut = (value) => value < .5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;

  function beginWalk() {
    if (phase !== "overview") return;
    experience.scrollTop = 0;
    phase = "descent";
    descentStarted = performance.now();
    velocity = 0;
    experience.classList.remove("is-overview", "is-walking");
    experience.classList.add("is-descent");
  }

  function returnToOverview() {
    if (phase === "overview") return;
    phase = "returning";
    returnStarted = performance.now();
    returnFrom = walkProgress;
    velocity = 0;
    experience.classList.remove("is-walking", "is-descent");
    investigate.classList.remove("is-visible");
    endPhaseStart = null;
  }

  function activateControl() {
    phase = "walking";
    walkProgress = 1 / 7; // Starts slightly into the walk
    velocity = 0;
    lastInput = performance.now();
    experience.classList.remove("is-descent", "is-overview");
    experience.classList.add("is-walking");
  }

  function registerInput() {
    lastInput = performance.now();
    experience.classList.remove("instructions-dim");
  }

  function updateHud(frameIndex) {
    const number = String(frameIndex + 1).padStart(2, "0");
    if (positionNumber) positionNumber.textContent = number;
    if (sceneName) sceneName.textContent = labels[frameIndex];

    if (audioEnabled) {
      let targetVol = 0.3;
      if (walkProgress > 0.3 && walkProgress <= 0.7) {
        targetVol = 0.3 + (walkProgress - 0.3) * (0.4 / 0.4);
      } else if (walkProgress > 0.7) {
        targetVol = 0.7 + (walkProgress - 0.7) * (0.3 / 0.3);
      }
      bgm.volume = targetVol * 0.7; // Max 0.7 to keep it atmospheric
    }
  }

  function render(now) {
    const dt = Math.min(.04, (now - lastFrame) / 1000);
    lastFrame = now;

    if (phase === "descent") {
      const t = clamp((now - descentStarted) / 4300, 0, 1);
      walkProgress = easeInOut(t) * (1 / 7);
      if (t >= 1) activateControl();
    } else if (phase === "returning") {
      const t = clamp((now - returnStarted) / 1700, 0, 1);
      walkProgress = returnFrom * (1 - easeInOut(t));
      if (t >= 1) {
        phase = "overview";
        walkProgress = 0;
        experience.scrollTop = 0;
        experience.classList.add("is-overview");
      }
    } else if (phase === "walking") {
      const direction = (keys.has("w") || keys.has("arrowup") ? 1 : 0) - (keys.has("s") || keys.has("arrowdown") ? 1 : 0);
      velocity += direction * .24 * dt;
      velocity *= Math.exp(-2.65 * dt);
      velocity = clamp(velocity, -.13, .13);
      walkProgress = clamp(walkProgress + velocity * dt, 0, 1);
      
      // Stop moving completely if at boundaries
      if ((walkProgress === 0 && velocity < 0) || (walkProgress === 1 && velocity > 0)) velocity = 0;
      
      experience.classList.toggle("instructions-dim", now - lastInput > 5200);
    }

    // End phase logic
    let isEndPhase = (walkProgress === 1);
    let swayMultiplier = 1;
    if (isEndPhase && phase === "walking") {
      if (!endPhaseStart) endPhaseStart = now;
      let timeSinceEnd = now - endPhaseStart;
      
      // Pause for 0.8s - 1.2s before showing button
      if (timeSinceEnd > 1000) {
        investigate.classList.add("is-visible");
      }
      
      // Smoothly fade out sway
      swayMultiplier = Math.max(0, 1 - (timeSinceEnd / 800));
    } else {
      endPhaseStart = null;
      investigate.classList.remove("is-visible");
    }

    // Camera Sway (Cinematic)
    const swayX = phase === "walking" ? Math.sin(now * .001) * Math.min(1.5, Math.abs(velocity) * 20 + 0.5) * motionScale * swayMultiplier : 0;
    const swayY = phase === "walking" ? Math.cos(now * .0013) * Math.min(1.0, Math.abs(velocity) * 15 + 0.3) * motionScale * swayMultiplier : 0;

    // Segment Logic
    const segmentCount = segments.length; // 7
    const currentSegmentIndex = clamp(Math.floor(walkProgress * segmentCount), 0, segmentCount - 1);
    const segmentProgress = (walkProgress * segmentCount) - currentSegmentIndex;
    
    // Hide all scenes first for performance
    scenes.forEach(s => { 
      s.style.opacity = 0; 
      s.style.zIndex = -1; 
      // Reset transform so they don't jump when reappearing
      const img = s.querySelector("img");
      if(img) img.style.transform = 'none';
    });
    
    // Crossfade Logic (fade during the last 30% of a segment)
    const fadeStart = 0.70;
    let opacityCurrent = 1;
    let opacityNext = 0;
    
    if (segmentProgress > fadeStart && currentSegmentIndex + 1 < scenes.length) {
       const fadeT = (segmentProgress - fadeStart) / (1 - fadeStart);
       opacityNext = smooth(fadeT);
       opacityCurrent = 1 - opacityNext;
    }
    
    // Apply transform to current scene
    const sc = scenes[currentSegmentIndex];
    if (sc) {
      sc.style.opacity = opacityCurrent.toFixed(3);
      sc.style.zIndex = 10;
      const img = sc.querySelector("img");
      if (img) {
        img.style.transformOrigin = `${segments[currentSegmentIndex].originX}% ${segments[currentSegmentIndex].originY}%`;
        
        // Scale and translate over the segment
        const scale = 1 + (segments[currentSegmentIndex].scale - 1) * segmentProgress;
        const tx = segments[currentSegmentIndex].tx * segmentProgress + swayX;
        const ty = segments[currentSegmentIndex].ty * segmentProgress + swayY;
        
        img.style.transform = `translate3d(${tx}%, ${ty}%, 0) scale(${scale})`;
      }
    }
    
    // Apply synchronized transform to next scene (if any)
    if (currentSegmentIndex + 1 < scenes.length) {
      const sn = scenes[currentSegmentIndex + 1];
      sn.style.opacity = opacityNext.toFixed(3);
      sn.style.zIndex = 11;
      const snImg = sn.querySelector("img");
      if (snImg) {
        snImg.style.transformOrigin = `${segments[currentSegmentIndex].originX}% ${segments[currentSegmentIndex].originY}%`;
        
        // Next scene must perfectly match the visual scale of the current scene at the end of the segment.
        // At segmentProgress=1, it should be at scale 1.0 (start of its own journey).
        // At segmentProgress=0, it should be slightly smaller to "grow into" scale 1.0.
        const scale = 1 - (segments[currentSegmentIndex].scale - 1) * (1 - segmentProgress) * 0.6;
        const tx = (segments[currentSegmentIndex].tx * segmentProgress + swayX) * 0.6;
        const ty = (segments[currentSegmentIndex].ty * segmentProgress + swayY) * 0.6;
        
        snImg.style.transform = `translate3d(${tx}%, ${ty}%, 0) scale(${scale})`;
      }
    }

    updateHud(Math.round(walkProgress * (scenes.length - 1)));
    requestAnimationFrame(render);
  }

  function toggleAudio() {
    audioEnabled = !audioEnabled;
    iconUnmute.style.display = audioEnabled ? "none" : "block";
    iconMute.style.display = audioEnabled ? "block" : "none";
    
    if (audioEnabled) {
      if (!hasStartedAudio) {
        bgm.play().catch(() => {});
        hasStartedAudio = true;
      } else {
        bgm.play();
      }
    } else {
      bgm.pause();
    }
  }

  function tryStartAudio() {
    if (audioEnabled && !hasStartedAudio) {
      bgm.play().catch(() => {});
      hasStartedAudio = true;
    }
  }

  enterRoute.addEventListener("click", () => {
    tryStartAudio();
    beginWalk();
  });
  
  if (returnToMap) returnToMap.addEventListener("click", returnToOverview);
  if (audioToggle) audioToggle.addEventListener("click", toggleAudio);

  addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (["w", "s", "arrowup", "arrowdown"].includes(key)) {
      event.preventDefault();
      keys.add(key);
      if (!event.repeat && phase === "walking") {
        const impulse = key === "w" || key === "arrowup" ? .018 : -.018;
        velocity = clamp(velocity + impulse, -.14, .14);
      }
      registerInput();
    }
  });

  addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));
  addEventListener("blur", () => keys.clear());

  experience.addEventListener("wheel", (event) => {
    if (phase !== "walking") return;
    event.preventDefault();
    velocity = clamp(velocity + event.deltaY * .00011, -.14, .14);
    registerInput();
  }, { passive: false });

  experience.addEventListener("pointerdown", (event) => {
    if ((event.pointerType === "mouse" && !matchMedia("(max-width: 700px)").matches) || phase !== "walking") return;
    pointerLastY = event.clientY;
    pointerTravel = 0;
    experience.setPointerCapture(event.pointerId);
    registerInput();
  });

  experience.addEventListener("pointermove", (event) => {
    if ((event.pointerType === "mouse" && !matchMedia("(max-width: 700px)").matches) || pointerLastY === null || phase !== "walking") return;
    const delta = pointerLastY - event.clientY;
    pointerLastY = event.clientY;
    pointerTravel += Math.abs(delta);
    const impulse = delta / Math.max(innerHeight, 520) * .56;
    walkProgress = clamp(walkProgress + impulse, 0, 1);
    velocity = clamp(velocity + impulse * 2.1, -.14, .14);
    registerInput();
  });

  experience.addEventListener("pointerup", () => {
    pointerLastY = null;
    pointerTravel = 0;
  });

  requestAnimationFrame(render);
})();

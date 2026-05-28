/**
 * Naralis HOLISTIC WELLNESS
 * Interactive Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Opening Sequence & Audio Context ---
    const startBtn = document.getElementById('start-btn');
    const openingScreen = document.getElementById('opening');
    const mainContent = document.getElementById('main-content');
    const fadeTexts = document.querySelectorAll('.fade-text');
    const openingLogo = document.querySelector('.opening-logo');
    const brandLogoImg = document.getElementById('opening-brand-logo');
    const audioToggle = document.getElementById('audio-toggle');
    const audioStatus = document.getElementById('audio-status');
    
    let audioCtx;
    let isPlaying = false;
    let waveGainNode;

    // Procedural Ocean Wave Sound (Pink Noise + Lowpass Filter + LFO)
    function initAudio() {
        if(audioCtx) return;
        
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            audioCtx = new AudioContext();
            
            const bufferSize = audioCtx.sampleRate * 2;
            const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            
            // Generate Pink Noise
            let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
            for (let i = 0; i < bufferSize; i++) {
                let white = Math.random() * 2 - 1;
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                b3 = 0.86650 * b3 + white * 0.3104856;
                b4 = 0.55000 * b4 + white * 0.5329522;
                b5 = -0.7616 * b5 - white * 0.0168980;
                output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
                output[i] *= 0.11; // gain compensation
                b6 = white * 0.115926;
            }

            const noiseSource = audioCtx.createBufferSource();
            noiseSource.buffer = noiseBuffer;
            noiseSource.loop = true;
            
            // Bandpass Filter to simulate water
            const filter = audioCtx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 400;
            filter.Q.value = 0.5;

            // Master Gain
            waveGainNode = audioCtx.createGain();
            waveGainNode.gain.value = 0; // start silent

            // Connect
            noiseSource.connect(filter);
            filter.connect(waveGainNode);
            waveGainNode.connect(audioCtx.destination);
            
            noiseSource.start();

            // LFO for wave swelling (Breathing rhythm, ~8 seconds per cycle)
            setInterval(() => {
                if(!isPlaying || !audioCtx) return;
                const now = audioCtx.currentTime;
                waveGainNode.gain.cancelScheduledValues(now);
                waveGainNode.gain.setValueAtTime(0.05, now);
                waveGainNode.gain.linearRampToValueAtTime(0.25, now + 3);
                filter.frequency.linearRampToValueAtTime(800, now + 3);
                waveGainNode.gain.linearRampToValueAtTime(0.05, now + 8);
                filter.frequency.linearRampToValueAtTime(300, now + 8);
            }, 8000);
        } catch (e) {
            console.error("Audio initialization failed:", e);
        }
    }

    function toggleAudio() {
        if(!audioCtx) initAudio();
        
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        isPlaying = !isPlaying;
        if(isPlaying) {
            audioStatus.textContent = 'ON';
            if(waveGainNode) waveGainNode.gain.setTargetAtTime(0.1, audioCtx.currentTime, 1);
        } else {
            audioStatus.textContent = 'OFF';
            if(waveGainNode) waveGainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.5);
        }
    }

    if(audioToggle) {
        audioToggle.addEventListener('click', toggleAudio);
    }

    // Sequence Animation
    function playOpeningSequence() {
        startBtn.style.opacity = '0';
        setTimeout(() => startBtn.style.display = 'none', 500);

        // Turn on audio (safely)
        initAudio();
        isPlaying = true;
        if(audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        if(waveGainNode) {
            waveGainNode.gain.setTargetAtTime(0.1, audioCtx.currentTime, 2);
        }

        // Fade Texts Sequence (Sped up)
        let delay = 500;
        fadeTexts.forEach((text, index) => {
            setTimeout(() => {
                text.classList.add('show');
                // Hide faster
                setTimeout(() => {
                    text.style.opacity = '0';
                    text.style.transform = 'translate(-50%, -60%)';
                }, 2000);
            }, delay);
            delay += 2500; // time between lines (was 4000)
        });

        // Logo reveal
        setTimeout(() => {
            openingLogo.classList.add('show');
            // Add glow/wave effect
            setTimeout(() => {
                if(brandLogoImg) brandLogoImg.classList.add('glow');
            }, 800);
            
            // Transition to main content
            setTimeout(() => {
                openingScreen.style.opacity = '0';
                setTimeout(() => {
                    openingScreen.style.display = 'none';
                    document.body.classList.remove('loading');
                    mainContent.classList.remove('hidden');
                    // Trigger initial scroll reveals
                    handleScroll();
                    window.scrollTo(0, 0); // Ensure at top
                }, 1500);
            }, 3000); // reduced wait for logo

        }, delay);
    }

    startBtn.addEventListener('click', playOpeningSequence);


    // --- 2. Scroll Reveal (Intersection Observer) ---
    const revealElements = document.querySelectorAll('.reveal');
    
    const revealOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -100px 0px"
    };

    const revealOnScroll = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            } else {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, revealOptions);

    revealElements.forEach(el => {
        revealOnScroll.observe(el);
    });

    // Fallback manual check
    function handleScroll() {
        revealElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if(rect.top < window.innerHeight - 100) {
                el.classList.add('visible');
            }
        });
    }
    window.addEventListener('scroll', handleScroll);


    // --- 3. Custom Cursor Glow ---
    const cursorGlow = document.querySelector('.cursor-glow');
    
    if (window.matchMedia("(pointer: fine)").matches) { // only apply if using a mouse
        document.addEventListener('mousemove', (e) => {
            cursorGlow.classList.add('active');
            // Request animation frame for smooth movement
            window.requestAnimationFrame(() => {
                cursorGlow.style.left = e.clientX + 'px';
                cursorGlow.style.top = e.clientY + 'px';
            });
        });

        document.addEventListener('mouseleave', () => {
            cursorGlow.classList.remove('active');
        });
    }

    // --- 4. Parallax Background ---
    const parallaxBg = document.getElementById('parallax-bg');
    
    window.addEventListener('scroll', () => {
        if(parallaxBg) {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.15;
            parallaxBg.style.transform = `translate3d(0, ${rate}px, 0)`;
        }
    });
});

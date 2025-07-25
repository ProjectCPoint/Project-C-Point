// ==UserScript==
// @name         Pornhub Cum Countdown
// @namespace    http://tampermonkey.net/
// @version      0.5
// @description  Countdown Overlay
// @author       ProjectCPoint
// @match        https://www.pornhub.org/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const Sound = true; // Play Sounds
    const Numbers = true; // Show Numbers

    const speakersList = "Livia,Sage";
    const speakers = speakersList.split(',').map(s => s.trim());
    const selectedSpeaker = speakers[Math.floor(Math.random() * speakers.length)];

    //console.log(`[C-Pointer] Choosen Speaker: ${selectedSpeaker}`);

    const soundBaseURL = 'https://github.com/ProjectCPoint/Project-C-Point/raw/refs/heads/main/Sounds/';

    let cPointers = [];
    let triggered = {};

    function parseTimeToSeconds(timeStr) {
        const parts = timeStr.split(':').map(Number);
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        return 0;
    }

    function reloadCPointers() {
        cPointers = [];
        triggered = {};
        const comments = document.querySelectorAll('#cmtWrapper .commentMessage span');
        const regex = /C-Pointer[:]? ([\d:;\s]+)/i;

        comments.forEach(span => {
            const match = span.textContent.match(regex);
            if (match) {
                const timesRaw = match[1].split(';').map(t => t.trim()).filter(t => t.length > 0);
                timesRaw.forEach(timeStr => {
                    const seconds = parseTimeToSeconds(timeStr);
                    //console.log(`[C-Pointer] Found Markers: ${timeStr} = ${seconds}s`);
                    cPointers.push(seconds);
                    triggered[seconds] = {};
                });
            }
        });

        if (cPointers.length === 0) {
            //console.log('[C-Pointer] No Markers found.');
        } else {
            //console.log(`[C-Pointer] Loaded Markers: ${cPointers.length}`);
        }
    }

    function showOverlay(text) {
        let overlay = document.getElementById('cPointerOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'cPointerOverlay';
            overlay.style.position = 'fixed';
            overlay.style.top = '50%';
            overlay.style.left = '50%';
            overlay.style.transform = 'translate(-50%, -50%)';
            overlay.style.fontSize = '200px';
            overlay.style.color = 'red';
            overlay.style.zIndex = '9999';
            overlay.style.pointerEvents = 'none';
            overlay.style.textShadow = '0 0 20px black';
            document.body.appendChild(overlay);
        }
        overlay.textContent = text;
        overlay.style.display = 'block';
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 900);
    }

    function playSound(name) {
        if (!Sound) return;
        const audio = new Audio(`${soundBaseURL}${selectedSpeaker}/${name}.mp3`);
        audio.play();
        //console.log(`[Sound] Played: ${selectedSpeaker}/${name}.mp3`);
    }

    function monitorVideo() {
        const videoTimer = document.querySelector('.mgp_elapsed');
        if (!videoTimer) {
            //console.log('[C-Pointer] No Videotimer found.');
            return;
        }

        setInterval(() => {
            const currentTime = parseTimeToSeconds(videoTimer.textContent.trim());
            //console.log(`[C-Pointer] Time now: ${currentTime}s`);

            cPointers.forEach(pointer => {
                const diff = pointer - currentTime;

                if (diff >= 0 && diff <= 10) {
                    const countdownVal = Math.floor(diff);
                    if (!triggered[pointer][countdownVal]) {
                        triggered[pointer][countdownVal] = true;

                        if (Numbers) {
                            const display = countdownVal === 0 ? 'C' : countdownVal;
                            showOverlay(display);
                        }
                        if (Sound) {
                            const soundName = countdownVal === 0 ? 'C' : `countdown_${countdownVal}`;
                            playSound(soundName);
                        }
                        //console.log(`[C-Pointer] Countdown: ${countdownVal === 0 ? 'C' : countdownVal} for Marker ${pointer}s`);
                    }
                }

                if (currentTime < pointer - 11) {
                    triggered[pointer] = {};
                }
            });
        }, 1000);
    }

    // === Init ===
    reloadCPointers();
    monitorVideo();

    // Manual Redetect Markers
    window.reloadCPointers = reloadCPointers;

})();

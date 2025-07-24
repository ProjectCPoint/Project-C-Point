// ==UserScript==
// @name         Pornhub Cum Countdown
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  Countdown Overlay
// @author       ProjectCPoint
// @match        https://www.pornhub.org/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const Sound = false; // Sound abspielen
    const Numbers = true; // Zahlen anzeigen

    const soundBaseURL = 'https://your.github.repo/sounds/'; // Ersetze durch GitHub-Pfad
    //Erwartet countdown_10.mp3, countdown_9.mp3, …, countdown_1.mp3, C.mp3

    let cPointers = [];
    let triggered = {}; // pro Marker-Zeit pro Countdownwert

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
                    console.log(`[C-Pointer] Marker gefunden: ${timeStr} = ${seconds}s`);
                    cPointers.push(seconds);
                    triggered[seconds] = {};
                });
            }
        });

        if (cPointers.length === 0) {
            console.log('[C-Pointer] Keine Marker gefunden.');
        } else {
            console.log(`[C-Pointer] Gesamtanzahl Marker geladen: ${cPointers.length}`);
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
        const audio = new Audio(`${soundBaseURL}${name}.mp3`);
        audio.play();
        console.log(`[Sound] Abgespielt: ${name}.mp3`);
    }

    function monitorVideo() {
        const videoTimer = document.querySelector('.mgp_elapsed');
        if (!videoTimer) {
            console.log('[C-Pointer] Videotimer nicht gefunden.');
            return;
        }

        setInterval(() => {
            const currentTime = parseTimeToSeconds(videoTimer.textContent.trim());
            console.log(`[C-Pointer] Aktuelle Zeit: ${currentTime}s`);

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
                        console.log(`[C-Pointer] Countdown: ${countdownVal === 0 ? 'C' : countdownVal} für Marker ${pointer}s`);
                    }
                }

                // Rückspul-Erkennung: Wenn der Videostand weit genug unter den Marker fällt, resette alle Trigger
                if (currentTime < pointer - 11) {
                    triggered[pointer] = {};
                }
            });
        }, 1000);
    }

    // === Init ===
    reloadCPointers();
    monitorVideo();

    // Für manuelles Nachladen über Konsole
    window.reloadCPointers = reloadCPointers;

})();

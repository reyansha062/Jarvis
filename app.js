const $ = (id) => document.getElementById(id);

const answer = $("answer");
const hint = $("hint");
const log = $("log");
const coreWrap = $("coreWrap");
const mode = $("mode");
const voiceStatus = $("voiceStatus");
const systemStatus = $("systemStatus");

function addLog(who, text) {
    const item = document.createElement("div");
    item.className = "line " + (who === "You" ? "you" : "jarvis");

    item.textContent =
        "[" + new Date().toLocaleTimeString() + "] " +
        who + ": " + text;

    log.prepend(item);
}

function speak(text) {
    if (!("speechSynthesis" in window)) {
        return;
    }

    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(text);

    speech.rate = 1;
    speech.pitch = 0.88;
    speech.volume = 1;

    window.speechSynthesis.speak(speech);
}

function reply(text) {
    answer.textContent = text;
    hint.textContent = "JARVIS is ready for your next command.";

    addLog("JARVIS", text);
    speak(text);
}

function openWeb(url) {
    window.open(url, "_blank");
}

function execute(rawCommand) {

    if (!rawCommand || !rawCommand.trim()) {
        return;
    }

    const command = rawCommand.trim();
    const lower = command.toLowerCase();

    addLog("You", command);

    hint.textContent = command;

    /* GREETING */

    if (
        lower.includes("hello") ||
        lower.includes("hi jarvis") ||
        lower === "hi"
    ) {
        reply("Hello. All systems are online.");
    }

    /* TIME */

    else if (lower.includes("time")) {

        const time = new Date().toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit"
        });

        reply("The current time is " + time);
    }

    /* DATE */

    else if (
        lower.includes("date") ||
        lower.includes("today")
    ) {

        const date = new Date().toLocaleDateString([], {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });

        reply("Today is " + date);
    }

    /* GOOGLE */

    else if (lower.includes("open google")) {

        reply("Opening Google.");

        openWeb("https://www.google.com");
    }

    /* YOUTUBE */

    else if (lower.includes("open youtube")) {

        reply("Opening YouTube.");

        openWeb("https://www.youtube.com");
    }

    /* YOUTUBE SEARCH */

    else if (lower.startsWith("youtube ")) {

        const query = command.substring(8).trim();

        if (query) {

            reply("Searching YouTube for " + query);

            openWeb(
                "https://www.youtube.com/results?search_query=" +
                encodeURIComponent(query)
            );
        }
    }

    /* GOOGLE SEARCH */

    else if (lower.startsWith("search ")) {

        const query = command.substring(7).trim();

        if (query) {

            reply("Searching for " + query);

            openWeb(
                "https://www.google.com/search?q=" +
                encodeURIComponent(query)
            );
        }
    }

    /* IDENTITY */

    else if (
        lower.includes("who are you") ||
        lower.includes("what are you")
    ) {

        reply(
            "I am JARVIS, your browser-based personal AI assistant."
        );
    }

    /* CLEAR LOG */

    else if (lower.includes("clear log")) {

        log.innerHTML = "";

        reply("Activity log cleared.");
    }

    /* HELP */

    else if (
        lower === "help" ||
        lower.includes("what can you do")
    ) {

        reply(
            "I can tell you the time and date, open Google and YouTube, search the web, search YouTube, and respond to voice commands."
        );
    }

    /* UNKNOWN COMMAND */

    else {

        reply(
            "Command not recognized. Try saying open YouTube, search Python tutorials, or what is the time."
        );
    }
}


/* =========================
   VOICE RECOGNITION
   ========================= */

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

let recognition = null;

if (SpeechRecognition) {

    recognition = new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = function () {

        coreWrap.classList.add("listening");

        mode.textContent = "LISTENING...";

        voiceStatus.textContent = "LISTENING";

        systemStatus.textContent = "VOICE ACTIVE";
    };

    recognition.onend = function () {

        coreWrap.classList.remove("listening");

        mode.textContent = "VOICE READY";

        voiceStatus.textContent = "READY";

        systemStatus.textContent = "SYSTEM ONLINE";
    };

    recognition.onerror = function (event) {

        coreWrap.classList.remove("listening");

        mode.textContent = "MIC ERROR";

        voiceStatus.textContent = "ERROR";

        hint.textContent =
            "Microphone error: " + event.error;

        systemStatus.textContent = "SYSTEM ONLINE";
    };

    recognition.onresult = function (event) {

        const spokenText =
            event.results[0][0].transcript;

        execute(spokenText);
    };

} else {

    mode.textContent = "TEXT ONLY";

    voiceStatus.textContent = "UNAVAILABLE";

    systemStatus.textContent = "TEXT MODE";

    if ($("mic")) {
        $("mic").disabled = true;
    }
}


/* =========================
   MICROPHONE BUTTON
   ========================= */

if ($("mic")) {

    $("mic").onclick = function () {

        if (!recognition) {
            return;
        }

        try {
            recognition.start();
        } catch (error) {
            console.log("Microphone already running.");
        }
    };
}


/* =========================
   STOP BUTTON
   ========================= */

if ($("stop")) {

    $("stop").onclick = function () {

        if (recognition) {
            recognition.stop();
        }

        if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
        }

        coreWrap.classList.remove("listening");

        mode.textContent = "VOICE READY";

        voiceStatus.textContent = "READY";

        systemStatus.textContent = "SYSTEM ONLINE";
    };
}


/* =========================
   SEND BUTTON
   ========================= */

if ($("send")) {

    $("send").onclick = function () {

        const input = $("command");

        execute(input.value);

        input.value = "";

        input.focus();
    };
}


/* =========================
   ENTER KEY
   ========================= */

if ($("command")) {

    $("command").addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Enter") {

                $("send").click();
            }
        }
    );
}


/* =========================
   QUICK COMMAND BUTTONS
   ========================= */

document
    .querySelectorAll("[data-cmd]")
    .forEach(function (button) {

        button.onclick = function () {

            execute(button.dataset.cmd);
        };
    });


/* =========================
   CLEAR LOG
   ========================= */

if ($("clear")) {

    $("clear").onclick = function () {

        log.innerHTML = "";
    };
}


/* =========================
   LIVE CLOCK
   ========================= */

function updateClock() {

    if ($("clock")) {

        $("clock").textContent =
            new Date().toLocaleTimeString();
    }
}

setInterval(updateClock, 1000);

updateClock();


/* =========================
   STARTUP
   ========================= */

reply(
    "Good day. I am JARVIS. All systems are online."
);

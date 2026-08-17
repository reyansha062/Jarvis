const $ = id => document.getElementById(id);

let recognition = null;
let activated = false;
let listening = false;
let shouldListen = false;
let restarting = false;

function log(who, text) {

    const div = document.createElement("div");

    div.className =
        "line " +
        (who === "You" ? "you" : "jarvis");

    div.textContent =
        `[${new Date().toLocaleTimeString()}] ${who}: ${text}`;

    $("log").prepend(div);
}

function show(text, detail = "") {

    $("answer").textContent = text;

    $("detail").textContent = detail;

    log("JARVIS", text);

    if ("speechSynthesis" in window) {

        speechSynthesis.cancel();

        const voice =
            new SpeechSynthesisUtterance(text);

        voice.rate = 0.95;
        voice.pitch = 0.85;

        speechSynthesis.speak(voice);
    }
}

function micStatus(type, text) {

    $("micDot").className = type;

    $("micState").textContent = text;
}

function startRecognition() {

    if (
        !recognition ||
        !activated ||
        !shouldListen ||
        listening ||
        restarting
    ) return;

    try {

        restarting = true;

        recognition.start();

    } catch {

        restarting = false;

    }
}

async function testMicrophone() {

    if (!navigator.mediaDevices?.getUserMedia) {

        micStatus(
            "error",
            "MICROPHONE API UNAVAILABLE"
        );

        return;
    }

    try {

        const stream =
            await navigator.mediaDevices.getUserMedia({
                audio: true
            });

        const tracks =
            stream.getAudioTracks();

        micStatus(
            "live",
            "MICROPHONE WORKS"
        );

        $("statusText").textContent =
            "MICROPHONE TEST PASSED";

        $("detail").textContent =
            "Microphone detected successfully.";

        tracks.forEach(track =>
            track.stop()
        );

    } catch (error) {

        micStatus(
            "error",
            "MICROPHONE BLOCKED"
        );

        $("statusText").textContent =
            "ALLOW MICROPHONE";

        $("detail").textContent =
            "Click the lock icon in your browser address bar and allow microphone access.";

        console.error(error);
    }
}

if (
    "SpeechRecognition" in window ||
    "webkitSpeechRecognition" in window
) {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    recognition = new SpeechRecognition();

    recognition.lang = "en-IN";

    recognition.continuous = false;

    recognition.interimResults = false;

    recognition.maxAlternatives = 1;

    recognition.onstart = () => {

        restarting = false;

        listening = true;

        micStatus(
            "live",
            "LISTENING"
        );

        $("statusText").textContent =
            'LISTENING FOR "HEY JARVIS"';

        $("reactor").classList.add(
            "listening"
        );
    };

    recognition.onresult = event => {

        const heard =
            event.results[
                event.results.length - 1
            ][0].transcript.trim();

        $("detail").textContent =
            `Heard: "${heard}"`;

        const match =
            heard.match(
                /(?:hey|ok|okay)\s+jarvis\b(.*)/i
            );

        if (!match) {

            $("statusText").textContent =
                'WAITING FOR "HEY JARVIS"';

            return;
        }

        const command =
            match[1].trim();

        if (command) {

            askGemini(command);

        } else {

            show(
                "Yes?",
                "I'm listening."
            );

        }
    };

    recognition.onerror = event => {

        listening = false;

        restarting = false;

        $("reactor").classList.remove(
            "listening"
        );

        if (
            event.error === "not-allowed" ||
            event.error === "service-not-allowed"
        ) {

            activated = false;

            shouldListen = false;

            micStatus(
                "error",
                "MICROPHONE BLOCKED"
            );

            $("statusText").textContent =
                "MICROPHONE BLOCKED";

            return;
        }

        if (event.error === "audio-capture") {

            micStatus(
                "error",
                "NO MICROPHONE FOUND"
            );

            $("statusText").textContent =
                "CHECK MICROPHONE";

            return;
        }

        setTimeout(
            startRecognition,
            700
        );
    };

    recognition.onend = () => {

        listening = false;

        $("reactor").classList.remove(
            "listening"
        );

        if (
            activated &&
            shouldListen
        ) {

            setTimeout(
                startRecognition,
                500
            );

        } else {

            micStatus(
                "",
                "MICROPHONE OFF"
            );
        }
    };

    $("activate").onclick = async () => {

        activated = true;

        shouldListen = true;

        $("activate").classList.add(
            "active"
        );

        $("activate").textContent =
            "✓ JARVIS ACTIVATED";

        await testMicrophone();

        setTimeout(
            startRecognition,
            300
        );
    };

    $("micTest").onclick =
        testMicrophone;

    $("mic").onclick = () => {

        activated = true;

        shouldListen = true;

        $("activate").classList.add(
            "active"
        );

        $("activate").textContent =
            "✓ JARVIS ACTIVATED";

        startRecognition();
    };

    $("stop").onclick = () => {

        shouldListen = false;

        activated = false;

        $("activate").classList.remove(
            "active"
        );

        $("activate").textContent =
            "🎙 ACTIVATE JARVIS";

        try {

            recognition.stop();

        } catch {}

        speechSynthesis?.cancel();

        micStatus(
            "",
            "MICROPHONE OFF"
        );

        $("statusText").textContent =
            "VOICE STOPPED";
    };

} else {

    $("activate").disabled = true;

    $("mic").disabled = true;

    $("micTest").disabled = true;

    micStatus(
        "error",
        "VOICE NOT SUPPORTED"
    );

    $("statusText").textContent =
        "USE CHROME OR EDGE";
}

async function askGemini(message) {

    log("You", message);

    $("statusText").textContent =
        "GEMINI THINKING";

    try {

        const response =
            await fetch(
                "/api/chat",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        message
                    })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.error ||
                "Gemini error"
            );
        }

        show(
            data.reply,
            data.action
                ? `Action: ${data.action.type}`
                : "Gemini response"
        );

        performAction(
            data.action
        );

    } catch (error) {

        show(
            "I cannot reach my Gemini brain.",
            "Check that the backend is running and your API key is configured."
        );

        console.error(error);
    }
}

function performAction(action) {

    if (!action) return;

    const query =
        encodeURIComponent(
            action.query || ""
        );

    if (action.type === "google") {

        window.open(
            `https://www.google.com/search?q=${query}`,
            "_blank"
        );

    }

    else if (action.type === "youtube") {

        window.open(
            `https://www.youtube.com/results?search_query=${query}`,
            "_blank"
        );

    }

    else if (action.type === "maps") {

        window.open(
            `https://www.google.com/maps/search/?api=1&query=${query}`,
            "_blank"
        );

    }

    else if (action.type === "weather") {

        window.open(
            `https://www.google.com/search?q=${encodeURIComponent(
                "weather " +
                (action.query || "")
            )}`,
            "_blank"
        );

    }

    else if (action.type === "timer") {

        const seconds =
            Number(action.seconds) || 1;

        setTimeout(() => {

            show(
                "Timer complete.",
                `${seconds} second timer finished.`
            );

            alert(
                "JARVIS: Timer complete."
            );

        }, seconds * 1000);
    }
}

$("send").onclick = () => {

    const text =
        $("cmd").value.trim();

    if (!text) return;

    $("cmd").value = "";

    askGemini(text);
};

$("cmd").addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {

            $("send").click();

        }
    }
);

document
    .querySelectorAll("[data-q]")
    .forEach(button => {

        button.onclick = () => {

            askGemini(
                button.dataset.q
            );

        };

    });

$("clear").onclick = () => {

    $("log").innerHTML = "";

};

fetch("/api/health")
    .then(response =>
        response.json()
    )
    .then(data => {

        if (data.ok) {

            $("statusText").textContent =
                "GEMINI READY";

        } else {

            $("statusText").textContent =
                "GEMINI API KEY MISSING";

        }

    })
    .catch(() => {

        $("statusText").textContent =
            "BACKEND OFFLINE";

    });

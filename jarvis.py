"""
JARVIS - A simple voice-controlled AI assistant (inspired by Iron Man / Avengers)

Features:
- Greets you based on time of day
- Listens to voice commands via microphone
- Speaks responses back to you
- Can open websites, search Wikipedia, tell time/date, tell jokes,
  do basic web searches, and more

Install dependencies first:
    pip install pyttsx3 SpeechRecognition wikipedia pyaudio requests

Note: pyaudio can be tricky to install on some systems.
    - Windows: pip install pyaudio
    - Mac: brew install portaudio && pip install pyaudio
    - Linux: sudo apt-get install python3-pyaudio
"""

import datetime
import webbrowser
import random

import pyttsx3
import speech_recognition as sr

try:
    import wikipedia
except ImportError:
    wikipedia = None


# ---------- Setup ----------

engine = pyttsx3.init()
voices = engine.getProperty("voices")
# Try to pick a deeper/male-sounding voice if available (index 0 usually)
if voices:
    engine.setProperty("voice", voices[0].id)
engine.setProperty("rate", 175)


def speak(text: str) -> None:
    """Convert text to speech."""
    print(f"JARVIS: {text}")
    engine.say(text)
    engine.runAndWait()


def wish_user() -> None:
    """Greet the user based on current time."""
    hour = datetime.datetime.now().hour
    if hour < 12:
        greeting = "Good morning"
    elif hour < 18:
        greeting = "Good afternoon"
    else:
        greeting = "Good evening"

    speak(f"{greeting}, sir. JARVIS at your service. How can I help you today?")


def listen() -> str:
    """Listen to microphone input and convert speech to text."""
    recognizer = sr.Recognizer()
    with sr.Microphone() as source:
        print("Listening...")
        recognizer.pause_threshold = 1
        recognizer.adjust_for_ambient_noise(source, duration=0.5)
        audio = recognizer.listen(source)

    try:
        print("Recognizing...")
        query = recognizer.recognize_google(audio, language="en-in")
        print(f"You said: {query}")
        return query.lower()
    except sr.UnknownValueError:
        speak("Sorry, I didn't catch that. Could you repeat it?")
        return ""
    except sr.RequestError:
        speak("My speech service seems to be down right now.")
        return ""


def tell_joke() -> str:
    jokes = [
        "Why did the robot go on a diet? It had too many bytes.",
        "I would tell you a UDP joke, but you might not get it.",
        "Why do programmers prefer dark mode? Because light attracts bugs.",
    ]
    return random.choice(jokes)


def handle_command(query: str) -> bool:
    """
    Process a recognized command.
    Returns False if the user asked JARVIS to shut down, True otherwise.
    """
    if not query:
        return True

    if "wikipedia" in query and wikipedia:
        speak("Searching Wikipedia...")
        search_term = query.replace("wikipedia", "").strip()
        try:
            summary = wikipedia.summary(search_term, sentences=2)
            speak("According to Wikipedia:")
            speak(summary)
        except Exception:
            speak("I couldn't find anything on that topic.")

    elif "open youtube" in query:
        speak("Opening YouTube.")
        webbrowser.open("https://youtube.com")

    elif "open google" in query:
        speak("Opening Google.")
        webbrowser.open("https://google.com")

    elif "search for" in query:
        term = query.replace("search for", "").strip()
        speak(f"Searching for {term}.")
        webbrowser.open(f"https://www.google.com/search?q={term}")

    elif "time" in query:
        current_time = datetime.datetime.now().strftime("%I:%M %p")
        speak(f"The time is {current_time}.")

    elif "date" in query:
        today = datetime.datetime.now().strftime("%B %d, %Y")
        speak(f"Today's date is {today}.")

    elif "joke" in query:
        speak(tell_joke())

    elif "your name" in query:
        speak("I am JARVIS, your personal assistant.")

    elif any(word in query for word in ["exit", "quit", "shut down", "goodbye"]):
        speak("Shutting down. Goodbye, sir.")
        return False

    else:
        speak("I'm not sure how to help with that yet, but I'm learning.")

    return True


def main() -> None:
    wish_user()
    running = True
    while running:
        query = listen()
        running = handle_command(query)


if __name__ == "__main__":
    main()

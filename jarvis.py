import speech_recognition as sr
import pyttsx3
import webbrowser
import datetime
import os

# Initialize voice engine
engine = pyttsx3.init()
engine.setProperty("rate", 175)

def speak(text):
    print("JARVIS:", text)
    engine.say(text)
    engine.runAndWait()

def listen():
    recognizer = sr.Recognizer()

    with sr.Microphone() as source:
        print("Listening...")
        recognizer.adjust_for_ambient_noise(source, duration=0.5)
        audio = recognizer.listen(source)

    try:
        command = recognizer.recognize_google(audio, language="en-IN")
        print("You:", command)
        return command.lower()

    except sr.UnknownValueError:
        speak("Sorry, I didn't understand that.")
        return ""

    except sr.RequestError:
        speak("I am having trouble connecting to the speech service.")
        return ""

def jarvis():
    speak("Hello. I am JARVIS. How can I help you?")

    while True:
        command = listen()

        if not command:
            continue

        # Stop JARVIS
        if "exit" in command or "quit" in command or "goodbye" in command:
            speak("Goodbye, sir.")
            break

        # Time
        elif "time" in command:
            time = datetime.datetime.now().strftime("%I:%M %p")
            speak(f"The time is {time}")

        # Date
        elif "date" in command:
            date = datetime.datetime.now().strftime("%d %B %Y")
            speak(f"Today is {date}")

        # Open Google
        elif "open google" in command:
            speak("Opening Google.")
            webbrowser.open("https://www.google.com")

        # Open YouTube
        elif "open youtube" in command:
            speak("Opening YouTube.")
            webbrowser.open("https://www.youtube.com")

        # Search Google
        elif command.startswith("search"):
            search_query = command.replace("search", "", 1).strip()

            if search_query:
                speak(f"Searching for {search_query}")
                webbrowser.open(
                    "https://www.google.com/search?q="
                    + search_query.replace(" ", "+")
                )

        # Open Notepad
        elif "open notepad" in command:
            speak("Opening Notepad.")
            os.system("notepad.exe")

        # Open Calculator
        elif "open calculator" in command:
            speak("Opening Calculator.")
            os.system("calc.exe")

        else:
            speak("I don't know how to do that yet.")

if __name__ == "__main__":
    jarvis()

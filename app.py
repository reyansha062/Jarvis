import os
import subprocess
import speech_recognition as sr
import google.generativeai as genai
from gtts import gTTS

# Core Authentication Framework
genai.configure(api_key=os.environ.get("GEMINI_API_KEY", "YOUR_GEMINI_API_KEY"))

def speak(text):
    """Initializes local output text-to-speech feedback blocks."""
    print(f"Ultron: {text}")
    tts = gTTS(text=text, lang='en')
    tts.save("response.mp3")
    if os.name == 'nt':
        os.system("start response.mp3")
    else:
        os.system("mpg123 response.mp3 > /dev/null 2>&1 || afplay response.mp3")

def get_connected_devices():
    """Queries active system connections via the adb engine."""
    try:
        output = subprocess.check_output(["adb", "devices"]).decode("utf-8")
        lines = output.strip().split("\n")[1:]
        return [line.split("\t") for line in lines if "device" in line]
    except Exception:
        return []

def execute_adb_command(device_id, command):
    """Pipes background macro strings down target active system handles."""
    full_cmd = ["adb", "-s", device_id] + command
    subprocess.Popen(full_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def control_devices(action):
    """Broadcast map array managing cross-device shell parameters."""
    devices = get_connected_devices()
    if not devices:
        speak("System execution paused. No hardware targets detected.")
        return

    speak(f"Distributing macro pipeline protocols across {len(devices)} active targets.")
    for device in devices:
        if action == "UNLOCK":
            execute_adb_command(device, ["shell", "input", "keyevent", "KEYCODE_WAKEUP"])
            execute_adb_command(device, ["shell", "input", "swipe", "500", "1500", "500", "500", "300"])
        elif action == "LAUNCH_YOUTUBE":
            execute_adb_command(device, ["shell", "am", "start", "-a", "android.intent.action.VIEW", "https://www.youtube.com"])

def parse_intent_with_gemini(user_input):
    """Processes audio inputs against LLM intent nodes."""
    model = genai.GenerativeModel('gemini-1.5-flash')
    prompt = f"""
    Analyze the user's voice assistant instruction and map it to exactly one of these actions:
    - UNLOCK (if they want to unlock, wake, or open their phones)
    - LAUNCH_YOUTUBE (if they want to open YouTube)
    - UNKNOWN (if it does not fit)

    User Input: "{user_input}"
    Respond with ONLY the action keyword. No punctuation, no filler.
    """
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception:
        return "UNKNOWN"

def listen_and_route():
    """System loop processing micro stream captures."""
    recognizer = sr.Recognizer()
    with sr.Microphone() as source:
        print("\n[Node Connection Active] Listening...")
        recognizer.adjust_for_ambient_noise(source, duration=1)
        try:
            audio = recognizer.listen(source, timeout=5, phrase_time_limit=5)
            user_text = recognizer.recognize_google(audio)
            print(f"Captured System Text: {user_text}")
            
            if "how many devices" in user_text.lower():
                devices = get_connected_devices()
                speak(f"Active arrays detect {len(devices)} running terminals.")
                return

            intent = parse_intent_with_gemini(user_text)
            print(f"Mapped Intent Token: {intent}")

            if intent in ["UNLOCK", "LAUNCH_YOUTUBE"]:
                control_devices(intent)
            else:
                speak("Parsing completed. Input matches no active execution routes.")
        except Exception:
            pass

if __name__ == "__main__":
    while True:
        listen_and_route()
      

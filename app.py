import os
import re
import subprocess
import speech_recognition as sr
import google.generativeai as genai
from gtts import gTTS

# 1. Configure your Gemini API Key
# Get an API key from Google AI Studio: https://google.com
genai.configure(api_key=os.environ.get("GEMINI_API_KEY", "YOUR_GEMINI_API_KEY"))

def speak(text):
    """Converts text response to speech and plays it."""
    print(f"Ultron: {text}")
    tts = gTTS(text=text, lang='en')
    tts.save("response.mp3")
    # Multi-platform audio playback command
    if os.name == 'nt':
        os.system("start response.mp3")
    else:
        os.system("mpg123 response.mp3 > /dev/null 2>&1 || afplay response.mp3")

def get_connected_devices():
    """Retrieves a list of all active ADB device IDs."""
    try:
        output = subprocess.check_output(["adb", "devices"]).decode("utf-8")
        lines = output.strip().split("\n")[1:]
        devices = [line.split("\t")[0] for line in lines if "device" in line]
        return devices
    except Exception as e:
        print(f"Error getting ADB devices: {e}")
        return []

def execute_adb_command(device_id, command):
    """Executes a specific shell command on a targeted device."""
    full_cmd = ["adb", "-s", device_id] + command
    subprocess.Popen(full_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def control_devices(action):
    """Broadcasting routine to handle multiple devices sequentially."""
    devices = get_connected_devices()
    if not devices:
        speak("I cannot detect any connected devices right now.")
        return

    speak(f"Processing command across all {len(devices)} target devices.")
    
    for device in devices:
        if action == "UNLOCK":
            # Wakes up screen and swipes up to simulate an insecure swipe unlock
            execute_adb_command(device, ["shell", "input", "keyevent", "KEYCODE_WAKEUP"])
            execute_adb_command(device, ["shell", "input", "swipe", "500", "1500", "500", "500", "300"])
        elif action == "LAUNCH_YOUTUBE":
            # Fires up the deep-linked Android intent for YouTube
            execute_adb_command(device, ["shell", "am", "start", "-a", "android.intent.action.VIEW", "https://www.youtube.com"])

def parse_intent_with_gemini(user_input):
    """Uses LLM to evaluate complex speech intent into specific action triggers."""
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
    except Exception as e:
        print(f"LLM Processing Error: {e}")
        return "UNKNOWN"

def listen_and_route():
    """Main lifecycle thread loop for Speech recognition and execution."""
    recognizer = sr.Recognizer()
    with sr.Microphone() as source:
        print("\n[Ultron Online] Listening for command...")
        recognizer.adjust_for_ambient_noise(source, duration=1)
        try:
            audio = recognizer.listen(source, timeout=5, phrase_time_limit=5)
            user_text = recognizer.recognize_google(audio)
            print(f"User said: {user_text}")
            
            # Special internal status check
            if "how many devices" in user_text.lower():
                devices = get_connected_devices()
                speak(f"I currently have {len(devices)} active devices connected to my network hub.")
                return

            intent = parse_intent_with_gemini(user_text)
            print(f"Evaluated Intent: {intent}")

            if intent in ["UNLOCK", "LAUNCH_YOUTUBE"]:
                control_devices(intent)
            else:
                speak("Command recognized, but no matching device pipeline action is configured.")

        except sr.UnknownValueError:
            pass
        except sr.WaitTimeoutError:
            pass
        except Exception as e:
            print(f"Runtime error: {e}")

if __name__ == "__main__":
    # Continuous listening loops
    while True:
        listen_and_route()
          

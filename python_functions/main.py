# backend/python_functions/main.py (Reverted to Callable Function - Standard Init)

import os
import firebase_admin
from firebase_admin import initialize_app, firestore
from firebase_functions import https_fn
from openai import OpenAI
from dotenv import load_dotenv

print("Loading main.py module (Standard Init - Callable Function)...")

# --- Global Initializations ---
try:
    load_dotenv()
    print(".env loaded globally.")
except Exception as e:
    print(f"Warning: Failed to load .env globally: {e}")

if not firebase_admin._apps:
    try:
        initialize_app()
        print("Firebase Admin SDK initialized globally.")
    except Exception as admin_init_error:
        print(f"CRITICAL ERROR: Failed to initialize Firebase Admin SDK globally: {admin_init_error}")
        raise admin_init_error # Stop deployment if this fails

try:
    db = firestore.client()
    print("Firestore client obtained globally.")
except Exception as db_error:
     print(f"CRITICAL ERROR: Failed to get Firestore client globally: {db_error}")
     db = None # Mark failure

openai_client = None
try:
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        print("ERROR: OPENAI_API_KEY missing in environment.")
        # Decide if deployment should fail - maybe it's only needed at runtime via 'secrets'
    else:
        openai_client = OpenAI(api_key=openai_api_key)
        print("OpenAI client initialized globally.")
except Exception as openai_init_error:
    print(f"CRITICAL ERROR: Failed to initialize OpenAI client globally: {openai_init_error}")
    openai_client = None # Mark failure
# --- End Global Initializations ---


# --- Callable Function Definition ---
@https_fn.on_call(secrets=["OPENAI_API_KEY"])
def generateCompletion(req: https_fn.CallableRequest) -> dict: # Name MUST match frontend httpsCallable
    """Callable function using globally initialized clients."""
    function_name = "generateCompletion"
    print(f"--- {function_name} Request Received ---")

    if not db:
        print(f"ERROR ({function_name}): Firestore client not available (init failed).")
        raise https_fn.HttpsError(code=https_fn.FunctionsErrorCode.INTERNAL, message="Server database connection error.")
    if not openai_client:
         print(f"ERROR ({function_name}): OpenAI client not available (init failed or key missing).")
         # Re-check key from secrets env var just in case? Usually not needed.
         runtime_key = os.getenv("OPENAI_API_KEY")
         if not runtime_key:
             print(f"ERROR ({function_name}): OpenAI key STILL missing at runtime.")
             raise https_fn.HttpsError(code=https_fn.FunctionsErrorCode.INTERNAL, message="Server AI configuration error.")
         else:
             # Maybe try initializing client again here? Less ideal.
             print(f"Warning ({function_name}): OpenAI client re-checked key at runtime.")
             # For simplicity, rely on the global init check for now.
             raise https_fn.HttpsError(code=https_fn.FunctionsErrorCode.INTERNAL, message="Server AI connection error.")


    if not req.auth:
        print(f"Error ({function_name}): Authentication required.")
        raise https_fn.HttpsError(code=https_fn.FunctionsErrorCode.UNAUTHENTICATED, message="Authentication required.")

    uid = req.auth.uid
    print(f"{function_name} called by authenticated UID: {uid}")

    user_prompt = req.data.get("userPrompt")
    if not user_prompt:
        print(f"Error ({function_name}): Missing 'userPrompt' in request data for UID: {uid}")
        raise https_fn.HttpsError(code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT, message="'userPrompt' is required.")

    print(f"{function_name}: Received prompt from {uid}: '{user_prompt[:50]}...'")

    try:
        print(f"{function_name}: Calling OpenAI for UID: {uid}...")
        response = openai_client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": user_prompt}
            ]
        )
        if not response.choices or not response.choices[0].message or not response.choices[0].message.content:
             print(f"Warning ({function_name}): OpenAI response structure unexpected: {response}")
             raise https_fn.HttpsError(code=https_fn.FunctionsErrorCode.INTERNAL, message="Unexpected response from AI service.")
        assistant_message = response.choices[0].message.content.strip()
        print(f"{function_name}: OpenAI Response received: {assistant_message[:100]}...")

        print(f"{function_name}: Saving AI answer to Firestore for UID: {uid}...")
        user_doc_ref = db.collection('users').document(uid)
        try:
            user_doc_ref.update({'AIanswers': firestore.ArrayUnion([assistant_message])})
            print(f"{function_name}: AI answer successfully saved to Firestore for {uid}")
        except Exception as firestore_error:
             print(f"ERROR ({function_name}): Failed Firestore update for UID {uid}: {firestore_error}")
             raise https_fn.HttpsError(code=https_fn.FunctionsErrorCode.INTERNAL, message=f"Could not save AI response: {firestore_error}")

        print(f"--- {function_name} Request Completed Successfully for UID: {uid} ---")
        return {"reply": assistant_message} # Return structure expected by mentor's Dashboard

    except Exception as e:
        print(f"ERROR ({function_name}) during execution for UID {uid}: {type(e).__name__} - {str(e)}")
        # Consider specific error handling for OpenAI API errors (e.g., rate limits, invalid key)
        raise https_fn.HttpsError(code=https_fn.FunctionsErrorCode.INTERNAL, message="Error processing your request.")

# --- End of function ---
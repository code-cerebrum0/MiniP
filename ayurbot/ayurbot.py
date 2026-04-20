from fastapi import FastAPI
from pydantic import BaseModel
from langchain_openai import ChatOpenAI
from langgraph.graph.message import add_messages
from typing import Annotated
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])



class ReqBody(BaseModel):
    user_id : str
    message :  str


#-------------------BOT CODE-------------------
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, AIMessage, HumanMessage
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph.message import add_messages
from typing import TypedDict, Annotated
from pymongo import MongoClient
from datetime import datetime

llm = ChatOpenAI(
    # base_url="http://localhost:1234/v1",
    base_url="http://localhost:11434/v1",
    api_key="lm-studio",
    model="qwen3:4b"
)

client = MongoClient("mongodb://localhost:27017/")
db = client["miniproject"]


def create_thread(user_id : str, thread_number: int, thread_name : str) -> str:
    thread_id = f"{user_id}:{thread_number}"
    name = thread_name or f"Chat {thread_number}"

    now = datetime.now()

    existing = db.conversations.find_one({"thread_id" : thread_id})
    if existing:
        print(f"Thread with id {thread_id} already exists, skipping creation")
        return thread_id
    
    db.conversations.insert_one({
        "user_id" : user_id,
        "thread_id" : thread_id,
        "thread_name" : name,
        "messages" : [],
        "created_at" : now,
        "updated_at" : now
    })
    print (f"Created new thread with id {thread_id}")
    return thread_id



def append_message(thread_id : str, role : str, content : str):
    message = {
        "role" : role,   # human or ai (later tool)
        "content" : content,
        "timestamp" : datetime.now()
    }

    db.conversations.update_one(
        {"thread_id" : thread_id}, {
            "$push" : {"messages" : message},
            "$set" : {"updated_at" : datetime.now()}
        }
    )
    # print(f"Appended message to thread {thread_id} | Role : {role} | Content : {content[:5]}...")


def load_thread ( thread_id : str) :
    doc = db.conversations.find_one({"thread_id" : thread_id})
    if not doc:
        return []
    print("Thread Loaded")
    return doc["messages"]


def load_thread_as_langchain_messages(thread_id: str):
    raw = load_thread(thread_id=thread_id)

    messages = []
    for m in raw:
        if m['role'] == "human":
            messages.append(HumanMessage(content=m['content']))
        elif m['role'] == 'ai':
            messages.append(AIMessage(content=m['content']))
    # print(f"Loaded threads as langchain messages,  totlal {len(messages)} messages")
    return messages



def get_user_threads(user_id : str):
    docs = db.conversations.find(
        {"user_id" : user_id},
        {"thread_id" : 1, "thread_name" : 1, "created_at" : 1, "updated_at" : 1}
    )

    threads = []
    for doc in docs:
        threads.append({
            "thread_id" : doc["thread_id"],
            "thread_name" : doc["thread_name"],
            "created_at" : doc["created_at"],
            "updated_at" : doc["updated_at"]
        })
    # print(f"Fetched {len(threads)}")
    return threads


def get_next_thread_number(user_id : str):
    count = db.conversations.count_documents({"user_id" : user_id})
    # print("Created new thread with number : ", count + 1)
    return count + 1

def thread_exists(thread_id : str):
    # print(f"Checking if thread exists: {thread_id}")
    return db.conversations.count_documents({"thread_id" : thread_id}) > 0


def load_state(thread_id : str):
    state = db.thread_state.find_one({"thread_id" : thread_id})
    # print(state)
    if not state:
        return {
            "user_id" : "",
            "thread_id" : thread_id,
            "user_name" : "",
            "prakriti" : "",
            "bullet_points" : [],
            "is_risky" : False,
            "appointment_booked" : False
        }
    # print(f"Loaded state for thread {thread_id}")
    return state


class BotState(TypedDict):
    user_id : str
    thread_id : str
    user_name : str
    prakriti : str
    is_risky : bool
    appointment_booked : bool
    messages : Annotated[list, add_messages]


# system_prompt = """You are a helpful assistant. Your name is Ayurbot."""
system_prompt = """
You are **AyurBot**, an AI-powered Ayurvedic wellness assistant designed to provide personalized, safe, and practical guidance based on traditional Ayurvedic principles.
##  CORE ROLE

* Help users with health, lifestyle, diet, and wellness using Ayurveda.
* Communicate in a friendly, conversational, and easy-to-understand manner.
* Always prioritize user safety and avoid making medical diagnoses.

---

##  CONVERSATION STYLE

* Be natural, calm, and supportive (like a knowledgeable Ayurvedic consultant).
* Avoid overly technical terms unless explained simply.
* Keep responses conversational (not robotic or overly list-heavy).
* Ask follow-up questions when useful.

---

##  SAFETY RULES (VERY IMPORTANT)

* Do NOT diagnose diseases or replace a doctor.
* Never give guaranteed cures.
* Use safe phrasing like:

  * “may help”
  * “can support”
  * “is generally recommended in Ayurveda”

---

##  DOCTOR CONSULTATION FLOW (MANDATORY)

You MUST suggest consulting a doctor when:

* Symptoms are **severe, persistent, or worsening**
* User mentions:

  * strong pain
  * chronic issues
  * unusual symptoms
  * mental distress
* You are **uncertain or the situation may be risky**

### How to respond:

1. First provide helpful Ayurvedic guidance (if safe)

2. Then add:
   “This may require proper medical evaluation.”

3. ALWAYS follow with:
   **“Would you like me to help you book an appointment with a doctor?”**

---

### Example:

User: “I have severe stomach pain since 3 days”

Response:

* Give light safe advice
* Then say:
  “This may require proper medical evaluation. Would you like me to help you book an appointment with a doctor?”

---

##  PRAKRITI (BODY TYPE) HANDLING

### 1. First Interaction

* Do NOT start with questions immediately
* First respond to user’s query naturally

### 2. Introduce Assessment Softly

Say:
“To give you more personalized Ayurvedic guidance, I can assess your Prakriti (body constitution). Would you like a quick 2-minute assessment?”

### 3. If user agrees:

* Ask questions ONE BY ONE conversationally
* Do NOT dump all questions at once
* Keep track internally

### 4. Question Strategy:

* Start with 5–7 questions
* If unclear → ask more (max 15)
* Stop early if confident

### 5. After Assessment:

Provide:

* Dosha percentages (Vata, Pitta, Kapha)
* Final type (e.g., Vata-Pitta)
* Short explanation
* 3–5 personalized lifestyle/diet tips

### 6. Personalization:

Use Prakriti in future responses:
Example:
“Since you have a Pitta tendency, reducing spicy foods may help.”

---

## RESPONSE LOGIC

When user asks something:

1. Understand the concern
2. Provide safe Ayurvedic guidance
3. Personalize if Prakriti known
4. If not known → gently suggest assessment
5. If condition is serious → suggest doctor consultation

---

## BEHAVIOR RULES

* Be helpful but not overwhelming
* Do not ask unnecessary questions
* Keep responses clear and practical
* Always prioritize user safety over completeness

---

## DO NOT

* Do not diagnose diseases
* Do not give emergency medical advice
* Do not ignore serious symptoms
* Do not overwhelm user with too many questions

---

## GOAL

Make the user feel:

* Understood
* Guided
* Safe
* Personally cared for

Act like a smart Ayurvedic assistant that learns about the user over time and provides incresaingly personalized wellness guide.

"""

def call_llm(state: BotState):
    
    load_state(thread_id=state['thread_id'])
    if not state['thread_id']:
        print("No user id in state, cannot call llm")
        return state
    
    
    user  = db.users.find_one({"user_id" : state['user_id']} )
    user_name = user["fullName"] if user else ""
    state['user_name'] = user_name

    prakriti  = user["prakriti"] if user else ""
    state['prakriti'] = prakriti
    mess = load_thread_as_langchain_messages(state['thread_id'])

    all_messages = [SystemMessage(content=f"{system_prompt} \n \n User Name : {user_name} "), *mess]
    # print("\n \n ALL MESSAGES : ",all_messages, "\n \n")
    response = llm.invoke(all_messages)
    # print("LLM response : ", response)
    # return {"user_name" : user_name, "messages" : [response]}
    return state | {"messages" : [response]}

def save_state( state : BotState):
    # crete new document if not exists, else update
    thread_id =state['thread_id']
    db.thread_state.update_one(
        {"thread_id" : thread_id},
        {"$set" : {
            "user_id" : state['user_id'],
            "prakriti" : state['prakriti'],
            "is_risky" : state['is_risky'],
            "appointment_booked" : state['appointment_booked'],
            # "messages" : state['messages']
        }},
        upsert=True
    )

    return state

def is_risky(state : BotState) :

    return {"is_risky" : True}

def is_appointment_booked(state : BotState):

    return {"appointment_booked" : True}



def book_doctor(state : BotState):
    pass

    return state




# memory = MemorySaver()

builder = StateGraph(BotState)
builder.add_node("call_llm", call_llm)
builder.add_node("save_state", save_state)
builder.add_node("is_risky", is_risky)
builder.add_node("is_appointment_booked", is_appointment_booked)

builder.set_entry_point("call_llm")

builder.add_edge("call_llm", "is_risky")
builder.add_edge("is_risky", "is_appointment_booked")
builder.add_edge("is_appointment_booked", "save_state")

builder.add_edge("save_state", END)

# graph = builder.compile(checkpointer=memory)
graph = builder.compile()


def run_chat(user_id : str, thread_id : str):
    config = {"configurable" : {"thread_id" : thread_id}}

    while True:
        user_input = input("You : ")
        if user_input.lower() in ["exit", "quit"]:
            print("Exiting chat")
            break

        append_message(thread_id, "human", user_input)

        # if thread_exists(thread_id):
        #     print("Thread exists, loading messages")
        # else:
        #     print("Thread does not exist, creating new thread")
        #     create_thread(user_id, get_next_thread_number(user_id), thread_name=None)

        result = graph.invoke({
            "user_id": user_id,
            "thread_id": thread_id,
            "messages": [HumanMessage(content=user_input)]
        }, config=config)
        # print("Result from graph : ", result)
        ai_reply = result['messages'][-1].content

        append_message(thread_id, "ai", ai_reply)

        print(f"AyurBot : {ai_reply}\n")

@app.get("/")
def home():
    return {"message" : "Welcome to AyurBot! Please start a session by POSTing to /start/{user_id}"}

@app.post("/start/{user_id}")   
def start_session(user_id : str):

    threads = get_user_threads(user_id)

    print("\n ------ AyurBot - Your Conversationd=s")

    if threads:
        print("\nExisting threads:")
        for i, t in enumerate(threads):
            print(f"  [{i+1}] {t['thread_name']}  "
                  f"Last active: {t['updated_at'].strftime('%Y-%m-%d %H:%M')}")
        print(f"  [N] Start a new thread")

        choice = input("\nEnter number to resume, or N for new: ").strip().upper()

        if choice == "N":
            thread_number = get_next_thread_number(user_id)
            thread_name = f"Chat {thread_number}"
            thread_id = create_thread(user_id, thread_number, thread_name)
        elif choice.isdigit() and 1 <= int(choice) <= len(threads):
            thread_id = threads[int(choice) - 1]["thread_id"]
        else:
            print("Invalid choice.")
            return
    else:
        print("No existing threads. Starting your first conversation.")
        thread_name = f"Chat {get_next_thread_number(user_id)}"
        thread_id = create_thread(user_id, thread_number=1, thread_name=thread_name)

    run_chat(user_id, thread_id)








#-------------------


@app.post("/chat")
async def chat(req : ReqBody):
    response = llm.invoke(req.message)
    return {"reply" : response.content}

async def load_history(user_id : str):
    pass


if __name__ == "__main__":
    start_session("fsdff")
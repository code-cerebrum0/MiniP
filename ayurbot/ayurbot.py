from fastapi import FastAPI
from pydantic import BaseModel
from langchain_openai import ChatOpenAI
from langgraph.graph.message import add_messages
from typing import Annotated


app = FastAPI()

llm = ChatOpenAI(
    base_url="http://localhost:1234/v1",
    api_key="lm-studio",
    model="local-model"
)

class ReqBody(BaseModel):
    user_id : str
    message :  str


#-------------------BOT CODE-------------------





#-------------------


@app.post("/chat")
async def chat(req : ReqBody):
    response = llm.invoke(req.message)
    return {"reply" : response.content}

async def load_history(user_id : str):
    pass
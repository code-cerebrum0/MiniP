from fastapi import FastAPI
from pydantic import BaseModel
from langchain_openai import ChatOpenAI


app = FastAPI()

llm = ChatOpenAI(
    base_url="http://localhost:1234/v1",
    api_key="lm-studio",
    model="local-model"
)

class ReqBody(BaseModel):
    message :  str

@app.post("/chat")
async def chat(req : ReqBody):
    response = llm.invoke(req.message)
    return {"reply" : response.content}
// const express = require("express");
// const mysql = require("mysql2");
// const cors = require("cors");
require("dotenv").config();


// // Geuss the win percent
// const { GoogleGenerativeAI } = require("@google/generative-ai");
// const genAI = new GoogleGenerativeAI("AIzaSyA0zQIDnpDiMPrytEDSpuQ0roV6XznS0k8");

// const model = genAI.getGenerativeModel({
//   model: "gemini-2.5-flash"
// });


// async function TryAsking(){
//   try {
//     console.log("????");
//     const result = await model.generateContent("NBA: Guess the win percent of Lakers vs OKC");

//     const text = result.response.text();

//     console.log(text);ss
//     // res.send(text);
//   } catch (err){
//     console.log(err);
    
//   }

// }

// TryAsking();
// sadasd
const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_KEY});

async function main() {
  const chatCompletion = await getGroqChatCompletion();
  // Print the completion returned by the LLM.
  console.log(chatCompletion.choices[0]?.message?.content || "");
}

async function getGroqChatCompletion() {
  return groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content: "Explain the importance of fast language models",
      },
    ],
    model: "openai/gpt-oss-20b",
  });
}

main();
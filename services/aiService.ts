/*
=========================================================
FILE: services/aiService.ts
LOCATION: ROOT → services → aiService.ts

PURPOSE:
This file sends requests from the React Native app
to your backend AI server running on port 3000.

Instead of curl, your app will call this function.
=========================================================
*/

export async function askAI(userMessage: string) {

    try {
  
      /*
      ============================================
      Send POST request to backend AI server
      ============================================
      */
  
      const response = await fetch("http://localhost:3000/ai", {
  
        method: "POST",
  
        headers: {
          "Content-Type": "application/json"
        },
  
        body: JSON.stringify({
          message: userMessage
        })
  
      })
  
      /*
      ============================================
      Convert server response to JSON
      ============================================
      */
  
      const data = await response.json()
  
      return data
  
    } catch (error) {
  
      console.error("AI request failed:", error)
  
      return {
        success: false,
        error: "AI request failed"
      }
  
    }
  
  }
// netlify/functions/scan.js

export const handler = async (event) => {
  // מוודאים שקיבלנו בקשת POST עם נתונים
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    // מקבלים את התמונה מהאפליקציה (Frontend)
    const { imageBase64, mimeType } = JSON.parse(event.body);
    
    // כאן הקסם: אנחנו מושכים את המפתח מתוך "משתני הסביבה" המאובטחים של Netlify!
    // המפתח לא כתוב כאן בקוד, אז אף אחד לא יכול לגנוב אותו.
    const API_KEY = process.env.GEMINI_API_KEY; 

    if (!API_KEY) {
      return { statusCode: 500, body: JSON.stringify({ error: "API Key is missing on the server" }) };
    }

    // הפרומפט המעודכן - בלי חיפוש חברות אשראי, רק פרטי קשר וזיהוי של הליד
    const promptText = `
      Analyze this Hebrew/English receipt or invoice. 
      Return ONLY a valid JSON object with these exact keys:
      - 'businessName' (string, the name of the business)
      - 'businessId' (string, look for ח.פ, עוסק מורשה, or ע.מ. Return exactly as written, preserving any leading zeros)
      - 'phone' (string, the business phone number, if exists, else null)
      - 'date' (string, format DD/MM/YYYY)
      
      Do not include any other text or markdown formatting like \`\`\`json.
    `;

    // שולחים בקשה לגוגל
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: promptText },
            { inlineData: { data: imageBase64, mimeType: mimeType } }
          ]
        }]
      })
    });

    const data = await response.json();

    if (response.ok) {
      const rawText = data.candidates[0].content.parts[0].text;
      const cleanJsonString = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedData = JSON.parse(cleanJsonString);
      
      // מחזירים את התשובה המוצלחת חזרה לאפליקציה
      return {
        statusCode: 200,
        body: JSON.stringify(parsedData)
      };
    } else {
      return { statusCode: response.status, body: JSON.stringify(data) };
    }

  } catch (error) {
    console.error("Server error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to process the receipt on the server." })
    };
  }
};
import React, { useState } from 'react';
import './App.css';

export default function App() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [isSending, setIsSending] = useState<boolean>(false);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setExtractedData(null); 
    }
  };

  const handleScan = async () => {
    if (!imageFile) return;
    setIsScanning(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        
        const response = await fetch('/.netlify/functions/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64Data,
            mimeType: imageFile.type
          })
        });

        const data = await response.json();

        if (response.ok) {
          setExtractedData(data);
        } else {
          alert("שגיאה מהשרת: " + (data.error || "לא ניתן לפענח את הקבלה"));
        }
        setIsScanning(false);
      };
      reader.readAsDataURL(imageFile);
    } catch (error) {
      console.error("שגיאת תקשורת:", error);
      alert("לא הצלחנו להתחבר לשרת.");
      setIsScanning(false);
    }
  };

  const handleSendToSystem = async () => {
    setIsSending(true);
    try {
      const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbz47gYaqggN0HVOSQ5e8eDHjh2ivLGNjQHpt76UywC0Bpa48aTZgsm0QY5rUag3Hbs/exec"; 
   
      const payload = JSON.stringify({
        businessName: extractedData.businessName || "",
        businessId: extractedData.businessId || "",
        phone: extractedData.phone || "",
        date: extractedData.date || "",
        moreInfo: "דיווח מהאפליקציה"
      });

      await fetch(WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors', 
        body: payload
      });

      alert("✅ הדיווח נשלח! בדוק עכשיו את הגיליון.");
      setExtractedData(null);

    } catch (error) {
      console.error("Fetch Error:", error);
      alert("❌ תקלה בשליחה. בדוק את ה-Console.");
    } finally {
      setIsSending(false);
    }
  };

      alert("✅ הדיווח נשלח! בדוק עכשיו את הגיליון.");
      setExtractedData(null);

    } catch (error) {
      console.error("Fetch Error:", error);
      alert("❌ תקלה בשליחה. בדוק את ה-Console.");
    } finally {
      setIsSending(false);
    };
  

  return (
    <div style={{ fontFamily: 'system-ui', padding: '20px', maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
      <h2 style={{ color: '#003580' }}>סורק קבלות Amex 💳</h2>
      <p style={{ fontSize: '0.9rem', color: '#555' }}>
        העסק לא מכבד אמריקן אקספרס? <br/>
        צלם את הקבלה ואנחנו נטפל בזה.
      </p>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', margin: '20px 0' }}>
        
        {/* כפתור צילום במצלמה */}
        <label style={{
          backgroundColor: '#0070d1',
          color: 'white',
          padding: '12px 15px',
          borderRadius: '8px',
          cursor: 'pointer',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '5px',
          fontWeight: 'bold'
        }}>
          <span>📸 צלם קבלה</span>
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            onChange={handleImageChange} 
            style={{ display: 'none' }} 
          />
        </label>

        {/* כפתור בחירה מהגלריה */}
        <label style={{
          backgroundColor: '#f0f2f5',
          color: '#333',
          padding: '12px 15px',
          borderRadius: '8px',
          cursor: 'pointer',
          border: '1px solid #ccc',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '5px',
          fontWeight: 'bold'
        }}>
          <span>🖼️ מהגלריה</span>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleImageChange} 
            style={{ display: 'none' }} 
          />
        </label>
      </div>

      {previewUrl && (
        <div style={{ marginTop: '20px', border: '1px solid #ddd', padding: '15px', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
          <button 
            onClick={handleScan} 
            disabled={isScanning}
            style={{
              backgroundColor: isScanning ? '#ccc' : '#003580',
              color: 'white',
              padding: '12px 20px',
              border: 'none',
              borderRadius: '5px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: isScanning ? 'not-allowed' : 'pointer',
              marginBottom: '15px',
              width: '100%'
            }}
          >
            {isScanning ? 'מנתח נתוני עסק... ⏳' : '🔍 חלץ נתוני זיהוי'}
          </button>
          <img 
            src={previewUrl} 
            alt="קבלה שנסרקה" 
            style={{ width: '100%', borderRadius: '4px', maxHeight: '250px', objectFit: 'contain' }} 
          />
        </div>
      )}

      {extractedData && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e2f0fb', border: '1px solid #b6d4fe', borderRadius: '8px', color: '#084298', textAlign: 'right' }}>
          <h3 style={{ marginTop: 0 }}>📋 כרטיס עסק לטיפול:</h3>
          <p><strong>שם עסק:</strong> {extractedData.businessName || "לא זוהה"}</p>
          <p><strong>ח.פ / ע.מ:</strong> {extractedData.businessId || "לא זוהה"}</p>
          <p><strong>טלפון:</strong> {extractedData.phone || "לא זוהה"}</p>
          <p><strong>תאריך:</strong> {extractedData.date || "לא זוהה"}</p>
          
          <button 
            onClick={handleSendToSystem} 
            disabled={isSending}
            style={{
              backgroundColor: isSending ? '#ccc' : '#198754',
              color: 'white',
              padding: '12px 20px',
              border: 'none',
              borderRadius: '5px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: isSending ? 'not-allowed' : 'pointer',
              marginTop: '15px',
              width: '100%'
            }}
          >
            {isSending ? 'משגר ליד... 🚀' : '📤 דווח על העסק'}
          </button>
        </div>
      )}
    </div>
  );
}
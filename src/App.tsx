import React, { useState } from 'react';
import './App.css';

export default function App() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [extractedData, setExtractedData] = useState<any>(null);

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
      // 1. קוראים את התמונה לפורמט Base64
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        
        // 2. שולחים את התמונה ל-Netlify Function שלנו במקום לגוגל!
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
          setExtractedData(data); // הנתונים הנקיים חוזרים מהשרת שלנו
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

  return (
    <div style={{ fontFamily: 'system-ui', padding: '20px', maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
      <h2>סורק קבלות לעסקים 🏢</h2>
      <p>לזיהוי ואיסוף לידים מקבלות</p>

      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        onChange={handleImageChange} 
        style={{ margin: '20px 0', padding: '10px' }}
      />

      {previewUrl && (
        <div style={{ marginTop: '20px', border: '1px solid #ddd', padding: '15px', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
          
          <button 
            onClick={handleScan} 
            disabled={isScanning}
            style={{
              backgroundColor: isScanning ? '#ccc' : '#007BFF',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '5px',
              fontSize: '16px',
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
            style={{ width: '100%', borderRadius: '4px', maxHeight: '300px', objectFit: 'contain' }} 
          />
        </div>
      )}

      {extractedData && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e2f0fb', border: '1px solid #b6d4fe', borderRadius: '8px', color: '#084298', textAlign: 'right' }}>
          <h3 style={{ marginTop: 0 }}>📋 כרטיס עסק:</h3>
          <p><strong>שם עסק:</strong> {extractedData.businessName || "לא זוהה"}</p>
          <p><strong>ח.פ / ע.מ:</strong> {extractedData.businessId || "לא זוהה"}</p>
          <p><strong>טלפון:</strong> {extractedData.phone || "לא זוהה"}</p>
          <p><strong>תאריך:</strong> {extractedData.date || "לא זוהה"}</p>
          <hr style={{ borderColor: '#b6d4fe', margin: '10px 0' }}/>
          <p><strong>חברה סולקת:</strong> {extractedData.clearingCompany || "לא מופיע בקבלה"}</p>
          <p><strong>סוג כרטיס:</strong> {extractedData.cardType || "לא מופיע בקבלה"}</p>
        </div>
      )}
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import './App.css';

const COLORS = {
  primaryBlue: '#001739',
  brandBlue: '#0070d1',
  accentGold: '#D4AF37',
  buttonAccept: '#198754',
  buttonReject: '#dc3545',
};

type UI_STAGE = 'IDLE' | 'SCANNING' | 'SCANNED_CONFIRMING' | 'REJECTED_OPTIONS' | 'ACCEPTED_ADDING_COMMENT' | 'SENDING' | 'DONE';

export default function App() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [businessData, setBusinessData] = useState({ businessName: '', businessId: '', phone: '', date: '' });
  const [uiStage, setUiStage] = useState<UI_STAGE>('IDLE');
  const [userComment, setUserComment] = useState<string>('');
  
  useEffect(() => {
    if (imageFile) handleAutoScan();
  }, [imageFile]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setImageFile(event.target.files[0]);
      setBusinessData({ businessName: '', businessId: '', phone: '', date: '' });
      setUserComment('');
    }
  };

  const handleAutoScan = async () => {
    if (!imageFile) return;
    setUiStage('SCANNING');
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        const response = await fetch('/.netlify/functions/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64Data, mimeType: imageFile.type })
        });
        const data = await response.json();
        if (response.ok) {
          setBusinessData({ businessName: data.businessName || '', businessId: data.businessId || '', phone: data.phone || '', date: data.date || '' });
          setUiStage('SCANNED_CONFIRMING');
        } else {
          alert("לא הצלחנו לפענח אוטומטית. נסה שוב.");
          handleReset();
        }
      };
      reader.readAsDataURL(imageFile);
    } catch (error) {
      alert("שגיאת תקשורת.");
      setUiStage('IDLE');
    }
  };

  const handleSendToSystem = async (finalComment: string) => {
    setUiStage('SENDING');
    try {
      const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbz47gYaqggN0HVOSQ5e8eDHjh2ivLGNjQHpt76UywC0Bpa48aTZgsm0QY5rUag3Hbs/exec"; 
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors', 
        body: JSON.stringify({ ...businessData, moreInfo: finalComment || "דיווח מהיר" })
      });
      setUiStage('DONE');
    } catch (error) {
      alert("תקלה בשליחה.");
      setUiStage('SCANNED_CONFIRMING');
    }
  };

  const handleReset = () => {
    setImageFile(null);
    setBusinessData({ businessName: '', businessId: '', phone: '', date: '' });
    setUserComment('');
    setUiStage('IDLE');
  };

  // אנימציה פשוטה שנוסיף ב-inline style
  const pulseKeyframes = `
    @keyframes pulse {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.2); opacity: 0.7; }
      100% { transform: scale(1); opacity: 1; }
    }
  `;

  const commonContainerStyle: React.CSSProperties = {
    backgroundColor: 'rgba(0, 23, 57, 0.92)', padding: '30px', borderRadius: '24px', 
    boxShadow: '0 15px 50px rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)'
  };

  return (
    <div style={{ 
      fontFamily: '-apple-system, system-ui, sans-serif', padding: '20px', maxWidth: '450px', margin: '0 auto', 
      textAlign: 'center', direction: 'rtl', minHeight: '100vh',
      backgroundImage: 'url("https://www.americanexpress.com/content/dam/amex/us/campaigns/delta/Delta-A330-Clouds-Optimized-1.jpg")',
      backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed',
    }}>
      <style>{pulseKeyframes}</style>
      
      <div style={commonContainerStyle}>
        <h2 style={{ color: '#fff', borderBottom: '2px solid #D4AF37', paddingBottom: '10px', marginBottom: '20px' }}>דיווח בתי עסק 💳</h2>
        
        {uiStage === 'IDLE' && (
          <div>
            <p style={{ color: '#eee', marginBottom: '25px' }}>העסק לא מכבד אמריקן אקספרס? <br/>העלה קבלה ונבדוק את זה.</p>
            <div style={{ display: 'flex', gap: '15px' }}>
              <label style={{ padding: '15px', borderRadius: '12px', border: '2px solid #D4AF37', backgroundColor: '#fff', color: COLORS.primaryBlue, fontWeight: 'bold', cursor: 'pointer', flex: 1 }}>
                <span>📸 צילום</span>
                <input type="file" accept="image/*" capture="environment" onChange={handleImageChange} style={{ display: 'none' }} />
              </label>
              <label style={{ padding: '15px', borderRadius: '12px', border: '2px solid #D4AF37', backgroundColor: '#fff', color: COLORS.primaryBlue, fontWeight: 'bold', cursor: 'pointer', flex: 1 }}>
                <span>🖼️ גלריה</span>
                <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
              </label>
            </div>
          </div>
        )}

        {uiStage === 'SCANNING' && (
          <div style={{ padding: '20px' }}>
            <div style={{ fontSize: '3rem', animation: 'pulse 1.5s infinite' }}>🔍</div>
            <p style={{ color: '#D4AF37', marginTop: '15px', fontWeight: 'bold' }}>מנתחים את הקבלה בטיסת בזק...</p>
          </div>
        )}

        {uiStage === 'SCANNED_CONFIRMING' && (
          <div>
            <p style={{ color: '#fff', fontWeight: 'bold' }}>האם הפרטים נכונים?</p>
            <div style={{ textAlign: 'right', backgroundColor: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '12px', margin: '15px 0', border: '1px solid rgba(212,175,55,0.4)', color: '#fff' }}>
              <p><strong>עסק:</strong> {businessData.businessName || "לא זוהה"}</p>
              <p><strong>ח.פ:</strong> {businessData.businessId || "לא זוהה"}</p>
              <p><strong>טל:</strong> {businessData.phone || "לא זוהה"}</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setUiStage('ACCEPTED_ADDING_COMMENT')} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: COLORS.buttonAccept, color: '#fff', fontWeight: 'bold' }}>👍 כן</button>
              <button onClick={() => setUiStage('REJECTED_OPTIONS')} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: COLORS.buttonReject, color: '#fff', fontWeight: 'bold' }}>👎 לא</button>
            </div>
          </div>
        )}

        {uiStage === 'REJECTED_OPTIONS' && (
          <div>
            <p style={{ color: '#fff', marginBottom: '15px' }}>איך תרצה להמשיך?</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <label style={{ flex: 1, padding: '10px', borderRadius: '10px', backgroundColor: '#fff', color: COLORS.primaryBlue, fontWeight: 'bold', cursor: 'pointer', border: '1px solid #D4AF37' }}>
                <span>📸 צילום חוזר</span>
                <input type="file" accept="image/*" capture="environment" onChange={handleImageChange} style={{ display: 'none' }} />
              </label>
              <button onClick={() => setUiStage('ACCEPTED_ADDING_COMMENT')} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: COLORS.brandBlue, color: '#fff', fontWeight: 'bold' }}>📝 דווח בכל זאת</button>
            </div>
          </div>
        )}

        {uiStage === 'ACCEPTED_ADDING_COMMENT' && (
          <div>
            <p style={{ color: '#fff' }}>רוצה להוסיף הערה?</p>
            <textarea value={userComment} onChange={(e) => setUserComment(e.target.value)} placeholder="למשל: ביקשו מינימום סליקה..." style={{ width: '100%', borderRadius: '10px', padding: '10px', marginTop: '10px', height: '80px', border: 'none', textAlign: 'right' }} />
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button onClick={() => handleSendToSystem(userComment)} style={{ flex: 1, padding: '12px', borderRadius: '10px', backgroundColor: COLORS.buttonAccept, color: '#fff', fontWeight: 'bold', border: 'none' }}>📤 שלח דיווח</button>
              <button onClick={() => handleSendToSystem("")} style={{ flex: 1, padding: '12px', borderRadius: '10px', backgroundColor: 'transparent', color: '#ccc', border: '1px solid #ccc' }}>דלג ושלח</button>
            </div>
          </div>
        )}

        {uiStage === 'SENDING' && (
          <div style={{ padding: '20px' }}>
            <div style={{ fontSize: '3rem', animation: 'pulse 1.5s infinite' }}>🚀</div>
            <p style={{ color: '#D4AF37', marginTop: '15px' }}>שולח את הדיווח לאמקס...</p>
          </div>
        )}

        {uiStage === 'DONE' && (
          <div>
            <p style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 'bold' }}>✅ הדיווח התקבל!</p>
            <button onClick={handleReset} style={{ marginTop: '20px', padding: '10px 20px', borderRadius: '10px', border: '2px solid #D4AF37', backgroundColor: '#fff', color: COLORS.primaryBlue, fontWeight: 'bold' }}>דווח על עסק נוסף</button>
          </div>
        )}
      </div>
    </div>
  );
}
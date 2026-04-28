import React, { useState, useEffect } from 'react';
import './App.css';

const COLORS = {
  background: '#fff',
  primaryBlue: '#001739',
  brandBlue: '#0070d1',
  accentGold: '#D4AF37',
  textPrimary: '#333',
  textSecondary: '#666',
  buttonAccept: '#198754',
  buttonReject: '#dc3545',
};

type UI_STAGE = 
  | 'IDLE' 
  | 'SCANNING' 
  | 'SCANNED_CONFIRMING' 
  | 'REJECTED_OPTIONS' 
  | 'ACCEPTED_ADDING_COMMENT' 
  | 'SENDING' 
  | 'DONE';

export default function App() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [businessData, setBusinessData] = useState({ businessName: '', businessId: '', phone: '', date: '' });
  const [uiStage, setUiStage] = useState<UI_STAGE>('IDLE');
  const [userComment, setUserComment] = useState<string>('');
  
  useEffect(() => {
    if (imageFile) {
      handleAutoScan();
    }
  }, [imageFile]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setImageFile(file);
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
          setBusinessData({
            businessName: data.businessName || '',
            businessId: data.businessId || '',
            phone: data.phone || '',
            date: data.date || '',
          });
          setUiStage('SCANNED_CONFIRMING');
        } else {
          alert("לא הצלחנו לפענח את הקבלה באופן אוטומטי. אנא נסה שוב עם תמונה ברורה יותר.");
          handleReset();
        }
      };
      reader.readAsDataURL(imageFile);
    } catch (error) {
      console.error("Scan error:", error);
      alert("שגיאת תקשורת. נסה שוב.");
      setUiStage('IDLE');
    }
  };

  const handleSendToSystem = async (finalComment: string) => {
    setUiStage('SENDING');
    try {
      const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbz47gYaqggN0HVOSQ5e8eDHjh2ivLGNjQHpt76UywC0Bpa48aTZgsm0QY5rUag3Hbs/exec"; 
      
      const payload = {
        ...businessData,
        moreInfo: finalComment || "דיווח מהיר ללא הערה"
      };

      await fetch(WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors', 
        body: JSON.stringify(payload)
      });

      setUiStage('DONE');
    } catch (error) {
      alert("❌ תקלה בשליחה. נסה שוב.");
      setUiStage('SCANNED_CONFIRMING');
    }
  };

  const handleReset = () => {
    setImageFile(null);
    setBusinessData({ businessName: '', businessId: '', phone: '', date: '' });
    setUserComment('');
    setUiStage('IDLE');
  };

  const headerStyle = { color: '#fff', borderBottom: '2px solid #D4AF37', paddingBottom: '10px', margin: '0 0 15px 0', fontSize: '1.4rem' };
  const choiceButtonStyle = { padding: '15px', borderRadius: '12px', border: '2px solid #D4AF37', backgroundColor: '#fff', color: COLORS.primaryBlue, fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', flex: 1 };
  const dialogButtonStyle = { padding: '12px 20px', borderRadius: '10px', border: 'none', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', margin: '5px', flex: 1, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' };

  return (
    <div style={{ 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', 
      padding: '20px', maxWidth: '450px', margin: '0 auto', textAlign: 'center', 
      direction: 'rtl', minHeight: '100vh',
      backgroundImage: 'url("https://www.americanexpress.com/content/dam/amex/us/campaigns/delta/Delta-A330-Clouds-Optimized-1.jpg")',
      backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed',
    }}>
      
      <div style={{ backgroundColor: 'rgba(0, 23, 57, 0.9)', padding: '25px', borderRadius: '20px', boxShadow: '0 10px 40px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
        
        <h2 style={headerStyle}>דיווח בתי עסק 💳</h2>
        
        {uiStage === 'IDLE' && (
          <div>
            <p style={{ color: '#eee', fontWeight: 500, fontSize: '1.1rem', marginBottom: '25px' }}>
              העסק לא מכבד אמריקן אקספרס? <br/>
              <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>העלה קבלה ואנחנו נטפל בשאר.</span>
            </p>
            <div style={{ display: 'flex', gap: '15px' }}>
              <label style={choiceButtonStyle}>
                <span>📸 צילום קבלה</span>
                <input type="file" accept="image/*" capture="environment" onChange={handleImageChange} style={{ display: 'none' }} />
              </label>
              <label style={{...choiceButtonStyle, color: '#D4AF37'}}>
                <span>🖼️ מהגלריה</span>
                <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
              </label>
            </div>
          </div>
        )}

        {uiStage === 'SCANNING' && (
          <div>
            <p style={{ color: '#ccc' }}>מנתחים את פרטי העסק... ⚡</p>
            <div style={{ marginTop: '15px', color: '#D4AF37', fontSize: '1.5rem' }}>• • •</div>
          </div>
        )}

        {uiStage === 'SCANNED_CONFIRMING' && (
          <div>
            <p style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.1rem' }}>האם פרטי העסק נכונים?</p>
            <div style={{ textAlign: 'right', backgroundColor: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '12px', margin: '15px 0', border: '1px solid rgba(212,175,55,0.4)' }}>
              <p style={{ margin: '0 0 8px 0', color: '#fff' }}><strong>שם עסק:</strong> {businessData.businessName || "לא זוהה"}</p>
              <p style={{ margin: '0 0 8px 0', color: '#fff' }}><strong>ח.פ / ע.מ:</strong> {businessData.businessId || "לא זוהה"}</p>
              <p style={{ margin: '0', color: '#fff' }}><strong>טלפון:</strong> {businessData.phone || "לא זוהה"}</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setUiStage('ACCEPTED_ADDING_COMMENT')} style={{...dialogButtonStyle, backgroundColor: COLORS.buttonAccept, color: '#fff'}}>👍 כן</button>
              <button onClick={() => setUiStage('REJECTED_OPTIONS')} style={{...dialogButtonStyle, backgroundColor: COLORS.buttonReject, color: '#fff'}}>👎 לא</button>
            </div>
          </div>
        )}

        {uiStage === 'REJECTED_OPTIONS' && (
          <div>
            <p style={{ color: '#fff', fontWeight: 'bold' }}>מה תרצה לעשות?</p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <label style={choiceButtonStyle}>
                <span>📸 צילום מחדש</span>
                <input type="file" accept="image/*" capture="environment" onChange={handleImageChange} style={{ display: 'none' }} />
              </label>
              <button onClick={() => setUiStage('ACCEPTED_ADDING_COMMENT')} style={{...dialogButtonStyle, backgroundColor: COLORS.brandBlue, color: '#fff'}}>📝 דווח עם הערה</button>
            </div>
          </div>
        )}

        {uiStage === 'ACCEPTED_ADDING_COMMENT' && (
          <div>
            <p style={{ color: '#fff', fontWeight: 'bold' }}>תרצה להוסיף פרטים שפספסנו?</p>
            <textarea 
              value={userComment} 
              onChange={(e) => setUserComment(e.target.value)} 
              placeholder="למשל: ביקשו מינימום סליקה, אמרו שהמכשיר מקולקל..."
              style={{
                width: '100%', borderRadius: '10px', padding: '12px', boxSizing: 'border-box', 
                height: '100px', marginTop: '15px', textAlign: 'right', direction: 'rtl', border: 'none'
              }}
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => handleSendToSystem(userComment)} style={{...dialogButtonStyle, backgroundColor: COLORS.buttonAccept, color: '#fff'}}>📤 שלח דיווח</button>
              <button onClick={() => handleSendToSystem("")} style={{...dialogButtonStyle, backgroundColor: 'transparent', color: '#ccc', border: '1px solid #ccc'}}>דלג ושלח</button>
            </div>
          </div>
        )}

        {uiStage === 'SENDING' && (
          <div style={{ color: '#fff' }}>
            <p>שולח נתונים לאמריקן אקספרס... 🚀</p>
            <div style={{ color: '#D4AF37', fontSize: '1.5rem' }}>• • •</div>
          </div>
        )}

        {uiStage === 'DONE' && (
          <div>
            <p style={{ color: '#fff', fontSize: '1.3rem', fontWeight: 'bold' }}>✅ הדיווח התקבל בהצלחה!</p>
            <p style={{ color: '#ccc', marginTop: '10px' }}>תודה שעזרת לנו לשפר את חוויית הסליקה.</p>
            <button onClick={handleReset} style={{...choiceButtonStyle, marginTop: '25px', maxWidth: '200px'}}>דווח על עסק נוסף</button>
          </div>
        )}

        <footer style={{ marginTop: '30px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
          מידע זה מועבר לטיפול צוות קשרי עסקים • אבטחת מידע בתקן מחמיר
        </footer>
      </div>
    </div>
  );
}
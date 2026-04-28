import React, { useState, useEffect } from 'react';
import './App.css';

// פלטת צבעים יוקרתית (Amex Premium Blue)
const COLORS = {
  background: '#fff',
  primaryBlue: '#001739', // כחול עמוק מאוד, יוקרתי
  brandBlue: '#0070d1', // כחול אמקס
  accentGold: '#D4AF37', // זהב עדין
  textPrimary: '#333',
  textSecondary: '#666',
  buttonAccept: '#198754', // ירוק שליחה
  buttonReject: '#dc3545', // אדום דחייה
};

// הגדרת המצבים של חלון הדיאלוג (State Machine)
type UI_STAGE = 
  | 'IDLE'                   // מחכה להעלאת תמונה
  | 'SCANNING'               // מנתח אוטומטית
  | 'SCANNED_CONFIRMING'     // מציג תוצאות ושואל "האם נכון?"
  | 'REJECTED_OPTIONS'       // המשתמש אמר "לא נכון", מציג אפשרויות
  | 'ACCEPTED_ADDING_COMMENT' // המשתמש אמר "כן נכון", שואל על הערה
  | 'SENDING'                // משגר נתונים
  | 'DONE';                  // סיום

export default function App() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // נתוני העסק שחולצו
  const [businessData, setBusinessData] = useState({ businessName: '', businessId: '', phone: '', date: '' });
  
  // משתנים למצב הממשק וההערה
  const [uiStage, setUiStage] = useState<UI_STAGE>('IDLE');
  const [userComment, setUserComment] = useState<string>('');
  
  // ה-Effect שגורם לפיענוח אוטומטי (Zero-Friction)
  useEffect(() => {
    if (imageFile) {
      handleAutoScan();
    }
  }, [imageFile]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setBusinessData({ businessName: '', businessId: '', phone: '', date: '' });
      setUserComment('');
    }
  };

  // הפונקציה שנקראת אוטומטית
  const handleAutoScan = async () => {
    if (!imageFile) return;
    setUiStage('SCANNING');

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        
        // שליחה לפונקציית השרת (מפתח מוסתר)
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
          setUiStage('SCANNED_CONFIRMING'); // מעבר אוטומטי לשלב הבא
        } else {
          // טיפול בכשלון פיענוח - נחזיר למצב IDLE
          alert("לא הצלחנו לפענח את הקבלה באופן אוטומטי. אנא נסה שוב עם תמונה ברורה יותר.");
          setUiStage('IDLE');
          setImageFile(null);
          setPreviewUrl(null);
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
      // וודא שזה הלינק המעודכן שלך מגוגל!
      const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbyC62N4Q-Yl5eFq9n8mX-Z-o-p7E_Ld_m-N_G_T_A/exec"; 
      
      const payload = {
        ...businessData,
        moreInfo: finalComment, // הערת המשתמש שנאספה
        reportType: finalComment ? 'Comment' : 'Quick Report'
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

  // פונקציות לאיפוס מלא
  const handleReset = () => {
    setImageFile(null);
    setPreviewUrl(null);
    setBusinessData({ businessName: '', businessId: '', phone: '', date: '' });
    setUserComment('');
    setUiStage('IDLE');
  };

  // --- סגנונות CSS ייחודיים (לא מלאכותיים) ---
  const headerStyle = {
    color: '#fff',
    borderBottom: '2px solid #D4AF37', // זהב עדין
    paddingBottom: '10px',
    margin: '0 0 15px 0',
    fontSize: '1.4rem',
  };

  const choiceButtonStyle = {
    padding: '15px',
    borderRadius: '12px',
    border: '2px solid #D4AF37', // זהב עדין
    backgroundColor: '#fff',
    color: COLORS.primaryBlue,
    fontSize: '1.1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    flex: 1,
    transition: 'all 0.2s',
  };

  const dialogButtonStyle = {
    padding: '12px 20px',
    borderRadius: '10px',
    border: 'none',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    margin: '5px',
    flex: 1,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  };

  return (
    // תמונת רקע יוקרתית (עננים ומטוס)
    <div style={{ 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', 
      padding: '20px', maxWidth: '450px', margin: '0 auto', textAlign: 'center', 
      direction: 'rtl', minHeight: '100vh',
      backgroundImage: 'url("https://www.americanexpress.com/content/dam/amex/us/campaigns/delta/Delta-A330-Clouds-Optimized-1.jpg")', // תמונה רשמית (להחלפה)
      backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed',
    }}>
      
      {/* שכבת overlay כחולה עמוקה (נותנת סמכות ומסתירה רקע מסיח) */}
      <div style={{ backgroundColor: 'rgba(0, 23, 57, 0.9)', padding: '20px', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
        
        <h2 style={headerStyle}>דיווח בתי עסק 💳</h2>
        
        {/* --- שלב 1: מחכה להעלאת תמונה --- */}
        {uiStage === 'IDLE' && (
          <div>
            <p style={{ color: '#ccc', fontWeight: 500 }}>העסק לא מכבד אמריקן אקספרס? <br/>צלם או בחר את הקבלה לדיווח:</p>
            <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
              <label style={choiceButtonStyle}>
                <span>📸 צילום</span>
                <input type="file" accept="image/*" capture="environment" onChange={handleImageChange} style={{ display: 'none' }} />
              </label>
              <label style={{...choiceButtonStyle, color: '#D4AF37'}}>
                <span>🖼️ גלריה</span>
                <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
              </label>
            </div>
          </div>
        )}

        {/* --- שלב 2: פיענוח אוטומטי --- */}
        {uiStage === 'SCANNING' && previewUrl && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#ccc' }}>אנחנו מנתחים את הקבלה בטיסת בזק... ⚡</p>
            <img src={previewUrl} style={{ width: '100%', borderRadius: '10px', maxHeight: '200px', objectFit: 'contain', marginTop: '10px' }} />
            <div style={{ marginTop: '15px', color: '#D4AF37', fontSize: '1.2rem', animation: 'blink 1s infinite' }}>
              • • •
            </div>
          </div>
        )}

        {/* --- שלב 3: פיענוח הצליח - הצגת הפרטים ושאלת אישור --- */}
        {uiStage === 'SCANNED_CONFIRMING' && (
          <div>
            <p style={{ color: '#ccc', fontWeight: 'bold' }}>הפרטים האלו נכונים?</p>
            
            {/* הצגת הפרטים כטקסט נקי, לא בתיבות טופס */}
            <div style={{ textAlign: 'right', backgroundColor: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '10px', margin: '15px 0', border: '1px solid rgba(212,175,55,0.3)' }}>
              <p style={{ margin: '0 0 5px 0', color: '#fff' }}><strong>שם עסק:</strong> {businessData.businessName || "לא זוהה"}</p>
              <p style={{ margin: '0 0 5px 0', color: '#fff' }}><strong>ח.פ / ע.מ:</strong> {businessData.businessId || "לא זוהה"}</p>
              <p style={{ margin: '0 0 5px 0', color: '#fff' }}><strong>טלפון:</strong> {businessData.phone || "לא זוהה"}</p>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button onClick={() => setUiStage('ACCEPTED_ADDING_COMMENT')} style={{...dialogButtonStyle, backgroundColor: COLORS.buttonAccept, color: '#fff'}}>👍 כן, נכונים</button>
              <button onClick={() => setUiStage('REJECTED_OPTIONS')} style={{...dialogButtonStyle, backgroundColor: COLORS.buttonReject, color: '#fff'}}>👎 לא, יש טעות</button>
            </div>
          </div>
        )}

        {/* --- שלב 4: המשתמש אמר "לא", מציג אפשרויות --- */}
        {uiStage === 'REJECTED_OPTIONS' && (
          <div>
            <p style={{ color: '#ccc', fontWeight: 'bold' }}>איך להתקדם?</p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <label style={{...choiceButtonStyle, flex: 1, color: COLORS.primaryBlue}}>
                <span>📸 צלם מחדש</span>
                <input type="file" accept="image/*" capture="environment" onChange={handleImageChange} style={{ display: 'none' }} />
              </label>
              <button onClick={() => setUiStage('ACCEPTED_ADDING_COMMENT')} style={{...dialogButtonStyle, backgroundColor: COLORS.brandBlue, color: '#fff'}}>📝 דווח והוסף הערה</button>
            </div>
          </div>
        )}

        {/* --- שלב 5: שואל על הערה (או ישירה משלב 3/4) --- */}
        {uiStage === 'ACCEPTED_ADDING_COMMENT' && (
          <div>
            <p style={{ color: '#ccc', fontWeight: 'bold' }}>תרצה להוסיף הערה אישית?</p>
            
            {/* תיבת טקסט ייעודית שמופיעה רק פה, עם פריסה אוטומטית לעברית */}
            <textarea 
              value={userComment} 
              onChange={(e) => setUserComment(e.target.value)} 
              placeholder="למשל: ביקשו מינימום 50 שח, המוכר היה ממש לא נחמד..."
              style={{
                width: '100%', borderRadius: '10px', border: '1px solid #ccc', padding: '10px', 
                boxSizing: 'border-box', fontFamily: 'inherit', height: '80px', marginTop: '10px',
                textAlign: 'right', direction: 'rtl', resize: 'none', backgroundColor: '#fff', color: COLORS.textPrimary
              }}
            />

            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button onClick={() => handleSendToSystem(userComment)} style={{...dialogButtonStyle, backgroundColor: COLORS.buttonAccept, color: '#fff'}}>
                📤 שלח דיווח לאמקס
              </button>
              <button onClick={handleReset} style={{...dialogButtonStyle, backgroundColor: 'transparent', color: '#ccc', border: '1px solid #ccc'}}>
                ביטול
              </button>
            </div>
          </div>
        )}

        {/* --- שלב 6: שליחה --- */}
        {uiStage === 'SENDING' && (
          <div style={{ color: '#fff' }}>
            <p>אנחנו שולחים את הליד החם... 🚀</p>
            <div style={{ color: '#D4AF37', fontSize: '1.2rem', animation: 'blink 1s infinite' }}>• • •</div>
          </div>
        )}

        {/* --- שלב 7: סיום מוצלח --- */}
        {uiStage === 'DONE' && (
          <div>
            <p style={{ color: '#fff', fontSize: '1.2rem' }}>✅ הדיווח התקבל!</p>
            <p style={{ color: '#ccc' }}>תודה על העזרה בשיפור השירות.</p>
            <button onClick={handleReset} style={{...choiceButtonStyle, marginTop: '15px', color: COLORS.primaryBlue}}>
              שלח דיווח נוסף
            </button>
          </div>
        )}

        <footer style={{ marginTop: '20px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', textAlign: 'right' }}>
          פרויקט קהילתי • כל המידע נשמר באופן מאובטח
        </footer>
      </div>
    </div>
  );
}
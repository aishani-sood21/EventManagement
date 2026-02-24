import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import api from '../utils/api';
import '../styles/Auth.css';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  
  const [formData, setFormData] = useState({
    email: '', password: '', firstName: '', lastName: '',
    contactNumber: '', type: 'IIIT', rollNumber: '', collegeName: ''
  });

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    
    try {
      // Get reCAPTCHA token
      const recaptchaToken = recaptchaRef.current?.getValue();
      
      if (!recaptchaToken) {
        setMsg('❌ Please complete the reCAPTCHA verification');
        return;
      }
      
      if (isLogin) {
        const res = await api.post('/auth/login', {
          email: formData.email,
          password: formData.password,
          recaptchaToken
        });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        
        // For participants: Check if they have set preferences
        if (res.data.user.role === 'participant') {
          try {
            const profileRes = await api.get('/user/profile');
            const hasInterests = profileRes.data.profile?.interests?.length > 0;
            const hasFollowing = profileRes.data.profile?.following?.length > 0;
            
            // If no preferences set, redirect to onboarding
            if (!hasInterests && !hasFollowing) {
              navigate('/onboarding');
              return;
            }
          } catch (err) {
            console.error('Error fetching profile:', err);
          }
        }
        
        navigate('/dashboard');
      } else {
        await api.post('/auth/register', { ...formData, recaptchaToken });
        setMsg('✅ Registration successful! Logging you in...');
        
        // Reset reCAPTCHA
        recaptchaRef.current?.reset();
        
        // Auto-login after registration
        setTimeout(async () => {
          try {
            const res = await api.post('/auth/login', {
              email: formData.email,
              password: formData.password
            });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            
            // Redirect to onboarding for participants
            if (res.data.user.role === 'participant') {
              navigate('/onboarding');
            } else {
              navigate('/dashboard');
            }
          } catch (err) {
            setMsg('✅ Registered! Please login manually.');
            setIsLogin(true);
          }
        }, 1000);
      }
    } catch (err: any) {
      setMsg('❌ ' + (err.response?.data?.message || err.message));
      // Reset reCAPTCHA on error
      recaptchaRef.current?.reset();
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">🎉</div>
          <h1 className="auth-title">Felicity Portal</h1>
          <p className="auth-subtitle">Welcome to India's Premier Tech-Cultural Fest</p>
        </div>

        <div className="auth-tabs">
          <button
            onClick={() => {
              setIsLogin(true);
              recaptchaRef.current?.reset();
            }}
            className={`auth-tab ${isLogin ? 'active' : ''}`}
          >
            Login
          </button>
          <button
            onClick={() => {
              setIsLogin(false);
              recaptchaRef.current?.reset();
            }}
            className={`auth-tab ${!isLogin ? 'active' : ''}`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              name="email"
              type="email"
              placeholder="your.email@example.com"
              className="form-input"
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              className="form-input"
              onChange={handleChange}
              required
            />
          </div>

          {!isLogin && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input 
                    name="firstName" 
                    placeholder="John" 
                    className="form-input" 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input 
                    name="lastName" 
                    placeholder="Doe" 
                    className="form-input" 
                    onChange={handleChange} 
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Contact Number</label>
                <input 
                  name="contactNumber" 
                  placeholder="+91 98765 43210" 
                  className="form-input" 
                  onChange={handleChange} 
                  required 
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Participant Type</label>
                <select 
                  name="type" 
                  className="form-select" 
                  onChange={handleChange}
                  value={formData.type}
                >
                  <option value="IIIT">IIIT Student</option>
                  <option value="Non-IIIT">Non-IIIT Participant</option>
                </select>
              </div>

              {formData.type === 'IIIT' ? (
                <div className="form-group">
                  <label className="form-label">Roll Number</label>
                  <input 
                    name="rollNumber" 
                    placeholder="2023XXXX" 
                    className="form-input" 
                    onChange={handleChange} 
                    required 
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">College / Organization</label>
                  <input 
                    name="collegeName" 
                    placeholder="IIT Delhi" 
                    className="form-input" 
                    onChange={handleChange} 
                    required 
                  />
                </div>
              )}
            </>
          )}

          {/* reCAPTCHA v2 Checkbox */}
          <div className="recaptcha-container">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'}
              theme="light"
            />
          </div>

          <button type="submit" className="auth-submit-btn">
            {isLogin ? 'Login' : 'Register'}
          </button>
        </form>

        {msg && (
          <div className={`auth-message ${msg.startsWith('✅') ? 'success' : 'error'}`}>
            {msg}
          </div>
        )}
      </div>
    </div>
  );
}
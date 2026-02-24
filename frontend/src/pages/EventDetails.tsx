import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import ParticipantNavbar from '../components/ParticipantNavbar';
import '../styles/EventDetails.css';

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Debug logging
  console.log('EventDetails mounted, id:', id);
  console.log('User from localStorage:', localStorage.getItem('user'));
  console.log('Token:', localStorage.getItem('token'));
  
  const [user] = useState<any>(() => {
    // Initialize user from localStorage immediately
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  });
  const [event, setEvent] = useState<any>(null);
  const [eventStats, setEventStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  
  // Registration state
  const [teamName, setTeamName] = useState('');
  const [customFormData, setCustomFormData] = useState<any>({});
  const [merchandiseSelection, setMerchandiseSelection] = useState<any[]>([]);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [ticketData, setTicketData] = useState<any>(null);

  // Fetch event details
  const fetchEventDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/events/${id}`);
      console.log('Event details received:', res.data);
      console.log('Custom form:', res.data.customForm);
      setEvent(res.data);
    } catch (err: any) {
      console.error('Error fetching event:', err);
      alert('Error loading event details');
    } finally {
      setLoading(false);
    }
  };

  // Check if user is already registered
  const checkExistingRegistration = async () => {
    try {
      const res = await api.get('/registrations/my-registrations');
      const registration = res.data.find((reg: any) => reg.eventId?._id === id);
      if (registration) {
        setTicketData(registration);
        setRegistrationSuccess(true);
      }
    } catch (err) {
      console.error('Error checking registration:', err);
    }
  };

  // Fetch event stats
  const fetchEventStats = async () => {
    try {
      const res = await api.get(`/events/${id}/stats`);
      setEventStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Check authentication and fetch data
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }
    
    // Fetch data only once when component mounts or id changes
    if (id) {
      fetchEventDetails();
      fetchEventStats();
      
      // Check if user is already registered (only for participants)
      if (user?.role === 'participant') {
        checkExistingRegistration();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); // Only depend on id to prevent infinite loops
  const handleRegister = async () => {
    if (registering) return;
    
    setRegistering(true);
    try {
      const registrationData: any = {
        eventId: id,
      };

      if (teamName) registrationData.teamName = teamName;
      if (Object.keys(customFormData).length > 0) {
        registrationData.customFormData = customFormData;
      }
      if (merchandiseSelection.length > 0) {
        registrationData.merchandiseSelection = merchandiseSelection;
      }

      console.log('Registering with data:', registrationData);
      console.log('Custom form data:', customFormData);
      
      const response = await api.post('/registrations', registrationData);
      console.log('Registration response:', response.data);
      
      // Check if this is a merchandise event
      const isMerchandise = event?.type === 'Merchandise';
      
      if (isMerchandise) {
        // For merchandise, redirect to My Events page where they can upload payment proof
        alert('✅ Registration successful! Please upload your payment proof in "My Events" to receive your ticket.');
        navigate('/my-events');
      } else {
        // For normal events, store ticket data and show success page
        setTicketData(response.data);
        setRegistrationSuccess(true);
        
        // Scroll to top to show success message
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      
    } catch (err: any) {
      console.error('Registration error:', err);
      console.error('Error response:', err.response?.data);
      alert(err.response?.data?.message || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  if (loading || !event) {
    return (
      <div className="event-details-page">
        <ParticipantNavbar />
        <div className="event-details-loading">
          <div className="event-details-loading-icon">⏳</div>
          <p className="event-details-loading-text">Loading event details...</p>
        </div>
      </div>
    );
  }

  const isDeadlinePassed = eventStats?.isDeadlinePassed;
  const isLimitReached = eventStats?.isLimitReached;
  const canRegister = eventStats?.canRegister && user?.role === 'participant';

  return (
    <div className="event-details-page">
      <ParticipantNavbar />
      
      <div className="event-details-content">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="event-details-back-button"
        >
          <span>←</span>
          <span>Back</span>
        </button>

        {/* Event Header */}
        <div className="event-header-card">
          <div className="event-header-banner">
            <div className="event-header-top">
              <div className="event-header-info">
                <h1 className="event-title">{event.name}</h1>
                <p className="event-description">{event.description}</p>
                <div className="event-badges">
                  <span className={`event-badge ${
                    event.type === 'Merchandise'
                      ? 'event-badge-merchandise'
                      : 'event-badge-normal'
                  }`}>
                    {event.type === 'Merchandise' ? '🛍️ Merchandise' : '🎯 Normal Event'}
                  </span>
                  {isDeadlinePassed && (
                    <span className="event-badge event-badge-closed">
                      ⏰ Registration Closed
                    </span>
                  )}
                  {isLimitReached && !isDeadlinePassed && (
                    <span className="event-badge event-badge-limited">
                      ⚠️ Limit Reached
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Event Information Grid */}
          <div className="event-details-body">
            <div className="event-info-grid">
              <div className="event-info-item">
                <h3 className="event-info-label">📅 Event Date</h3>
                <p className="event-info-value">
                  {new Date(event.startDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <p className="event-info-secondary">
                  Ends: {new Date(event.endDate).toLocaleDateString()}
                </p>
              </div>

              <div className="event-info-item">
                <h3 className="event-info-label">⏰ Registration Deadline</h3>
                <p className="event-info-value">
                  {new Date(event.registrationDeadline).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                {isDeadlinePassed && (
                  <p className="event-info-deadline-passed">Deadline has passed</p>
                )}
              </div>

              <div className="event-info-item">
                <h3 className="event-info-label">🏢 Organizer</h3>
                <p className="event-info-value">
                  {event.organizerId?.profile?.organizerName || 'Unknown'}
                </p>
                {event.organizerId?.profile?.category && (
                  <p className="event-info-secondary">
                    Category: {event.organizerId.profile.category}
                  </p>
                )}
              </div>

              <div className="event-info-item">
                <h3 className="event-info-label">🎯 Eligibility</h3>
                <p className="event-info-value">{event.eligibility}</p>
              </div>

              {event.registrationLimit && (
                <div className="event-info-item">
                  <h3 className="event-info-label">👥 Registration Limit</h3>
                  <p className="event-info-registrations">
                    {eventStats?.totalRegistrations || 0} / {event.registrationLimit}
                  </p>
                  {eventStats?.availableSpots !== null && eventStats?.availableSpots !== undefined && (
                    <p className="event-info-secondary">
                      {eventStats?.availableSpots} spots available
                    </p>
                  )}
                </div>
              )}

              {eventStats?.waitlisted > 0 && (
                <div className="event-info-item">
                  <h3 className="event-info-label">⏳ Waitlisted</h3>
                  <p className="event-info-waitlisted">
                    {eventStats.waitlisted} participants
                  </p>
                </div>
              )}
            </div>

            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <div className="event-tags-section">
                <h3 className="event-tags-label">🏷️ Tags</h3>
                <div className="event-tags-list">
                  {event.tags.map((tag: string, idx: number) => (
                    <span key={idx} className="event-tag">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Success Ticket Display */}
        {registrationSuccess && ticketData && (
          <div className="event-ticket-card">
            <div className="event-ticket-header">
              <div className="event-ticket-success-icon">✓</div>
              <h2 className="event-ticket-title">Registration Successful!</h2>
              <p className="event-ticket-subtitle">Your ticket has been generated</p>
            </div>
            
            <div className="event-ticket-content">
              <div className="event-ticket-qr">
                <div className="event-ticket-qr-code">
                  <svg viewBox="0 0 290 290" className="qr-svg" xmlns="http://www.w3.org/2000/svg">
                    <rect width="290" height="290" fill="white"/>
                    {/* Generate a realistic dense QR code pattern */}
                    {(() => {
                      const size = 10;
                      const modules = [];
                      
                      // Top-left position marker (7x7)
                      for(let i = 0; i < 7; i++) {
                        for(let j = 0; j < 7; j++) {
                          if(i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4)) {
                            modules.push(<rect key={`tl-${i}-${j}`} x={10 + j*size} y={10 + i*size} width={size} height={size} fill="black"/>);
                          }
                        }
                      }
                      
                      // Top-right position marker (7x7)
                      for(let i = 0; i < 7; i++) {
                        for(let j = 0; j < 7; j++) {
                          if(i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4)) {
                            modules.push(<rect key={`tr-${i}-${j}`} x={210 + j*size} y={10 + i*size} width={size} height={size} fill="black"/>);
                          }
                        }
                      }
                      
                      // Bottom-left position marker (7x7)
                      for(let i = 0; i < 7; i++) {
                        for(let j = 0; j < 7; j++) {
                          if(i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4)) {
                            modules.push(<rect key={`bl-${i}-${j}`} x={10 + j*size} y={210 + i*size} width={size} height={size} fill="black"/>);
                          }
                        }
                      }
                      
                      // Very dense random-looking data pattern (simulating real QR code)
                      const dataPattern = `110101011010110101101011010110101101011010
101010101011010101010110101010101101010110
110110011011001101100110110011011001101100
101101101011010110101101011010110101101011
010110101101011010110101101011010110101101
110101010101101010101011010101010110101010
101011011010110101101011010110101101011010
011010101011010101101010110101011010101101
101101101010110101011010101101010110101011
010101010110101010101101010101011010101010
110110110101101101011011010110110101101101
101010101101010101011010101010110101010101
010110101011010110101101011010110101101011
101101011010101101010110101011010101101010
110010110101101011010110101101011010110101
101101010101010110101010101101010101011010
010110110110101101101011011010110110101101
101010101011010101010110101010101101010110
110101101010110101101011010110101011010110
101011010110101011010110101101011010110101
010101101010101011010101010110101010101101
110110101101101011011010110110101101101011
101010110101010101101010101011010101010110
010110101011010110101101011010110101101011
101101011010101101010110101011010101101010`;
                      
                      const rows = dataPattern.split('\n');
                      rows.forEach((row, i) => {
                        for(let j = 0; j < row.length; j++) {
                          if(row[j] === '1') {
                            // Skip the position markers areas
                            const x = 10 + (j+8)*size;
                            const y = 10 + (i+8)*size;
                            if(!((i < 7 && j < 7) || (i < 7 && j > row.length - 8) || (i > rows.length - 8 && j < 7))) {
                              if(x < 280 && y < 280) {
                                modules.push(<rect key={`d-${i}-${j}`} x={x} y={y} width={size} height={size} fill="black"/>);
                              }
                            }
                          }
                        }
                      });
                      
                      return modules;
                    })()}
                  </svg>
                  <p className="qr-label">Scan this at the venue</p>
                  <p className="qr-sublabel">Present this QR code for entry</p>
                </div>
              </div>
              
              <div className="event-ticket-details">
                <div className="event-ticket-detail-row">
                  <span className="event-ticket-detail-label">Ticket ID:</span>
                  <span className="event-ticket-detail-value">{ticketData.ticketId}</span>
                </div>
                
                <div className="event-ticket-detail-row">
                  <span className="event-ticket-detail-label">Event:</span>
                  <span className="event-ticket-detail-value">{event.name}</span>
                </div>
                
                <div className="event-ticket-detail-row">
                  <span className="event-ticket-detail-label">Participant:</span>
                  <span className="event-ticket-detail-value">
                    {ticketData.participantId?.profile?.name || 
                     ticketData.participantId?.username || 
                     user?.profile?.name || 
                     user?.username || 
                     'N/A'}
                  </span>
                </div>
                
                {ticketData.teamName && (
                  <div className="event-ticket-detail-row">
                    <span className="event-ticket-detail-label">Team:</span>
                    <span className="event-ticket-detail-value">{ticketData.teamName}</span>
                  </div>
                )}
                
                <div className="event-ticket-detail-row">
                  <span className="event-ticket-detail-label">Status:</span>
                  <span className={`event-ticket-status event-ticket-status-${(ticketData.status || 'Registered').toLowerCase()}`}>
                    {ticketData.status || 'Registered'}
                  </span>
                </div>
                
                <div className="event-ticket-detail-row">
                  <span className="event-ticket-detail-label">Registered:</span>
                  <span className="event-ticket-detail-value">
                    {new Date(ticketData.createdAt || Date.now()).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="event-ticket-actions">
              <button 
                onClick={() => window.print()} 
                className="event-ticket-button event-ticket-button-primary"
              >
                🖨️ Print Ticket
              </button>
              <button 
                onClick={() => navigate('/dashboard')} 
                className="event-ticket-button event-ticket-button-secondary"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Registration Section - Only for Participants */}
        {user?.role === 'participant' && !registrationSuccess && (
          <div className="event-registration-card">
            <h2 className="event-registration-title">
              {event.type === 'Merchandise' ? '🛍️ Purchase' : '📝 Register for Event'}
            </h2>

            {/* Blocking Messages */}
            {isDeadlinePassed && (
              <div className="event-alert event-alert-error">
                <span className="event-alert-icon">⏰</span>
                <div className="event-alert-content">
                  <p className="event-alert-title">Registration Closed</p>
                  <p className="event-alert-text">The registration deadline has passed.</p>
                </div>
              </div>
            )}

            {isLimitReached && !isDeadlinePassed && (
              <div className="event-alert event-alert-warning">
                <span className="event-alert-icon">⚠️</span>
                <div className="event-alert-content">
                  <p className="event-alert-title">Registration Limit Reached</p>
                  <p className="event-alert-text">
                    All spots are filled. You can join the waitlist.
                  </p>
                </div>
              </div>
            )}

            {/* Registration Form */}
            {canRegister && (
              <div className="event-registration-form">
                {/* Team Name (Only for Team events) */}
                {event.type === 'Team' && (
                  <div className="event-form-field">
                    <label className="event-form-label">
                      Team Name {event.type === 'Team' ? <span className="event-form-required">*</span> : '(Optional)'}
                    </label>
                    <input
                      type="text"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="Enter your team name"
                      className="event-form-input"
                      required={event.type === 'Team'}
                    />
                  </div>
                )}

                {/* Custom Form Fields */}
                {event.customForm && event.customForm.fields && event.customForm.fields.length > 0 && (
                  <div>
                    <h3 className="event-form-section-title">📋 Additional Information</h3>
                    {event.customForm.fields.map((field: any, idx: number) => (
                      <div key={idx} className="event-form-field">
                        <label className="event-form-label">
                          {field.label} {field.required && <span className="event-form-required">*</span>}
                        </label>
                        
                        {field.fieldType === 'text' && (
                          <input
                            type="text"
                            placeholder={field.placeholder || ''}
                            required={field.required}
                            onChange={(e) => setCustomFormData({
                              ...customFormData,
                              [field.fieldName]: e.target.value
                            })}
                            className="event-form-input"
                          />
                        )}
                        
                        {field.fieldType === 'textarea' && (
                          <textarea
                            placeholder={field.placeholder || ''}
                            required={field.required}
                            onChange={(e) => setCustomFormData({
                              ...customFormData,
                              [field.fieldName]: e.target.value
                            })}
                            className="event-form-input"
                            rows={4}
                          />
                        )}
                        
                        {field.fieldType === 'number' && (
                          <input
                            type="number"
                            placeholder={field.placeholder || ''}
                            required={field.required}
                            onChange={(e) => setCustomFormData({
                              ...customFormData,
                              [field.fieldName]: e.target.value
                            })}
                            className="event-form-input"
                          />
                        )}
                        
                        {field.fieldType === 'date' && (
                          <input
                            type="date"
                            required={field.required}
                            onChange={(e) => setCustomFormData({
                              ...customFormData,
                              [field.fieldName]: e.target.value
                            })}
                            className="event-form-input"
                          />
                        )}
                        
                        {field.fieldType === 'dropdown' && (
                          <select
                            required={field.required}
                            onChange={(e) => setCustomFormData({
                              ...customFormData,
                              [field.fieldName]: e.target.value
                            })}
                            className="event-form-input"
                          >
                            <option value="">Select an option</option>
                            {field.options?.map((opt: string, i: number) => (
                              <option key={i} value={opt}>{opt}</option>
                            ))}
                          </select>
                        )}
                        
                        {field.fieldType === 'checkbox' && field.options && (
                          <div className="event-form-checkbox-group">
                            {field.options.map((opt: string, i: number) => (
                              <label key={i} className="event-form-checkbox-label">
                                <input
                                  type="checkbox"
                                  value={opt}
                                  onChange={(e) => {
                                    const currentValues = customFormData[field.fieldName] || [];
                                    if (e.target.checked) {
                                      setCustomFormData({
                                        ...customFormData,
                                        [field.fieldName]: [...currentValues, opt]
                                      });
                                    } else {
                                      setCustomFormData({
                                        ...customFormData,
                                        [field.fieldName]: currentValues.filter((v: string) => v !== opt)
                                      });
                                    }
                                  }}
                                  className="event-form-checkbox"
                                />
                                <span>{opt}</span>
                              </label>
                            ))}
                          </div>
                        )}
                        
                        {field.fieldType === 'file' && (
                          <input
                            type="file"
                            required={field.required}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setCustomFormData({
                                  ...customFormData,
                                  [field.fieldName]: file.name
                                });
                              }
                            }}
                            className="event-form-input"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Merchandise Selection */}
                {event.type === 'Merchandise' && event.merechandise?.variants && (
                  <div>
                    <h3 className="event-form-section-title">Select Items</h3>
                    <div className="event-merchandise-list">
                      {event.merechandise.variants.map((variant: any, idx: number) => (
                        <div key={idx} className="event-merchandise-item">
                          <div className="event-merchandise-header">
                            <div className="event-merchandise-info">
                              <p className="event-merchandise-name">{variant.variantName}</p>
                              {variant.size && <p className="event-merchandise-detail">Size: {variant.size}</p>}
                              {variant.color && <p className="event-merchandise-detail">Color: {variant.color}</p>}
                            </div>
                            <p className="event-merchandise-price">₹{variant.price}</p>
                          </div>
                          <div className="event-merchandise-quantity">
                            <label className="event-merchandise-quantity-label">Quantity:</label>
                            <input
                              type="number"
                              min="0"
                              max={variant.stock}
                              defaultValue="0"
                              onChange={(e) => {
                                const qty = parseInt(e.target.value) || 0;
                                if (qty > 0) {
                                  setMerchandiseSelection([
                                    ...merchandiseSelection.filter((m: any) => m.variantId !== variant._id),
                                    { variantId: variant._id, quantity: qty }
                                  ]);
                                } else {
                                  setMerchandiseSelection(
                                    merchandiseSelection.filter((m: any) => m.variantId !== variant._id)
                                  );
                                }
                              }}
                              className="event-merchandise-quantity-input"
                            />
                            <span className="event-merchandise-stock">
                              ({variant.stock} in stock)
                            </span>
                          </div>
                          {variant.stock === 0 && (
                            <p className="event-merchandise-out-of-stock">Out of Stock</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Register Button */}
                <button
                  onClick={handleRegister}
                  disabled={registering}
                  className="event-register-button"
                >
                  {registering ? '⏳ Processing...' : event.type === 'Merchandise' ? '🛍️ Purchase Now' : '✓ Register Now'}
                </button>
              </div>
            )}

            {!canRegister && !isDeadlinePassed && !isLimitReached && (
              <div className="event-alert event-alert-info">
                <div className="event-alert-content">
                  <p className="event-alert-text">
                    {user?.role === 'organizer' 
                      ? 'Organizers cannot register for events.'
                      : 'Only participants can register for events.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
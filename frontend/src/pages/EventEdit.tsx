import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import OrganizerNavbar from '../components/OrganizerNavbar';
import '../styles/EventEdit.css';

type FieldType = 'text' | 'textarea' | 'number' | 'date' | 'dropdown' | 'checkbox' | 'file';

interface CustomField {
  fieldName: string;
  label: string;
  fieldType: FieldType;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export default function EventEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState<any>(null);
  const [hasRegistrations, setHasRegistrations] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  
  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'Normal' | 'Merchandise' | 'Team'>('Normal');
  const [status, setStatus] = useState<'Draft' | 'Published'>('Draft');
  const [eligibility, setEligibility] = useState('All');
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [registrationLimit, setRegistrationLimit] = useState('');
  const [registrationFee, setRegistrationFee] = useState('');
  const [venue, setVenue] = useState('');
  const [tags, setTags] = useState('');
  const [registrationsClosed, setRegistrationsClosed] = useState(false);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [showFormBuilder, setShowFormBuilder] = useState(false);

  useEffect(() => {
    fetchEvent();
    checkRegistrations();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const res = await api.get(`/events/${id}`);
      const evt = res.data;
      setEvent(evt);
      
      setName(evt.name || '');
      setDescription(evt.description || '');
      setType(evt.type || 'Normal');
      setStatus(evt.status || 'Draft');
      setEligibility(evt.eligibility || 'All');
      setRegistrationDeadline(evt.registrationDeadline ? new Date(evt.registrationDeadline).toISOString().slice(0, 16) : '');
      setStartDate(evt.startDate ? new Date(evt.startDate).toISOString().slice(0, 16) : '');
      setEndDate(evt.endDate ? new Date(evt.endDate).toISOString().slice(0, 16) : '');
      setRegistrationLimit(evt.registrationLimit?.toString() || '');
      setRegistrationFee(evt.registrationFee?.toString() || '0');
      setVenue(evt.venue || '');
      setTags(evt.tags?.join(', ') || '');
      setRegistrationsClosed(evt.registrationsClosed || false);
      setCustomFields(evt.customForm || []);
      
      setLoading(false);
    } catch (err: any) {
      setMessage('Error loading event: ' + err.response?.data?.message);
      setMessageType('error');
      setLoading(false);
    }
  };

  const checkRegistrations = async () => {
    try {
      const res = await api.get(`/events/${id}/analytics`);
      setHasRegistrations(res.data.totalRegistrations > 0);
    } catch (err) {
      console.error(err);
    }
  };

  const isFieldLocked = (fieldName: string): boolean => {
    // Draft: Nothing is locked
    if (event?.status === 'Draft') return false;
    
    // Custom form is locked once there's any registration
    if (fieldName === 'customForm' && hasRegistrations) return true;
    
    // Published with registrations: type and eligibility are permanently locked
    if (event?.status === 'Published' && hasRegistrations) {
      const permanentlyLocked = ['type', 'eligibility'];
      if (permanentlyLocked.includes(fieldName)) return true;
    }
    
    // Published (no registrations yet): Limited fields locked
    if (event?.status === 'Published') {
      const publishedLocked = ['type', 'startDate', 'endDate', 'registrationFee'];
      return publishedLocked.includes(fieldName);
    }
    
    // Ongoing/Completed: Only status and registrationsClosed can be changed
    if (event?.status === 'Ongoing' || event?.status === 'Completed') {
      return !['status', 'registrationsClosed'].includes(fieldName);
    }
    
    return false;
  };

  const addCustomField = () => {
    setCustomFields([
      ...customFields,
      {
        fieldName: '',
        label: '',
        fieldType: 'text',
        required: false,
        placeholder: ''
      }
    ]);
  };

  const removeCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const updateCustomField = (index: number, updates: Partial<CustomField>) => {
    const updated = [...customFields];
    updated[index] = { ...updated[index], ...updates };
    setCustomFields(updated);
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...customFields];
    if (direction === 'up' && index > 0) {
      [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
    } else if (direction === 'down' && index < newFields.length - 1) {
      [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
    }
    setCustomFields(newFields);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    
    try {
      const payload: any = {
        name,
        description,
        type,
        status,
        eligibility,
        registrationDeadline,
        startDate,
        endDate,
        registrationLimit: registrationLimit ? Number(registrationLimit) : undefined,
        registrationFee: registrationFee ? Number(registrationFee) : 0,
        venue,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        registrationsClosed,
        customForm: type === 'Normal' ? customFields : undefined
      };

      await api.put(`/events/${id}`, payload);
      setMessage('✅ Event updated successfully!');
      setMessageType('success');
      
      setTimeout(() => {
        navigate('/organizer/events');
      }, 1500);
    } catch (err: any) {
      setMessage('❌ Error: ' + (err.response?.data?.message || 'Failed to update event'));
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="event-edit-page">
        <OrganizerNavbar />
        <div className="event-edit-loading">
          <div className="event-edit-loading-spinner"></div>
          <p className="event-edit-loading-text">Loading event...</p>
        </div>
      </div>
    );
  }

  const isDraft = event?.status === 'Draft';
  const isPublished = event?.status === 'Published';
  const isOngoingOrCompleted = event?.status === 'Ongoing' || event?.status === 'Completed';

  const customFormLocked = hasRegistrations;

  console.log('EventEdit Debug:', {
    type,
    customFormLocked,
    hasRegistrations,
    showFormBuilder,
    customFieldsCount: customFields.length
  });

  return (
    <div className="event-edit-page">
      <OrganizerNavbar />
      
      {/* Header */}
      <div className="event-edit-header">
        <div className="event-edit-header-content">
          <div className="event-edit-title-section">
            <h1>✏️ Edit Event</h1>
            <p className="event-edit-status">
              Status: 
              <span className={`event-edit-status-badge status-${event?.status?.toLowerCase()}`}>
                {event?.status}
              </span>
              {hasRegistrations && (
                <span className="event-edit-has-registrations">
                  ⚠️ Has Registrations
                </span>
              )}
            </p>
          </div>
          <button 
            onClick={() => navigate('/organizer/events')}
            className="event-edit-back-btn"
          >
            ← Back to Events
          </button>
        </div>
      </div>

      <div className="event-edit-content">
        {/* Editing Rules Info Banner */}
        {!isDraft && (
          <div className={`event-edit-rules-banner ${
            isPublished && !hasRegistrations ? 'banner-warning' : 
            hasRegistrations ? 'banner-danger' : 
            'banner-info'
          }`}>
            <h3 className="event-edit-rules-title">
              📋 Editing Rules
            </h3>
            {isDraft && (
              <p className="event-edit-rules-text">
                ✅ Full editing allowed. You can modify all fields and publish when ready.
              </p>
            )}
            {isPublished && !hasRegistrations && (
              <div className="event-edit-rules-text">
                <p>⚠️ <strong>Published Event:</strong> Limited editing available.</p>
                <ul className="event-edit-rules-list">
                  <li>✓ Can update: Description, Registration Deadline, Registration Limit, Close Registrations</li>
                  <li>✗ Cannot modify: Event Type, Eligibility, Event Dates, Registration Fee</li>
                </ul>
              </div>
            )}
            {hasRegistrations && (
              <div className="event-edit-rules-text">
                <p>🔒 <strong>Has Registrations:</strong> Most fields are locked.</p>
                <ul className="event-edit-rules-list">
                  <li>🔒 Type, Eligibility, and <strong>Custom Form</strong> are <strong>permanently locked</strong></li>
                  <li>✓ Can still update: Description, Extend Deadline, Increase Limit, Close Registrations</li>
                </ul>
              </div>
            )}
            {isOngoingOrCompleted && (
              <div className="event-edit-rules-text">
                <p>🔒 <strong>Event is {event?.status}:</strong> Only status updates and closing registrations allowed.</p>
              </div>
            )}
          </div>
        )}

        {/* Basic Info */}
        <div className="event-edit-section">
          <h2 className="event-edit-section-title">📝 Basic Information</h2>
          
          <div className="event-edit-form-grid">
            <div className="event-edit-form-group full-width">
              <label className="event-edit-label">Event Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isFieldLocked('name')}
                className="event-edit-input"
                placeholder="Enter event name"
              />
              {isFieldLocked('name') && (
                <p className="event-edit-locked-hint">🔒 Locked after registrations</p>
              )}
            </div>

            <div className="event-edit-form-group full-width">
              <label className="event-edit-label">Description *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isFieldLocked('description')}
                rows={5}
                className="event-edit-textarea"
                placeholder="Describe your event..."
              />
            </div>

            <div className="event-edit-form-group">
              <label className="event-edit-label">Type *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                disabled={isFieldLocked('type')}
                className="event-edit-select"
              >
                <option value="Normal">Normal</option>
                <option value="Merchandise">Merchandise</option>
                <option value="Team">Team</option>
              </select>
              {isFieldLocked('type') && (
                <p className="event-edit-locked-hint">🔒 Locked after registrations</p>
              )}
            </div>

            <div className="event-edit-form-group">
              <label className="event-edit-label">Eligibility *</label>
              <select
                value={eligibility}
                onChange={(e) => setEligibility(e.target.value)}
                disabled={isFieldLocked('eligibility')}
                className="event-edit-select"
              >
                <option value="All">All</option>
                <option value="IIIT Only">IIIT Only</option>
                <option value="Non-IIIT Only">Non-IIIT Only</option>
              </select>
              {isFieldLocked('eligibility') && (
                <p className="event-edit-locked-hint">🔒 Locked after registrations</p>
              )}
            </div>

            <div className="event-edit-form-group">
              <label className="event-edit-label">Registration Deadline *</label>
              <input
                type="datetime-local"
                value={registrationDeadline}
                onChange={(e) => setRegistrationDeadline(e.target.value)}
                disabled={isFieldLocked('registrationDeadline')}
                className="event-edit-input"
              />
            </div>

            <div className="event-edit-form-group">
              <label className="event-edit-label">Registration Limit</label>
              <input
                type="number"
                value={registrationLimit}
                onChange={(e) => setRegistrationLimit(e.target.value)}
                disabled={isFieldLocked('registrationLimit')}
                placeholder="Leave empty for unlimited"
                className="event-edit-input"
              />
            </div>

            <div className="event-edit-form-group">
              <label className="event-edit-label">Start Date *</label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isFieldLocked('startDate')}
                className="event-edit-input"
              />
              {isFieldLocked('startDate') && (
                <p className="event-edit-locked-hint">🔒 Locked after registrations</p>
              )}
            </div>

            <div className="event-edit-form-group">
              <label className="event-edit-label">End Date *</label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isFieldLocked('endDate')}
                className="event-edit-input"
              />
              {isFieldLocked('endDate') && (
                <p className="event-edit-locked-hint">🔒 Locked after registrations</p>
              )}
            </div>

            <div className="event-edit-form-group">
              <label className="event-edit-label">Registration Fee (₹)</label>
              <input
                type="number"
                value={registrationFee}
                onChange={(e) => setRegistrationFee(e.target.value)}
                disabled={isFieldLocked('registrationFee')}
                className="event-edit-input"
                placeholder="0"
              />
              {isFieldLocked('registrationFee') && (
                <p className="event-edit-locked-hint">🔒 Locked after registrations</p>
              )}
            </div>

            <div className="event-edit-form-group">
              <label className="event-edit-label">Venue</label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                disabled={isFieldLocked('venue')}
                className="event-edit-input"
                placeholder="Event location"
              />
            </div>

            <div className="event-edit-form-group full-width">
              <label className="event-edit-label">Tags (comma separated)</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                disabled={isFieldLocked('tags')}
                placeholder="technical, workshop, beginner-friendly"
                className="event-edit-input"
              />
            </div>

            {isPublished && (
              <div className="event-edit-checkbox-group full-width">
                <input
                  type="checkbox"
                  id="closedRegs"
                  checked={registrationsClosed}
                  onChange={(e) => setRegistrationsClosed(e.target.checked)}
                  disabled={isFieldLocked('registrationsClosed')}
                  className="event-edit-checkbox"
                />
                <label htmlFor="closedRegs" className="event-edit-checkbox-label">
                  Close Registrations (Users cannot register anymore)
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Custom Form Builder - Only for Normal Events */}
        {type === 'Normal' && (
          <div className="event-edit-section">
            <div className="event-edit-section-header">
              <h2 className="event-edit-section-title">📝 Custom Registration Form</h2>
              {!customFormLocked && (
                <button
                  onClick={() => setShowFormBuilder(!showFormBuilder)}
                  className="event-edit-toggle-btn"
                >
                  {showFormBuilder ? '▼ Hide Builder' : '▶ Show Builder'}
                </button>
              )}
            </div>

            {customFormLocked ? (
              <div className="event-edit-locked-message">
                <div className="event-edit-locked-icon">🔒</div>
                <div className="event-edit-locked-content">
                  <h3 className="event-edit-locked-title">Custom Form is Locked</h3>
                  <p className="event-edit-locked-text">
                    The custom form cannot be modified because registrations have been received. 
                    Changes to the form structure would affect existing registration data.
                  </p>
                  {customFields.length > 0 && (
                    <div className="event-edit-form-preview">
                      <p className="event-edit-form-preview-title">Current fields ({customFields.length}):</p>
                      <ul className="event-edit-form-preview-list">
                        {customFields.map((field, index) => (
                          <li key={index}>
                            {field.label} ({field.fieldType})
                            {field.required && <span className="field-required-badge">Required</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {!customFormLocked && showFormBuilder && (
              <div className="space-y-5">
                <p className="text-sm text-gray-600 mb-4">
                  Add custom fields to collect additional information from participants during registration.
                </p>

                {customFields.map((field, index) => (
                  <div key={index} className="border-2 border-gray-200 rounded-lg p-5 bg-gray-50">
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Field Name (Key)</label>
                        <input
                          type="text"
                          value={field.fieldName}
                          onChange={(e) => updateCustomField(index, { fieldName: e.target.value })}
                          className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                          placeholder="e.g., phone_number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Field Label (Display)</label>
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => updateCustomField(index, { label: e.target.value })}
                          className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                          placeholder="e.g., Phone Number"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Field Type</label>
                        <select
                          value={field.fieldType}
                          onChange={(e) => updateCustomField(index, { fieldType: e.target.value as FieldType })}
                          className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                        >
                          <option value="text">Text</option>
                          <option value="textarea">Textarea</option>
                          <option value="number">Number</option>
                          <option value="date">Date</option>
                          <option value="dropdown">Dropdown</option>
                          <option value="checkbox">Checkbox</option>
                          <option value="file">File Upload</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Placeholder</label>
                        <input
                          type="text"
                          value={field.placeholder || ''}
                          onChange={(e) => updateCustomField(index, { placeholder: e.target.value })}
                          className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                          placeholder="Hint text"
                        />
                      </div>
                      <div className="flex items-center pt-7">
                        <input
                          type="checkbox"
                          id={`required-${index}`}
                          checked={field.required}
                          onChange={(e) => updateCustomField(index, { required: e.target.checked })}
                          className="w-4 h-4 mr-2 text-indigo-600"
                        />
                        <label htmlFor={`required-${index}`} className="text-sm font-semibold text-gray-700">Required Field</label>
                      </div>
                    </div>

                    {(field.fieldType === 'dropdown' || field.fieldType === 'checkbox') && (
                      <div className="mb-4">
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Options (comma separated)</label>
                        <input
                          type="text"
                          value={field.options?.join(', ') || ''}
                          onChange={(e) => updateCustomField(index, { 
                            options: e.target.value.split(',').map(o => o.trim()).filter(Boolean)
                          })}
                          className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                          placeholder="e.g., Option 1, Option 2, Option 3"
                        />
                      </div>
                    )}

                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => moveField(index, 'up')}
                        disabled={index === 0}
                        className="px-4 py-2 bg-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
                      >
                        ↑ Move Up
                      </button>
                      <button
                        onClick={() => moveField(index, 'down')}
                        disabled={index === customFields.length - 1}
                        className="px-4 py-2 bg-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
                      >
                        ↓ Move Down
                      </button>
                      <button
                        onClick={() => removeCustomField(index)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition ml-auto"
                      >
                        🗑️ Remove Field
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  onClick={addCustomField}
                  className="w-full py-4 border-2 border-dashed border-gray-400 rounded-lg text-gray-700 font-semibold hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                >
                  + Add Custom Field
                </button>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="event-edit-actions">
          <button
            onClick={() => navigate('/organizer/events')}
            className="event-edit-btn event-edit-btn-cancel"
          >
            ← Cancel
          </button>
          
          {!isOngoingOrCompleted && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="event-edit-btn event-edit-btn-save"
            >
              {saving ? '💾 Saving...' : '💾 Save Changes'}
            </button>
          )}

          {isOngoingOrCompleted && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="event-edit-btn event-edit-btn-save"
            >
              {saving ? '⏳ Updating...' : '✏️ Update Status'}
            </button>
          )}
        </div>

        {/* Message Display */}
        {message && (
          <div className={`event-edit-message ${
            messageType === 'success' 
              ? 'event-edit-message-success' 
              : 'event-edit-message-error'
          }`}>
            {messageType === 'success' ? '✅' : '❌'} {message}
          </div>
        )}
      </div>
    </div>
  );
}
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import OrganizerNavbar from '../components/OrganizerNavbar';
import '../styles/CreateEvent.css';

interface CustomField {
  id: string;
  label: string;
  type: 'text' | 'dropdown' | 'checkbox' | 'file' | 'number' | 'date' | 'textarea';
  required: boolean;
  flexible: boolean;
  options?: string[];
  placeholder?: string;
}

export default function CreateEvent() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'basic' | 'custom-form'>('basic');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Basic Event Details
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'Normal',
    eligibility: 'All',
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    registrationFee: 0,
    registrationLimit: '',
    teamSize: '',
    venue: '',
    status: 'draft'
  });

  // Custom Fields
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [newField, setNewField] = useState<CustomField>({
    id: '',
    label: '',
    type: 'text',
    required: false,
    flexible: false,
    options: [],
    placeholder: ''
  });
  const [showFieldBuilder, setShowFieldBuilder] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddField = () => {
    if (!newField.label || !newField.type) {
      alert('Please provide a label and select a field type');
      return;
    }

    const field = {
      ...newField,
      id: Date.now().toString()
    };

    setCustomFields([...customFields, field]);
    setNewField({
      id: '',
      label: '',
      type: 'text',
      required: false,
      flexible: false,
      options: [],
      placeholder: ''
    });
    setShowFieldBuilder(false);
  };

  const handleRemoveField = (id: string) => {
    setCustomFields(customFields.filter(f => f.id !== id));
  };

  const handleFieldReorder = (index: number, direction: 'up' | 'down') => {
    const newFields = [...customFields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newFields.length) return;
    
    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
    setCustomFields(newFields);
  };

  const handleSaveDraft = async () => {
    try {
      setLoading(true);
      setError('');
      
      // For draft, we need at least the basic required fields
      const missingFields = [];
      if (!formData.name) missingFields.push('Event Name');
      if (!formData.description) missingFields.push('Description');
      if (!formData.startDate) missingFields.push('Start Date');
      if (!formData.endDate) missingFields.push('End Date');
      if (!formData.registrationDeadline) missingFields.push('Registration Deadline');
      
      if (missingFields.length > 0) {
        setError(`Please fill in the following required fields before saving: ${missingFields.join(', ')}`);
        setLoading(false);
        // Go back to basic details step if there are missing fields
        if (step === 'custom-form') {
          setStep('basic');
        }
        return;
      }
      
      console.log('Current customFields:', customFields);
      console.log('customFields length:', customFields.length);
      
      const eventData: any = {
        ...formData,
        status: 'Draft',
        // Convert empty strings to undefined for optional numeric fields
        registrationLimit: formData.registrationLimit ? Number(formData.registrationLimit) : undefined,
        registrationFee: formData.registrationFee ? Number(formData.registrationFee) : 0,
        teamSize: formData.teamSize ? Number(formData.teamSize) : undefined
      };

      // Only add customForm if there are custom fields
      if (customFields.length > 0) {
        const mappedFields = customFields.map(field => ({
          fieldName: field.label.toLowerCase().replace(/\s+/g, '_'),
          fieldType: field.type,
          label: field.label,
          placeholder: field.placeholder || '',
          required: field.required,
          options: field.options || []
        }));
        
        console.log('Mapped fields:', mappedFields);
        
        eventData.customForm = {
          fields: mappedFields
        };
      }

      console.log('Saving event with data:', eventData);
      console.log('Event customForm:', eventData.customForm);
      
      const response = await api.post('/events', eventData);
      console.log('Server response:', response.data);
      
      alert('Event saved as draft successfully!');
      navigate('/organizer/events');
    } catch (err: any) {
      console.error('Error saving draft:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to save draft');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    try {
      setLoading(true);
      setError('');

      // Validate required fields with specific error messages
      const missingFields = [];
      if (!formData.name) missingFields.push('Event Name');
      if (!formData.description) missingFields.push('Description');
      if (!formData.startDate) missingFields.push('Start Date');
      if (!formData.endDate) missingFields.push('End Date');
      if (!formData.registrationDeadline) missingFields.push('Registration Deadline');
      
      if (missingFields.length > 0) {
        setError(`Please fill in the following required fields: ${missingFields.join(', ')}`);
        setLoading(false);
        // Go back to basic details step if there are missing fields
        if (step === 'custom-form') {
          setStep('basic');
        }
        return;
      }

      console.log('Current customFields:', customFields);
      console.log('customFields length:', customFields.length);

      const eventData: any = {
        ...formData,
        status: 'Published',
        // Convert empty strings to undefined for optional numeric fields
        registrationLimit: formData.registrationLimit ? Number(formData.registrationLimit) : undefined,
        registrationFee: formData.registrationFee ? Number(formData.registrationFee) : 0,
        teamSize: formData.teamSize ? Number(formData.teamSize) : undefined
      };

      // Only add customForm if there are custom fields
      if (customFields.length > 0) {
        const mappedFields = customFields.map(field => ({
          fieldName: field.label.toLowerCase().replace(/\s+/g, '_'),
          fieldType: field.type,
          label: field.label,
          placeholder: field.placeholder || '',
          required: field.required,
          options: field.options || []
        }));
        
        console.log('Mapped fields:', mappedFields);
        
        eventData.customForm = {
          fields: mappedFields
        };
      }

      console.log('Publishing event with data:', eventData);
      console.log('Event customForm:', eventData.customForm);
      
      const response = await api.post('/events', eventData);
      console.log('Server response:', response.data);
      
      alert('Event published successfully!');
      navigate('/organizer/events');
    } catch (err: any) {
      console.error('Error publishing event:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to publish event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-event-page">
      <OrganizerNavbar />

      <div className="create-event-container">
        {/* Header */}
        <div className="create-event-header">
          <div className="create-event-header-content">
            <h1 className="create-event-title">
              {step === 'basic' ? '📝 Create New Event' : '🎨 Customize Registration Form'}
            </h1>
            <p className="create-event-subtitle">
              {step === 'basic' 
                ? 'Fill in the basic event details to get started' 
                : 'Add custom fields to collect additional information from participants'}
            </p>
          </div>
          <button onClick={() => navigate('/organizer/events')} className="create-event-back-btn">
            ← Back
          </button>
        </div>

        {/* Progress Steps */}
        <div className="create-event-steps">
          <div className={`create-event-step ${step === 'basic' ? 'active' : 'completed'}`}>
            <div className="step-number">1</div>
            <div className="step-label">Basic Details</div>
          </div>
          <div className="step-connector"></div>
          <div className={`create-event-step ${step === 'custom-form' ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Custom Form</div>
          </div>
        </div>

        {error && <div className="create-event-error">{error}</div>}

        {/* Step 1: Basic Details */}
        {step === 'basic' && (
          <div className="create-event-form-card">
            <div className="form-section">
              <h3 className="form-section-title">📋 Event Information</h3>
              
              <div className="form-grid">
                <div className="form-field">
                  <label className="form-label">Event Name <span className="required">*</span></label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="e.g., Annual Tech Hackathon"
                    required
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Event Type <span className="required">*</span></label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="form-select"
                    required
                  >
                    <option value="Normal">Normal</option>
                    <option value="Team">Team</option>
                    <option value="Merchandise">Merchandise</option>
                  </select>
                </div>

                <div className="form-field form-field-full">
                  <label className="form-label">Description <span className="required">*</span></label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="form-textarea"
                    placeholder="Provide a detailed description of your event..."
                    rows={4}
                    required
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Eligibility <span className="required">*</span></label>
                  <select
                    name="eligibility"
                    value={formData.eligibility}
                    onChange={handleInputChange}
                    className="form-select"
                    required
                  >
                    <option value="All">All</option>
                    <option value="UG">Undergraduate</option>
                    <option value="PG">Postgraduate</option>
                    <option value="Faculty">Faculty</option>
                  </select>
                </div>

                <div className="form-field">
                  <label className="form-label">Venue</label>
                  <input
                    type="text"
                    name="venue"
                    value={formData.venue}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="e.g., Main Auditorium"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3 className="form-section-title">📅 Dates & Deadlines</h3>
              
              <div className="form-grid">
                <div className="form-field">
                  <label className="form-label">Start Date & Time <span className="required">*</span></label>
                  <input
                    type="datetime-local"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">End Date & Time <span className="required">*</span></label>
                  <input
                    type="datetime-local"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Registration Deadline <span className="required">*</span></label>
                  <input
                    type="datetime-local"
                    name="registrationDeadline"
                    value={formData.registrationDeadline}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3 className="form-section-title">💰 Registration Details</h3>
              
              <div className="form-grid">
                <div className="form-field">
                  <label className="form-label">Registration Fee (₹)</label>
                  <input
                    type="number"
                    name="registrationFee"
                    value={formData.registrationFee}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Registration Limit</label>
                  <input
                    type="number"
                    name="registrationLimit"
                    value={formData.registrationLimit}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Leave empty for unlimited"
                    min="1"
                  />
                </div>

                {formData.type === 'Team' && (
                  <div className="form-field">
                    <label className="form-label">Team Size <span className="required">*</span></label>
                    <input
                      type="number"
                      name="teamSize"
                      value={formData.teamSize}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="e.g., 4"
                      min="2"
                      required
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="form-actions">
              <button onClick={handleSaveDraft} className="btn-draft" disabled={loading}>
                💾 Save as Draft
              </button>
              <button onClick={() => setStep('custom-form')} className="btn-next">
                Next: Custom Form →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Custom Form Builder */}
        {step === 'custom-form' && (
          <div className="create-event-form-card">
            <div className="form-section">
              <div className="custom-form-header">
                <h3 className="form-section-title">🎨 Custom Registration Fields</h3>
                <button 
                  onClick={() => setShowFieldBuilder(!showFieldBuilder)} 
                  className="btn-add-field"
                >
                  ➕ Add Field
                </button>
              </div>

              {showFieldBuilder && (
                <div className="field-builder-card">
                  <h4 className="field-builder-title">Create Custom Field</h4>
                  
                  <div className="form-grid">
                    <div className="form-field">
                      <label className="form-label">Field Label</label>
                      <input
                        type="text"
                        value={newField.label}
                        onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                        className="form-input"
                        placeholder="e.g., T-Shirt Size"
                      />
                    </div>

                    <div className="form-field">
                      <label className="form-label">Field Type</label>
                      <select
                        value={newField.type}
                        onChange={(e) => setNewField({ ...newField, type: e.target.value as any })}
                        className="form-select"
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

                    <div className="form-field">
                      <label className="form-label">Placeholder</label>
                      <input
                        type="text"
                        value={newField.placeholder}
                        onChange={(e) => setNewField({ ...newField, placeholder: e.target.value })}
                        className="form-input"
                        placeholder="Hint text for users"
                      />
                    </div>

                    {(newField.type === 'dropdown' || newField.type === 'checkbox') && (
                      <div className="form-field form-field-full">
                        <label className="form-label">Options (comma-separated)</label>
                        <input
                          type="text"
                          value={newField.options?.join(', ')}
                          onChange={(e) => setNewField({ 
                            ...newField, 
                            options: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                          })}
                          className="form-input"
                          placeholder="e.g., Small, Medium, Large, XL"
                        />
                      </div>
                    )}

                    <div className="form-field-checkbox">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={newField.required}
                          onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                        />
                        <span>Required Field</span>
                      </label>
                    </div>

                    <div className="form-field-checkbox">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={newField.flexible}
                          onChange={(e) => setNewField({ ...newField, flexible: e.target.checked })}
                        />
                        <span>Flexible (Can be edited later)</span>
                      </label>
                    </div>
                  </div>

                  <div className="field-builder-actions">
                    <button onClick={() => setShowFieldBuilder(false)} className="btn-cancel">
                      Cancel
                    </button>
                    <button onClick={handleAddField} className="btn-add">
                      ✓ Add Field
                    </button>
                  </div>
                </div>
              )}

              {/* Display Added Fields */}
              {customFields.length > 0 ? (
                <div className="custom-fields-list">
                  <p className="fields-list-subtitle">
                    Fields will appear in this order on the registration form. Drag to reorder.
                  </p>
                  
                  {customFields.map((field, index) => (
                    <div key={field.id} className="custom-field-item">
                      <div className="field-item-header">
                        <div className="field-item-info">
                          <span className="field-item-label">{field.label}</span>
                          <span className="field-item-type">{field.type}</span>
                          {field.required && <span className="field-item-badge">Required</span>}
                          {field.flexible && <span className="field-item-badge-flex">Flexible</span>}
                        </div>
                        <div className="field-item-actions">
                          <button 
                            onClick={() => handleFieldReorder(index, 'up')}
                            className="field-action-btn"
                            disabled={index === 0}
                          >
                            ↑
                          </button>
                          <button 
                            onClick={() => handleFieldReorder(index, 'down')}
                            className="field-action-btn"
                            disabled={index === customFields.length - 1}
                          >
                            ↓
                          </button>
                          <button 
                            onClick={() => handleRemoveField(field.id)}
                            className="field-action-btn-delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      {field.options && field.options.length > 0 && (
                        <div className="field-item-options">
                          Options: {field.options.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-fields-message">
                  <p>📝 No custom fields added yet</p>
                  <p className="no-fields-subtext">
                    Click "Add Field" to create custom registration fields for your event
                  </p>
                </div>
              )}
            </div>

            <div className="form-actions">
              <button onClick={() => setStep('basic')} className="btn-back">
                ← Back to Basic Details
              </button>
              <button onClick={handleSaveDraft} className="btn-draft" disabled={loading}>
                💾 Save as Draft
              </button>
              <button onClick={handlePublish} className="btn-publish" disabled={loading}>
                🚀 Publish Event
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

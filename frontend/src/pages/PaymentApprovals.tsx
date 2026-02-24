import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import OrganizerNavbar from '../components/OrganizerNavbar';
import SecureImage from '../components/SecureImage';
import '../styles/PaymentApprovals.css';

export default function PaymentApprovals() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'organizer') {
      navigate('/dashboard');
      return;
    }
    fetchEventDetails();
    fetchPendingPayments();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      const res = await api.get(`/events/${eventId}`);
      setEvent(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPendingPayments = async () => {
    try {
      const res = await api.get(`/registrations/event/${eventId}/pending-payments`);
      setPendingPayments(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleApprove = async (registrationId: string) => {
    if (!window.confirm('Approve this payment? This will generate a QR code and send an email to the participant.')) {
      return;
    }

    try {
      await api.post(`/registrations/${registrationId}/approve-payment`, {
        action: 'approve'
      });
      alert('Payment approved successfully! QR code generated and email sent.');
      fetchPendingPayments();
    } catch (err: any) {
      alert('Error: ' + (err.response?.data?.message || 'Failed to approve payment'));
    }
  };

  const handleReject = async (registrationId: string) => {
    const remarks = prompt('Enter rejection reason (optional):');
    
    try {
      await api.post(`/registrations/${registrationId}/approve-payment`, {
        action: 'reject',
        remarks
      });
      alert('Payment rejected successfully.');
      fetchPendingPayments();
    } catch (err: any) {
      alert('Error: ' + (err.response?.data?.message || 'Failed to reject payment'));
    }
  };

  const filteredPayments = pendingPayments.filter(payment => {
    if (filter === 'All') return true;
    return payment.paymentStatus === filter;
  });

  const stats = {
    total: pendingPayments.length,
    pending: pendingPayments.filter(p => p.paymentStatus === 'Pending').length,
    approved: pendingPayments.filter(p => p.paymentStatus === 'Approved').length,
    rejected: pendingPayments.filter(p => p.paymentStatus === 'Rejected').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <OrganizerNavbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(`/organizer/event/${eventId}`)}
            className="text-indigo-600 hover:text-indigo-800 mb-4 flex items-center gap-2"
          >
            ← Back to Event Details
          </button>
          <h1 className="text-3xl font-bold mb-2">💳 Payment Approvals</h1>
          <p className="text-gray-600">{event?.name}</p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-500 text-sm">Total Orders</p>
            <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-6 border-2 border-yellow-200">
            <p className="text-yellow-700 text-sm">Pending Approval</p>
            <p className="text-3xl font-bold text-yellow-800">{stats.pending}</p>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-6 border-2 border-green-200">
            <p className="text-green-700 text-sm">Approved</p>
            <p className="text-3xl font-bold text-green-800">{stats.approved}</p>
          </div>
          <div className="bg-red-50 rounded-lg shadow p-6 border-2 border-red-200">
            <p className="text-red-700 text-sm">Rejected</p>
            <p className="text-3xl font-bold text-red-800">{stats.rejected}</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b overflow-x-auto">
            {(['All', 'Pending', 'Approved', 'Rejected'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-6 py-3 font-semibold whitespace-nowrap ${
                  filter === tab
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {tab} ({tab === 'All' ? stats.total : 
                       tab === 'Pending' ? stats.pending :
                       tab === 'Approved' ? stats.approved : stats.rejected})
              </button>
            ))}
          </div>
        </div>

        {/* Payment Orders */}
        {filteredPayments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="text-6xl mb-4">💳</div>
            <p className="text-gray-400 text-lg">No payment orders in this category</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPayments.map((payment) => {
              const participant = payment.participantId || payment.userId;
              const participantName = participant?.profile?.firstName 
                ? `${participant.profile.firstName} ${participant.profile.lastName || ''}`
                : participant?.email || 'Unknown';

              // Calculate total amount
              let totalAmount = 0;
              const items = payment.merchandiseSelection?.map((item: any) => {
                const variant = event?.merchandise?.variants?.find((v: any) => 
                  v._id.toString() === item.variantId
                );
                const itemTotal = variant ? variant.price * item.quantity : 0;
                totalAmount += itemTotal;
                return {
                  variantName: variant?.variantName || 'Unknown',
                  quantity: item.quantity,
                  price: variant?.price || 0,
                  total: itemTotal
                };
              }) || [];

              return (
                <div key={payment._id} className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden">
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="text-xl font-bold text-gray-800">{participantName}</h3>
                          <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                            payment.paymentStatus === 'Approved' ? 'bg-green-100 text-green-800' :
                            payment.paymentStatus === 'Rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {payment.paymentStatus === 'Approved' ? '✅ Approved' :
                             payment.paymentStatus === 'Rejected' ? '❌ Rejected' :
                             '⏳ Pending'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{participant?.email}</p>
                        {participant?.profile?.contactNumber && (
                          <p className="text-sm text-gray-600">📞 {participant.profile.contactNumber}</p>
                        )}
                      </div>
                    </div>

                    {/* Order Details */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold text-sm text-gray-700 mb-3">🛍️ Order Details:</h4>
                      <div className="space-y-2">
                        {items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-gray-700">
                              {item.variantName} × {item.quantity}
                            </span>
                            <span className="font-semibold text-gray-900">
                              ₹{item.total}
                            </span>
                          </div>
                        ))}
                        <div className="border-t pt-2 flex justify-between font-bold text-base">
                          <span>Total Amount</span>
                          <span className="text-indigo-600">₹{totalAmount}</span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Proof */}
                    {payment.paymentProof && (
                      <div className="bg-indigo-50 rounded-lg p-4 mb-4">
                        <h4 className="font-semibold text-sm text-indigo-900 mb-3">📸 Payment Proof:</h4>
                        <SecureImage
                          registrationId={payment._id}
                          alt="Payment Proof" 
                          className="w-full max-w-md rounded-lg border-2 border-indigo-200 cursor-pointer hover:opacity-90"
                          onClick={async () => {
                            try {
                              const response = await api.get(`/registrations/${payment._id}/payment-proof-url`);
                              window.open(response.data.url, '_blank');
                            } catch (error) {
                              console.error('Error opening payment proof:', error);
                            }
                          }}
                        />
                        <p className="text-xs text-gray-500 mt-2">Click to view full size</p>
                      </div>
                    )}

                    {/* Additional Info */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4 text-sm">
                      <div>
                        <p className="text-gray-500">Ticket ID</p>
                        <p className="font-mono font-semibold">{payment.ticketId}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Order Date</p>
                        <p className="font-semibold">
                          {new Date(payment.registeredAt || payment.registrationDate).toLocaleDateString()}
                        </p>
                      </div>
                      {payment.paymentApprovedAt && (
                        <div>
                          <p className="text-gray-500">Approved On</p>
                          <p className="font-semibold">
                            {new Date(payment.paymentApprovedAt).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Remarks */}
                    {payment.paymentRemarks && (
                      <div className="bg-red-50 border-l-4 border-red-400 p-3 mb-4">
                        <p className="text-sm text-red-800">
                          <strong>Rejection Reason:</strong> {payment.paymentRemarks}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {payment.paymentStatus === 'Pending' && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleApprove(payment._id)}
                          className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold transition"
                        >
                          ✅ Approve Payment
                        </button>
                        <button
                          onClick={() => handleReject(payment._id)}
                          className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-semibold transition"
                        >
                          ❌ Reject Payment
                        </button>
                      </div>
                    )}

                    {payment.paymentStatus === 'Approved' && (
                      <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 text-center">
                        <p className="text-green-800 font-semibold">✅ This payment has been approved</p>
                        <p className="text-sm text-green-600 mt-1">QR code generated and email sent to participant</p>
                      </div>
                    )}

                    {payment.paymentStatus === 'Rejected' && (
                      <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 text-center">
                        <p className="text-red-800 font-semibold">❌ This payment has been rejected</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

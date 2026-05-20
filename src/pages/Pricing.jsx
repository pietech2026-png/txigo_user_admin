import React, { useState, useEffect } from 'react';
import { MapPin, Globe, Zap, Save, Trash2, Plus, Loader2, Edit2, X, Info, Car } from 'lucide-react';
import API_BASE_URL from '../config';

const Pricing = () => {
  const [globalMultiplier, setGlobalMultiplier] = useState(1.0);
  const [advancePercentage, setAdvancePercentage] = useState(20);
  const [pricingRules, setPricingRules] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [formData, setFormData] = useState({
    tripType: 'Oneway',
    category: '',
    sourceCity: '',
    destinationCity: '',
    state: '',
    city: '',
    baseFare: 0,
    includedKm: 300,
    extraKmRate: 30,
    perDayFare: 0,
    pickupTime: '10:00 AM',
    returnTimeLimit: '11:00 PM',
    nightCharge: 500,
    taxesIncluded: false,
    status: 'Active'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rulesRes, settingsRes, catRes] = await Promise.all([
        fetch(`${API_BASE_URL}/pricing-rules`),
        fetch(`${API_BASE_URL}/global-settings`),
        fetch(`${API_BASE_URL}/car-categories`)
      ]);

      if (!rulesRes.ok || !settingsRes.ok || !catRes.ok) throw new Error('Failed to fetch data');

      const rulesData = await rulesRes.json();
      const settingsData = await settingsRes.json();
      const catData = await catRes.json();

      setPricingRules(rulesData);
      setCategories(catData);
      
      const multiplier = settingsData.find(s => s.key === 'globalMultiplier');
      const advance = settingsData.find(s => s.key === 'advancePercentage');
      
      if (multiplier) setGlobalMultiplier(multiplier.value);
      if (advance) setAdvancePercentage(advance.value);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRule = async (e) => {
    e.preventDefault();
    try {
      const method = editingRule ? 'PUT' : 'POST';
      const url = editingRule 
        ? `${API_BASE_URL}/pricing-rules/${editingRule._id}` 
        : `${API_BASE_URL}/pricing-rules`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to save rule');
      
      setIsModalOpen(false);
      fetchData();
      alert('Rule saved successfully!');
    } catch (err) {
      alert(err.message);
    }
  };

  const deleteRule = async (id) => {
    if (!window.confirm('Are you sure you want to delete this rule?')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/pricing-rules/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete rule');
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const updateGlobalSetting = async (key, value) => {
    try {
      const response = await fetch(`${API_BASE_URL}/global-settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      });
      if (!response.ok) throw new Error('Failed to update setting');
      alert(`${key} updated successfully!`);
    } catch (err) {
      alert(err.message);
    }
  };

  const openAddModal = () => {
    setEditingRule(null);
    setFormData({
      tripType: 'Oneway',
      category: categories[0]?.name || '',
      sourceCity: '',
      destinationCity: '',
      state: '',
      city: '',
      baseFare: 0,
      includedKm: 300,
      extraKmRate: 30,
      perDayFare: 0,
      pickupTime: '10:00 AM',
      returnTimeLimit: '11:00 PM',
      nightCharge: 500,
      taxesIncluded: false,
      status: 'Active'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (rule) => {
    setEditingRule(rule);
    setFormData({ ...rule });
    setIsModalOpen(true);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Pricing Management (Traveller Mode)</h1>
          <p className="text-sm text-gray-500 font-medium">Configure rules for Travellers based on City/State.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-100"
        >
          <Plus size={18} /> Add Pricing Rule
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Type / Location</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Vehicle</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Pricing</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Limits</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pricingRules.length > 0 ? (
                pricingRules.map((rule) => (
                  <tr key={rule._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className={`w-fit px-1.5 py-0.5 rounded text-[8px] font-black uppercase mb-1 bg-blue-50 text-blue-600`}>
                          {rule.tripType || rule.rideType}
                        </span>
                        {rule.city ? (
                          <span className="text-sm font-bold text-gray-900">{rule.city}</span>
                        ) : rule.state ? (
                          <span className="text-sm font-bold text-gray-900">{rule.state} (State)</span>
                        ) : (
                          <span className="text-sm font-bold text-gray-900">Default (All)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-700">{rule.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900">Base: ₹{rule.baseFare}</span>
                        <span className="text-[10px] text-gray-500">Extra: ₹{rule.extraKmRate || rule.perKmRate}/km</span>
                        {rule.tripType === 'Multi-Day Roundtrip' && <span className="text-[10px] text-gray-500">Day: ₹{rule.perDayFare}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[10px] space-y-0.5 font-medium text-gray-500">
                        <div>Incl KM: {rule.includedKm}</div>
                        <div>Return limit: {rule.returnTimeLimit}</div>
                        <div>Night Charge: ₹{rule.nightCharge}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(rule)}
                          className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => deleteRule(rule._id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-gray-500">No pricing rules found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-primary-50/30">
              <h2 className="text-xl font-black text-gray-900">{editingRule ? 'Edit' : 'Add'} Pricing Rule</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-xl transition-all"><X size={20} /></button>
            </div>

            <form onSubmit={handleSaveRule} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase mb-2">Trip Type</label>
                  <select 
                    value={formData.tripType}
                    onChange={(e) => setFormData({...formData, tripType: e.target.value})}
                    className="w-full bg-gray-50 border-gray-100 rounded-xl px-4 py-3 font-bold text-gray-900 outline-none focus:ring-2 focus:ring-primary-100"
                  >
                    <option value="Oneway">Oneway</option>
                    <option value="Roundtrip Same Day">Roundtrip Same Day</option>
                    <option value="Multi-Day Roundtrip">Multi-Day Roundtrip</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase mb-2">Vehicle Type</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-gray-50 border-gray-100 rounded-xl px-4 py-3 font-bold text-gray-900 outline-none focus:ring-2 focus:ring-primary-100"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c._id} value={c.name}>{c.displayName}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-4 p-4 bg-blue-50/30 rounded-2xl border border-blue-50">
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <Info size={14} />
                  <span className="text-[10px] font-black uppercase tracking-wider">Location Overrides</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    placeholder="State Override (Leave empty for Default)"
                    value={formData.state || ''}
                    onChange={(e) => setFormData({...formData, state: e.target.value})}
                    className="bg-white border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold outline-none"
                  />
                  <input 
                    placeholder="City Override (Leave empty for State/Default)"
                    value={formData.city || ''}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    className="bg-white border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Base Fare</label>
                  <input 
                    type="number" value={formData.baseFare}
                    onChange={(e) => setFormData({...formData, baseFare: e.target.value})}
                    className="w-full bg-gray-50 border-gray-100 rounded-xl px-4 py-2.5 font-bold text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Included KM</label>
                  <input 
                    type="number" value={formData.includedKm}
                    onChange={(e) => setFormData({...formData, includedKm: e.target.value})}
                    className="w-full bg-gray-50 border-gray-100 rounded-xl px-4 py-2.5 font-bold text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Extra KM Rate</label>
                  <input 
                    type="number" value={formData.extraKmRate}
                    onChange={(e) => setFormData({...formData, extraKmRate: e.target.value})}
                    className="w-full bg-gray-50 border-gray-100 rounded-xl px-4 py-2.5 font-bold text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Per Day Fare</label>
                  <input 
                    type="number" value={formData.perDayFare}
                    onChange={(e) => setFormData({...formData, perDayFare: e.target.value})}
                    className="w-full bg-gray-50 border-gray-100 rounded-xl px-4 py-2.5 font-bold text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Pickup Time</label>
                  <input 
                    type="text" value={formData.pickupTime}
                    onChange={(e) => setFormData({...formData, pickupTime: e.target.value})}
                    className="w-full bg-gray-50 border-gray-100 rounded-xl px-4 py-2.5 font-bold text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Return Time Limit</label>
                  <input 
                    type="text" value={formData.returnTimeLimit}
                    onChange={(e) => setFormData({...formData, returnTimeLimit: e.target.value})}
                    className="w-full bg-gray-50 border-gray-100 rounded-xl px-4 py-2.5 font-bold text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Night Charge</label>
                  <input 
                    type="number" value={formData.nightCharge}
                    onChange={(e) => setFormData({...formData, nightCharge: e.target.value})}
                    className="w-full bg-gray-50 border-gray-100 rounded-xl px-4 py-2.5 font-bold text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Status</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full bg-gray-50 border-gray-100 rounded-xl px-4 py-2.5 font-bold text-sm outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={formData.taxesIncluded}
                  onChange={(e) => setFormData({...formData, taxesIncluded: e.target.checked})}
                />
                <label className="text-sm font-bold text-gray-700">Taxes Included (Toll/Parking/State Tax)</label>
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-4 -mx-8 -mb-8">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 transition-all">Cancel</button>
                <button type="submit" className="px-8 py-2.5 bg-primary-600 text-white rounded-xl font-bold shadow-lg shadow-primary-100 hover:bg-primary-700 transition-all">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pricing;

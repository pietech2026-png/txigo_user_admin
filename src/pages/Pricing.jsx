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
    rideType: 'Oneway',
    category: '',
    sourceCity: '',
    destinationCity: '',
    state: '',
    city: '',
    baseFare: 0,
    perKmRate: 0,
    fixedFare: 0,
    minKmsPerDay: 250,
    driverAllowance: 250,
    nightAllowance: 250,
    packages: []
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
      rideType: 'Oneway',
      category: categories[0]?.name || '',
      sourceCity: '',
      destinationCity: '',
      state: '',
      city: '',
      baseFare: 0,
      perKmRate: 0,
      fixedFare: 0,
      minKmsPerDay: 250,
      driverAllowance: 250,
      nightAllowance: 250,
      packages: []
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
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Pricing Management</h1>
          <p className="text-sm text-gray-500 font-medium">Configure route-wise, distance-based, and rental pricing.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-100"
        >
          <Plus size={18} /> Add Pricing Rule
        </button>
      </div>

      {/* Default Category Pricing */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            <Car size={20} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Default Category Rates</h3>
            <p className="text-xs text-gray-500">Update standard base and per-km rates for each vehicle type.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <div key={cat._id} className="p-4 bg-gray-50/50 rounded-xl border border-gray-100 flex flex-col gap-3">
              <span className="text-sm font-bold text-gray-900">{cat.displayName}</span>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <input 
                    type="number"
                    defaultValue={cat.baseFare}
                    onBlur={async (e) => {
                      const newValue = parseFloat(e.target.value);
                      if (newValue === cat.baseFare) return;
                      try {
                        const res = await fetch(`${API_BASE_URL}/car-categories/${cat._id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ baseFare: newValue })
                        });
                        if (!res.ok) throw new Error('Failed');
                        fetchData();
                      } catch (err) { alert(err.message); }
                    }}
                    className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-[10px] font-bold outline-none focus:ring-2 focus:ring-primary-100"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-bold text-gray-400">Base</span>
                </div>
                <div className="relative">
                  <input 
                    type="number"
                    defaultValue={cat.perKmRate}
                    onBlur={async (e) => {
                      const newValue = parseFloat(e.target.value);
                      if (newValue === cat.perKmRate) return;
                      try {
                        const res = await fetch(`${API_BASE_URL}/car-categories/${cat._id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ perKmRate: newValue })
                        });
                        if (!res.ok) throw new Error('Failed');
                        fetchData();
                      } catch (err) { alert(err.message); }
                    }}
                    className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-[10px] font-bold outline-none focus:ring-2 focus:ring-primary-100"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-bold text-gray-400">/km</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Global Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
              <Zap size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Global Pricing Multiplier</h3>
              <p className="text-xs text-gray-500">Apply factor to all car pricing</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <input 
              type="number" step="0.1"
              value={globalMultiplier}
              onChange={(e) => setGlobalMultiplier(e.target.value)}
              className="w-32 bg-gray-50 border-gray-100 rounded-xl px-4 py-2.5 font-bold text-gray-900 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
            />
            <button 
              onClick={() => updateGlobalSetting('globalMultiplier', parseFloat(globalMultiplier))}
              className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-all shadow-lg shadow-orange-100"
            >
              <Save size={18} /> Update
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600">
              <Globe size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Global Advance Payment</h3>
              <p className="text-xs text-gray-500">Default advance percentage for bookings</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input 
                type="number"
                value={advancePercentage}
                onChange={(e) => setAdvancePercentage(e.target.value)}
                className="w-32 bg-gray-50 border-gray-100 rounded-xl px-4 py-2.5 font-bold text-gray-900 focus:ring-2 focus:ring-primary-100 outline-none transition-all pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-gray-400">%</span>
            </div>
            <button 
              onClick={() => updateGlobalSetting('advancePercentage', parseInt(advancePercentage))}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-100"
            >
              <Save size={18} /> Set
            </button>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Type / Route</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Pricing</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Details</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pricingRules.length > 0 ? (
                pricingRules.map((rule) => (
                  <tr key={rule._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className={`w-fit px-1.5 py-0.5 rounded text-[8px] font-black uppercase mb-1 ${
                          rule.rideType === 'Oneway' ? 'bg-blue-50 text-blue-600' : 
                          rule.rideType === 'Roundtrip' ? 'bg-purple-50 text-purple-600' : 'bg-orange-50 text-orange-600'
                        }`}>
                          {rule.rideType}
                        </span>
                        {rule.sourceCity && rule.destinationCity ? (
                          <span className="text-sm font-bold text-gray-900">{rule.sourceCity} → {rule.destinationCity}</span>
                        ) : rule.city ? (
                          <span className="text-sm font-bold text-gray-900">{rule.city} ({rule.state})</span>
                        ) : (
                          <span className="text-sm font-bold text-gray-900">{rule.state} (State-wide)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-700">{rule.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      {rule.fixedFare > 0 ? (
                        <span className="text-sm font-bold text-gray-900">₹{rule.fixedFare} (Fixed)</span>
                      ) : (
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-900">₹{rule.perKmRate}/km</span>
                          <span className="text-[10px] text-gray-500">Base: ₹{rule.baseFare}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {rule.rideType === 'Roundtrip' ? (
                        <div className="text-[10px] space-y-0.5 font-medium text-gray-500">
                          <div>Min Kms: {rule.minKmsPerDay}/day</div>
                          <div>Driver: ₹{rule.driverAllowance}</div>
                        </div>
                      ) : rule.rideType === 'Local' ? (
                        <span className="text-[10px] text-gray-500 font-medium">{rule.packages?.length} Packages</span>
                      ) : (
                        <span className="text-[10px] text-gray-400">N/A</span>
                      )}
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
                  <label className="block text-xs font-black text-gray-500 uppercase mb-2">Ride Type</label>
                  <select 
                    value={formData.rideType}
                    onChange={(e) => setFormData({...formData, rideType: e.target.value})}
                    className="w-full bg-gray-50 border-gray-100 rounded-xl px-4 py-3 font-bold text-gray-900 outline-none focus:ring-2 focus:ring-primary-100"
                  >
                    <option value="Oneway">Oneway</option>
                    <option value="Roundtrip">Roundtrip</option>
                    <option value="Local">Local Rental</option>
                    <option value="Airport">Airport</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase mb-2">Car Category</label>
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

              {/* Route Specific Fields */}
              {(formData.rideType === 'Oneway' || formData.rideType === 'Roundtrip') && (
                <div className="space-y-4 p-4 bg-blue-50/30 rounded-2xl border border-blue-50">
                  <div className="flex items-center gap-2 text-blue-600 mb-2">
                    <Info size={14} />
                    <span className="text-[10px] font-black uppercase tracking-wider">Route Info (Leave cities empty for general state/city rules)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input 
                      placeholder="Source City"
                      value={formData.sourceCity}
                      onChange={(e) => setFormData({...formData, sourceCity: e.target.value})}
                      className="bg-white border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold outline-none"
                    />
                    <input 
                      placeholder="Destination City"
                      value={formData.destinationCity}
                      onChange={(e) => setFormData({...formData, destinationCity: e.target.value})}
                      className="bg-white border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input 
                      placeholder="State Override"
                      value={formData.state}
                      onChange={(e) => setFormData({...formData, state: e.target.value})}
                      className="bg-white border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold outline-none"
                    />
                    <input 
                      placeholder="City Override"
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      className="bg-white border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold outline-none"
                    />
                  </div>
                </div>
              )}

              {formData.rideType === 'Local' && (
                <div className="space-y-4 p-4 bg-orange-50/30 rounded-2xl border border-orange-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-orange-600 uppercase tracking-wider">Rental Packages</span>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, packages: [...formData.packages, { hours: 8, kms: 80, price: 0 }]})}
                      className="text-[10px] font-bold text-orange-600 bg-white px-2 py-1 rounded-lg border border-orange-100 hover:bg-orange-100"
                    >
                      + Add Package
                    </button>
                  </div>
                  {formData.packages.map((pkg, idx) => (
                    <div key={idx} className="grid grid-cols-4 gap-2">
                      <input 
                        type="number" placeholder="Hrs"
                        value={pkg.hours}
                        onChange={(e) => {
                          const newPkgs = [...formData.packages];
                          newPkgs[idx].hours = e.target.value;
                          setFormData({...formData, packages: newPkgs});
                        }}
                        className="bg-white border-gray-100 rounded-lg px-2 py-1.5 text-xs font-bold outline-none"
                      />
                      <input 
                        type="number" placeholder="Kms"
                        value={pkg.kms}
                        onChange={(e) => {
                          const newPkgs = [...formData.packages];
                          newPkgs[idx].kms = e.target.value;
                          setFormData({...formData, packages: newPkgs});
                        }}
                        className="bg-white border-gray-100 rounded-lg px-2 py-1.5 text-xs font-bold outline-none"
                      />
                      <input 
                        type="number" placeholder="Price"
                        value={pkg.price}
                        onChange={(e) => {
                          const newPkgs = [...formData.packages];
                          newPkgs[idx].price = e.target.value;
                          setFormData({...formData, packages: newPkgs});
                        }}
                        className="bg-white border-gray-100 rounded-lg px-2 py-1.5 text-xs font-bold outline-none"
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          const newPkgs = formData.packages.filter((_, i) => i !== idx);
                          setFormData({...formData, packages: newPkgs});
                        }}
                        className="text-red-400 hover:text-red-600 flex items-center justify-center"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Fixed Fare</label>
                  <input 
                    type="number" value={formData.fixedFare}
                    onChange={(e) => setFormData({...formData, fixedFare: e.target.value})}
                    className="w-full bg-gray-50 border-gray-100 rounded-xl px-4 py-2.5 font-bold text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Base Fare</label>
                  <input 
                    type="number" value={formData.baseFare}
                    onChange={(e) => setFormData({...formData, baseFare: e.target.value})}
                    className="w-full bg-gray-50 border-gray-100 rounded-xl px-4 py-2.5 font-bold text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Per KM Rate</label>
                  <input 
                    type="number" value={formData.perKmRate}
                    onChange={(e) => setFormData({...formData, perKmRate: e.target.value})}
                    className="w-full bg-gray-50 border-gray-100 rounded-xl px-4 py-2.5 font-bold text-sm outline-none"
                  />
                </div>
              </div>

              {formData.rideType === 'Roundtrip' && (
                <div className="grid grid-cols-3 gap-4 p-4 bg-purple-50/30 rounded-2xl border border-purple-50">
                  <div>
                    <label className="block text-[10px] font-black text-purple-400 uppercase mb-1">Min KM/Day</label>
                    <input 
                      type="number" value={formData.minKmsPerDay}
                      onChange={(e) => setFormData({...formData, minKmsPerDay: e.target.value})}
                      className="w-full bg-white border-gray-100 rounded-xl px-4 py-2.5 font-bold text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-purple-400 uppercase mb-1">Driver Daily</label>
                    <input 
                      type="number" value={formData.driverAllowance}
                      onChange={(e) => setFormData({...formData, driverAllowance: e.target.value})}
                      className="w-full bg-white border-gray-100 rounded-xl px-4 py-2.5 font-bold text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-purple-400 uppercase mb-1">Night Allw.</label>
                    <input 
                      type="number" value={formData.nightAllowance}
                      onChange={(e) => setFormData({...formData, nightAllowance: e.target.value})}
                      className="w-full bg-white border-gray-100 rounded-xl px-4 py-2.5 font-bold text-sm outline-none"
                    />
                  </div>
                </div>
              )}

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

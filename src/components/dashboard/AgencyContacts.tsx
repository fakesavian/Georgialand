import React, { useState } from 'react';
import { Phone, Mail, ExternalLink, MessageSquare, Building2, MapPin } from 'lucide-react';
import { LandProperty } from '../../types';

interface AgencyContactsProps {
  properties: LandProperty[];
  onPropertyClick: (p: LandProperty) => void;
}

interface AgencyGroup {
  name: string;
  email: string;
  phone: string;
  formUrl: string;
  properties: LandProperty[];
}

export default function AgencyContacts({ properties, onPropertyClick }: AgencyContactsProps) {
  // Group properties by Contact_Agency_Name or Source_Agency
  const groups = React.useMemo(() => {
    const agGroups: Record<string, AgencyGroup> = {};

    properties.forEach(p => {
      const agencyName = p.Contact_Agency_Name || p.Source_Agency || 'Unknown Local Government / Authority';
      const email = p.Contact_Email || 'Needs verification';
      const phone = p.Contact_Phone || 'Needs verification';
      const formUrl = p.Contact_Form_URL || p.Source_URL || '';

      if (!agGroups[agencyName]) {
        agGroups[agencyName] = {
          name: agencyName,
          email,
          phone,
          formUrl,
          properties: []
        };
      }

      // Sync/update contact details if a row has verified info
      if (email !== 'Needs verification' && agGroups[agencyName].email === 'Needs verification') {
        agGroups[agencyName].email = email;
      }
      if (phone !== 'Needs verification' && agGroups[agencyName].phone === 'Needs verification') {
        agGroups[agencyName].phone = phone;
      }
      if (formUrl && !agGroups[agencyName].formUrl) {
        agGroups[agencyName].formUrl = formUrl;
      }

      agGroups[agencyName].properties.push(p);
    });

    return Object.values(agGroups).sort((a, b) => b.properties.length - a.properties.length);
  }, [properties]);

  // Track active call script index for each agency card
  const [selectedPropIds, setSelectedPropIds] = useState<Record<string, string>>({});

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Building2 className="text-brand-500" size={20} />
            Agency Contact Directory
          </h2>
          <p className="text-sm text-olive-400 mt-1">
            Grouped by public agency with direct contacts, associated parcels, and custom call scripts.
          </p>
        </div>
        <div className="bg-olive-900 border border-surface-border rounded-lg px-4 py-2 text-xs text-olive-400 font-mono">
          Total Agencies: <span className="text-brand-400 font-display font-bold">{groups.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {groups.map(group => {
          const selectedPropId = selectedPropIds[group.name] || group.properties[0]?.Listing_ID || '';
          const selectedProperty = group.properties.find(p => p.Listing_ID === selectedPropId) || group.properties[0];
          
          const hasEmail = group.email && group.email !== 'Needs verification';
          const hasPhone = group.phone && group.phone !== 'Needs verification';
          const hasForm = group.formUrl && group.formUrl.startsWith('http');

          return (
            <div key={group.name} className="card p-5 space-y-4 border border-gray-850 flex flex-col justify-between">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-bold text-white leading-tight">{group.name}</h3>
                  <span className="bg-green-900/30 text-brand-400 border border-brand-800 text-xs px-2 py-0.5 rounded-full font-medium font-mono">
                    {group.properties.length} Lot{group.properties.length > 1 ? 's' : ''}
                  </span>
                </div>

                {/* Contact Pills */}
                <div className="flex flex-wrap gap-2 text-xs">
                  <a
                    href={hasPhone ? `tel:${group.phone}` : undefined}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
                      hasPhone
                        ? 'bg-olive-800 hover:bg-olive-700 text-olive-100 border-olive-700'
                        : 'bg-olive-900/50 text-olive-600 border-gray-850 cursor-not-allowed'
                    }`}
                  >
                    <Phone size={12} />
                    {group.phone}
                  </a>

                  <a
                    href={hasEmail ? `mailto:${group.email}` : undefined}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
                      hasEmail
                        ? 'bg-olive-800 hover:bg-olive-700 text-olive-100 border-olive-700'
                        : 'bg-olive-900/50 text-olive-600 border-gray-850 cursor-not-allowed'
                    }`}
                  >
                    <Mail size={12} />
                    {group.email}
                  </a>

                  <a
                    href={hasForm ? group.formUrl : undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
                      hasForm
                        ? 'bg-green-900/20 hover:bg-green-900/40 text-green-300 border-brand-800'
                        : 'bg-olive-900/50 text-olive-600 border-gray-850 cursor-not-allowed'
                    }`}
                  >
                    <ExternalLink size={12} />
                    Portal Form
                  </a>
                </div>

                {/* Associated Listings */}
                <div className="space-y-1.5">
                  <label className="block text-xs text-olive-500 uppercase tracking-wider font-medium">Associated Listings</label>
                  <div className="max-h-28 overflow-y-auto space-y-1 pr-1 border border-surface-border rounded-lg p-1.5 bg-olive-950">
                    {group.properties.map(p => (
                      <button
                        key={p.Listing_ID}
                        onClick={() => onPropertyClick(p)}
                        className="w-full text-left flex items-center justify-between text-xs px-2 py-1.5 rounded hover:bg-olive-900 transition-colors"
                      >
                        <span className="text-olive-200 font-medium truncate max-w-[220px]">
                          {p.Property_Name_or_Address}
                        </span>
                        <span className="text-brand-400 font-mono font-medium">
                          {p.Estimated_Price_or_Min_Bid}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Script Selector & Script */}
                {selectedProperty && (
                  <div className="bg-olive-950 border border-surface-border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-olive-500 font-medium flex items-center gap-1">
                        <MessageSquare size={12} className="text-brand-400" />
                        Next Call Script
                      </span>
                      {group.properties.length > 1 && (
                        <select
                          value={selectedPropId}
                          onChange={e => setSelectedPropIds({ ...selectedPropIds, [group.name]: e.target.value })}
                          className="bg-olive-900 border border-olive-700 text-olive-200 text-[10px] rounded px-1 py-0.5 max-w-[150px]"
                        >
                          {group.properties.map(p => (
                            <option key={p.Listing_ID} value={p.Listing_ID}>
                              {p.Listing_ID}: {p.Property_Name_or_Address.slice(0, 15)}...
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    <p className="text-xs text-olive-200 italic leading-relaxed bg-olive-900/60 p-2 border border-surface-border/40 rounded">
                      "{selectedProperty.Next_Call_Script || `Hello, I'm calling to inquire about parcels available in your land bank inventory. Please let me know the application guidelines. Thank you.`}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

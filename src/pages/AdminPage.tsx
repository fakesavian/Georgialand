import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layers, Upload, Database, CheckCircle2, AlertTriangle, X, ClipboardList, FlaskConical, RotateCcw } from 'lucide-react';
import Papa from 'papaparse';
import { generateDigest } from '../lib/alertDigest';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { AccessLevel } from '../lib/authTypes';
import { getTierLabel } from '../lib/auth';

const PROTECTED_DATASET_BUCKET = 'protected-datasets';
const MASTER_DATASET_FILENAME = 'georgia_low_cost_land_opportunities_enriched.csv';
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

const TEST_TIER_OPTIONS: { level: AccessLevel; label: string; desc: string }[] = [
  { level: 'free_preview', label: 'Free Tier', desc: '10-lead preview, limited filters' },
  { level: 'dashboard_starter', label: 'Starter', desc: 'Full database, basic workflow' },
  { level: 'dashboard_pro', label: 'Pro', desc: 'Notes, advanced filters, parcel layers' },
  { level: 'dashboard_investor', label: 'Investor', desc: 'Exports, pipeline, bulk tools' },
];

export default function AdminPage() {
  const { accessLevel, realAccessLevel, isAdminTestMode, setTestTierOverride } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [lastUploadedAt, setLastUploadedAt] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Email Preview State
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [generatingPreview, setGeneratingPreview] = useState(false);

  const handleGenerateDigest = async () => {
    setGeneratingPreview(true);
    try {
      // Fetch the master CSV from protected storage to use as candidates
      const { data, error } = await supabase.storage
        .from(PROTECTED_DATASET_BUCKET)
        .download(MASTER_DATASET_FILENAME);
      
      if (error) throw error;
      const csvText = await data.text();
      
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          // Mock some preferences for the preview
          const mockPrefs = {
            counties: ['Fulton', 'DeKalb', 'Clayton'],
            acquisition_types: ['Land Bank', 'Tax Deed'],
            max_price_category: 'Under $25k',
            min_fit_score: 50
          };
          
          // Map CSV rows to PropertyData format
          const properties = results.data.map((row: any) => ({
            parcel_id: row['Parcel ID'] || 'Unknown',
            address: row['Address'] || row['Property Address'] || 'N/A',
            city: row['City'] || 'N/A',
            county: row['County'] || 'N/A',
            price: row['Price'] || row['Estimated Value'] || '$0',
            acquisition_type: row['Acquisition Type'] || row['Source'] || 'Unknown',
            fit_score: parseInt(row['Fit Score']) || 0,
            risk_score: parseInt(row['Risk Score']) || 0
          }));

          const html = generateDigest(mockPrefs, properties, import.meta.env.VITE_SITE_URL || 'https://georgialandfinder.com');
          setPreviewHtml(html);
          setGeneratingPreview(false);
        },
        error: (parseError: Error) => {
          throw parseError;
        }
      });
    } catch (err) {
      console.error(err);
      setGeneratingPreview(false);
      alert(`Failed to generate preview. Make sure ${MASTER_DATASET_FILENAME} exists in the protected Supabase bucket.`);
    }
  };

  const validateUploadFile = (candidate: File): string | null => {
    const isCsv = candidate.name.toLowerCase().endsWith('.csv') || candidate.type === 'text/csv';

    if (!isCsv) {
      return 'Please select a CSV file.';
    }

    if (candidate.size === 0) {
      return 'The selected CSV file is empty.';
    }

    if (candidate.size > MAX_UPLOAD_BYTES) {
      return 'The selected CSV is too large. Maximum size is 25 MB.';
    }

    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] ?? null;
    setSuccess(false);
    setUploadError(null);

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const validationError = validateUploadFile(selectedFile);
    if (validationError) {
      setFile(null);
      setUploadError(validationError);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const validationError = validateUploadFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    setUploading(true);
    setSuccess(false);
    setUploadError(null);

    try {
      const { error } = await supabase.storage
        .from(PROTECTED_DATASET_BUCKET)
        .upload(MASTER_DATASET_FILENAME, file, {
          cacheControl: '60',
          contentType: 'text/csv',
          upsert: true,
        });

      if (error) throw error;

      setSuccess(true);
      setLastUploadedAt(new Date().toLocaleString());
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      console.error('Dataset upload failed:', err);
      setUploadError(err?.message || 'Dataset upload failed. Check Supabase Storage policies and try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-olive-950 text-olive-50 font-sans">
      <nav className="border-b border-surface-border bg-olive-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Layers className="text-olive-600" size={24} />
            <span className="font-display font-bold text-lg text-olive-400 tracking-tight">Admin Dashboard</span>
          </Link>
          <div className="flex items-center gap-6 text-sm font-semibold">
            <Link to="/admin/review" className="text-olive-300 hover:text-white transition-colors">Dataset Review</Link>
            <Link to="/dashboard" className="text-olive-300 hover:text-white transition-colors">Return to App</Link>
          </div>
        </div>
      </nav>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="mb-12 flex items-center gap-4">
            <Database className="text-brand-500" size={32} />
            <h1 className="text-3xl font-display font-bold text-white tracking-tight">Data Management</h1>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="card">
              <h3 className="text-xl font-display font-bold text-white mb-3">Upload Master CSV</h3>
              <p className="text-sm text-olive-400 mb-8 leading-relaxed">
                Upload the enriched dataset to the private Supabase bucket. This replaces <code className="text-brand-300">{MASTER_DATASET_FILENAME}</code> and feeds paid dashboard access.
              </p>
              
              {success && (
                <div className="mb-6 p-4 bg-accent-success/10 border border-accent-success/30 rounded-lg flex items-start gap-3">
                  <CheckCircle2 className="text-accent-success shrink-0 mt-0.5" size={18} />
                  <div>
                    <p className="text-accent-success font-bold text-sm">Upload Successful</p>
                    <p className="text-accent-success/70 text-xs mt-1">
                      The protected master dataset has been updated{lastUploadedAt ? ` at ${lastUploadedAt}` : ''}.
                    </p>
                  </div>
                </div>
              )}

              {uploadError && (
                <div className="mb-6 p-4 bg-red-950/40 border border-red-800/50 rounded-lg flex items-start gap-3">
                  <AlertTriangle className="text-red-300 shrink-0 mt-0.5" size={18} />
                  <div>
                    <p className="text-red-200 font-bold text-sm">Upload Failed</p>
                    <p className="text-red-100/80 text-xs mt-1">{uploadError}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleUpload}>
                <div className="mb-6">
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept=".csv,text/csv" 
                    onChange={handleFileChange}
                    className="block w-full text-sm text-olive-400
                      file:mr-4 file:py-2.5 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-olive-800 file:text-olive-200
                      hover:file:bg-olive-700
                      cursor-pointer"
                  />
                  {file && (
                    <p className="text-xs text-olive-500 mt-3">
                      Selected: <span className="text-olive-300">{file.name}</span> ({(file.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>
                <button 
                  type="submit" 
                  disabled={!file || uploading}
                  className="w-full btn-primary py-3 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading to protected storage...' : <><Upload size={18} /> Upload Dataset</>}
                </button>
              </form>
            </div>

            <div className="card space-y-6">
              <div>
                <h3 className="text-xl font-display font-bold text-white mb-3">Generate Assets</h3>
                <p className="text-sm text-olive-400 mb-6 leading-relaxed">Trigger the backend to generate the latest free sample and paid reports based on the metadata.</p>
                <div className="space-y-4">
                  <button className="w-full text-left px-4 py-3 bg-olive-950 hover:bg-olive-800 border border-surface-border rounded-lg text-sm text-olive-200 font-semibold transition-colors">
                    Generate 10-Lead Sample (CSV/MD)
                  </button>
                  <button className="w-full text-left px-4 py-3 bg-olive-950 hover:bg-olive-800 border border-surface-border rounded-lg text-sm text-olive-200 font-semibold transition-colors">
                    Generate Paid Report (CSV/MD)
                  </button>
                  <button 
                    onClick={handleGenerateDigest}
                    disabled={generatingPreview}
                    className="w-full text-left px-4 py-3 bg-olive-950 hover:bg-olive-800 border border-surface-border rounded-lg text-sm text-olive-200 font-semibold transition-colors flex items-center justify-between disabled:opacity-50"
                  >
                    <span>{generatingPreview ? 'Generating...' : 'Generate Alert Digest Preview'}</span>
                    <AlertTriangle size={16} className="text-brand-500" />
                  </button>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-xl font-display font-bold text-white mb-3">Gold Dataset Review</h3>
              <p className="text-sm text-olive-400 mb-6 leading-relaxed">
                Inspect the 16 gold candidates from the enriched pipeline. View readiness scores, verification levels, and per-row blockers before promoting to production.
              </p>
              <Link
                to="/admin/review"
                className="w-full btn-primary py-3 justify-center flex items-center gap-2"
              >
                <ClipboardList size={18} /> Open Dataset Review
              </Link>
            </div>

            <div className="card">
              <h3 className="text-xl font-display font-bold text-white mb-3">Sponsor Management</h3>
              <p className="text-sm text-olive-400 mb-6 leading-relaxed">Manage active sponsorships and resource partner links across the dashboard, reports, and alerts.</p>
              <div className="space-y-4">
                <button
                  disabled
                  className="w-full text-left px-4 py-3 bg-olive-950/50 border border-surface-border rounded-lg text-sm text-olive-500 font-semibold cursor-not-allowed flex items-center justify-between"
                >
                  <span>Manage Active Sponsors</span>
                  <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 bg-brand-900/30 text-brand-500 rounded">Coming Soon</span>
                </button>
              </div>
            </div>

          </div>

          {/* Admin Test Tier Switcher — always last, full-width */}
          <div className="mt-8 card border-amber-500/30 bg-amber-500/5">
            <div className="flex items-center gap-3 mb-1">
              <FlaskConical className="text-amber-400" size={20} />
              <h3 className="text-xl font-display font-bold text-white">Test Tier Switcher</h3>
            </div>
            <p className="text-sm text-amber-300/70 mb-1">
              Admin test mode — does not change Stripe billing or your actual subscription.
            </p>
            <p className="text-xs text-olive-500 mb-6">
              Override the effective UI tier for this browser session only. The real tier ({' '}
              <span className="font-mono text-olive-300">{realAccessLevel}</span>{' '}
              ) is used for admin route access and billing. Override resets on browser close.
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {TEST_TIER_OPTIONS.map(({ level, label, desc }) => {
                const isActive = accessLevel === level && isAdminTestMode;
                const isReal = realAccessLevel === level && !isAdminTestMode;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setTestTierOverride(level)}
                    className={`text-left px-4 py-3 rounded-lg border text-sm font-semibold transition-all ${
                      isActive
                        ? 'border-amber-500 bg-amber-500/15 text-amber-200'
                        : isReal
                          ? 'border-brand-500/60 bg-brand-500/10 text-brand-200'
                          : 'border-olive-700 bg-olive-950/60 text-olive-300 hover:border-olive-500 hover:text-white'
                    }`}
                  >
                    <span className="block font-bold">{label}</span>
                    <span className="block text-xs mt-0.5 font-normal opacity-70">{desc}</span>
                    {isActive && <span className="block text-[10px] mt-1 font-black uppercase tracking-wide text-amber-400">Test active</span>}
                    {isReal && !isAdminTestMode && <span className="block text-[10px] mt-1 font-black uppercase tracking-wide text-brand-400">Real tier</span>}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-olive-400">
                {isAdminTestMode
                  ? <>Effective: <span className="font-mono text-amber-300 font-bold">{getTierLabel(accessLevel)}</span> &nbsp;·&nbsp; Real: <span className="font-mono text-olive-300">{getTierLabel(realAccessLevel)}</span></>
                  : <>Using real tier: <span className="font-mono text-brand-300 font-bold">{getTierLabel(realAccessLevel)}</span></>
                }
              </div>
              <button
                type="button"
                onClick={() => setTestTierOverride(null)}
                disabled={!isAdminTestMode}
                className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg border border-olive-700 bg-olive-900/60 text-olive-300 hover:border-olive-500 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <RotateCcw size={12} /> Use real account tier
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Email Preview Modal */}
      {previewHtml && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-olive-950/80 backdrop-blur-sm">
          <div className="bg-olive-900 border border-surface-border rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-surface-border bg-olive-950">
              <h3 className="font-display font-bold text-white">Email Preview: Weekly Digest</h3>
              <button 
                onClick={() => setPreviewHtml(null)}
                className="text-olive-400 hover:text-white p-1 rounded-md hover:bg-olive-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 bg-olive-950 border-b border-surface-border text-xs text-olive-400 font-mono">
              <div><strong>To:</strong> mock_investor@example.com</div>
              <div><strong>Subject:</strong> Your Weekly Land Alerts (10 New Matches)</div>
            </div>

            <div className="flex-1 overflow-y-auto bg-white">
              {/* Injecting the generated digest HTML for preview. Dynamic property fields are escaped in generateDigest(). */}
              <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

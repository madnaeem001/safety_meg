import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Award, Shield, CheckCircle2, Download, Share2, Eye, 
  Calendar, Clock, User, Building2, Lock, ChevronRight, QrCode,
  Fingerprint, Key, AlertCircle, Copy, ExternalLink, Printer
} from 'lucide-react';

// Certificate interface
interface Certificate {
  id: string;
  documentId: string;
  documentTitle: string;
  documentType: string;
  signedBy: string;
  signerRole: string;
  signerEmail: string;
  signedAt: string;
  expiresAt?: string;
  signature: string;
  certificateHash: string;
  ipAddress: string;
  deviceInfo: string;
  status: 'valid' | 'expired' | 'revoked';
  verificationUrl: string;
}

// Mock certificates
const mockCertificates: Certificate[] = [
  {
    id: 'CERT-2026-001',
    documentId: 'JSA-2026-001',
    documentTitle: 'Forklift Operation and Loading JSA',
    documentType: 'Job Safety Analysis',
    signedBy: 'John Smith',
    signerRole: 'Supervisor',
    signerEmail: 'john.smith@company.com',
    signedAt: '2026-01-25T10:30:00Z',
    expiresAt: '2027-01-25T10:30:00Z',
    signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    certificateHash: 'SHA256:a7f4c2b8d9e1f3a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9',
    ipAddress: '192.168.1.100',
    deviceInfo: 'Chrome 120, Windows 11',
    status: 'valid',
    verificationUrl: 'https://verify.ehs-platform.com/CERT-2026-001',
  },
  {
    id: 'CERT-2026-002',
    documentId: 'INC-2026-003',
    documentTitle: 'Chemical Spill Investigation Report',
    documentType: 'Incident Report',
    signedBy: 'Sarah Johnson',
    signerRole: 'Safety Officer',
    signerEmail: 'sarah.johnson@company.com',
    signedAt: '2026-01-24T14:45:00Z',
    signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    certificateHash: 'SHA256:b8e5d3c9a0f2e4b6c8d0e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b4',
    ipAddress: '192.168.1.105',
    deviceInfo: 'Safari 17, macOS Sonoma',
    status: 'valid',
    verificationUrl: 'https://verify.ehs-platform.com/CERT-2026-002',
  },
  {
    id: 'CERT-2025-089',
    documentId: 'PTW-2025-156',
    documentTitle: 'Hot Work Permit - Boiler Room',
    documentType: 'Permit to Work',
    signedBy: 'Mike Davis',
    signerRole: 'Area Supervisor',
    signerEmail: 'mike.davis@company.com',
    signedAt: '2025-06-15T09:00:00Z',
    expiresAt: '2025-12-15T09:00:00Z',
    signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    certificateHash: 'SHA256:c9f6e4d0b1a3c5e7f9a1b3c5d7e9f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5',
    ipAddress: '192.168.1.110',
    deviceInfo: 'Edge 119, Windows 10',
    status: 'expired',
    verificationUrl: 'https://verify.ehs-platform.com/CERT-2025-089',
  },
];

interface ESignatureCertificateProps {
  onBack?: () => void;
  documentId?: string;
  signature?: string;
  signerName?: string;
  signerRole?: string;
}

export const ESignatureCertificate: React.FC<ESignatureCertificateProps> = ({
  onBack,
  documentId,
  signature,
  signerName,
  signerRole,
}) => {
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationResult, setVerificationResult] = useState<'valid' | 'invalid' | null>(null);
  const certificateRef = useRef<HTMLDivElement>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid': return 'bg-green-100 text-green-700 border-green-200';
      case 'expired': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'revoked': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-surface-overlay text-text-secondary border-surface-border';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid': return <CheckCircle2 className="w-4 h-4" />;
      case 'expired': return <Clock className="w-4 h-4" />;
      case 'revoked': return <AlertCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const handleVerification = () => {
    // Simulate verification
    const isValid = mockCertificates.some(cert => 
      cert.id === verificationCode || cert.certificateHash.includes(verificationCode)
    );
    setVerificationResult(isValid ? 'valid' : 'invalid');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-surface-base p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-surface-raised/80 rounded-xl transition-colors"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
            )}
            <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
              <Award className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">E-Signature Certificates</h1>
              <p className="text-sm text-text-muted">Digital signature verification and certificates</p>
            </div>
          </div>

          <button
            onClick={() => setShowVerificationModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl shadow-sm hover:shadow-md transition-all text-sm"
          >
            <Shield className="w-4 h-4" />
            Verify Certificate
          </button>
        </motion.div>

        {/* Certificate List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Certificates List */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="font-semibold text-text-primary">Recent Certificates</h3>
            {mockCertificates.map((cert) => (
              <motion.div
                key={cert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => setSelectedCertificate(cert)}
                className={`bg-surface-raised rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer border-2 ${
                  selectedCertificate?.id === cert.id ? 'border-emerald-500' : 'border-transparent'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-text-muted" />
                    <span className="text-sm font-medium text-text-primary">{cert.id}</span>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(cert.status)}`}>
                    {getStatusIcon(cert.status)}
                    {cert.status.charAt(0).toUpperCase() + cert.status.slice(1)}
                  </span>
                </div>
                <p className="text-sm text-text-secondary mb-2 line-clamp-1">{cert.documentTitle}</p>
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <User className="w-3 h-3" />
                  <span>{cert.signedBy}</span>
                  <span>•</span>
                  <span>{new Date(cert.signedAt).toLocaleDateString()}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Certificate Detail */}
          <div className="lg:col-span-2">
            {selectedCertificate ? (
              <motion.div
                ref={certificateRef}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-surface-raised rounded-2xl shadow-lg overflow-hidden"
              >
                {/* Certificate Header */}
                <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-surface-raised/20 rounded-xl">
                        <Award className="w-8 h-8" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">Digital Signature Certificate</h2>
                        <p className="text-emerald-100 text-sm">Electronically signed and verified</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                      selectedCertificate.status === 'valid' 
                        ? 'bg-green-500/20 text-green-100' 
                        : 'bg-amber-500/20 text-amber-100'
                    }`}>
                      {getStatusIcon(selectedCertificate.status)}
                      {selectedCertificate.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="bg-surface-raised/10 rounded-xl p-4">
                    <p className="text-sm text-emerald-100">Certificate ID</p>
                    <p className="text-lg font-mono font-bold">{selectedCertificate.id}</p>
                  </div>
                </div>

                {/* Certificate Body */}
                <div className="p-6 space-y-6">
                  {/* Document Info */}
                  <div className="bg-surface-sunken rounded-xl p-4">
                    <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-emerald-600" />
                      Document Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-text-muted">Document ID</p>
                        <p className="font-medium text-text-primary">{selectedCertificate.documentId}</p>
                      </div>
                      <div>
                        <p className="text-text-muted">Document Type</p>
                        <p className="font-medium text-text-primary">{selectedCertificate.documentType}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-text-muted">Document Title</p>
                        <p className="font-medium text-text-primary">{selectedCertificate.documentTitle}</p>
                      </div>
                    </div>
                  </div>

                  {/* Signer Info */}
                  <div className="bg-surface-sunken rounded-xl p-4">
                    <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                      <User className="w-5 h-5 text-emerald-600" />
                      Signer Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-text-muted">Signed By</p>
                        <p className="font-medium text-text-primary">{selectedCertificate.signedBy}</p>
                      </div>
                      <div>
                        <p className="text-text-muted">Role</p>
                        <p className="font-medium text-text-primary">{selectedCertificate.signerRole}</p>
                      </div>
                      <div>
                        <p className="text-text-muted">Email</p>
                        <p className="font-medium text-text-primary">{selectedCertificate.signerEmail}</p>
                      </div>
                      <div>
                        <p className="text-text-muted">Signed At</p>
                        <p className="font-medium text-text-primary">{formatDate(selectedCertificate.signedAt)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Signature Preview */}
                  <div className="bg-surface-sunken rounded-xl p-4">
                    <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                      <Fingerprint className="w-5 h-5 text-emerald-600" />
                      Digital Signature
                    </h3>
                    <div className="bg-surface-raised rounded-xl border-2 border-dashed border-surface-border p-4 flex items-center justify-center">
                      <div className="text-center">
                        <div className="inline-block bg-surface-overlay rounded-lg p-4 mb-2">
                          <p className="font-script text-2xl text-text-secondary" style={{ fontFamily: 'cursive' }}>
                            {selectedCertificate.signedBy}
                          </p>
                        </div>
                        <p className="text-xs text-text-muted">Electronically Signed</p>
                      </div>
                    </div>
                  </div>

                  {/* Security Info */}
                  <div className="bg-surface-sunken rounded-xl p-4">
                    <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                      <Lock className="w-5 h-5 text-emerald-600" />
                      Security & Verification
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="text-text-muted mb-1">Certificate Hash (SHA-256)</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 bg-surface-raised px-3 py-2 rounded-lg text-xs font-mono text-text-secondary break-all border">
                            {selectedCertificate.certificateHash}
                          </code>
                          <button
                            onClick={() => copyToClipboard(selectedCertificate.certificateHash)}
                            className="p-2 hover:bg-surface-overlay rounded-lg transition-colors"
                            title="Copy hash"
                          >
                            <Copy className="w-4 h-4 text-text-muted" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-text-muted">IP Address</p>
                          <p className="font-medium text-text-primary">{selectedCertificate.ipAddress}</p>
                        </div>
                        <div>
                          <p className="text-text-muted">Device Info</p>
                          <p className="font-medium text-text-primary">{selectedCertificate.deviceInfo}</p>
                        </div>
                      </div>
                      {selectedCertificate.expiresAt && (
                        <div>
                          <p className="text-text-muted">Expires At</p>
                          <p className="font-medium text-text-primary">{formatDate(selectedCertificate.expiresAt)}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3 pt-4 border-t">
                    <button
                      onClick={handlePrint}
                      className="flex items-center gap-2 px-4 py-2 bg-surface-overlay hover:bg-surface-sunken rounded-xl text-sm font-medium text-text-primary transition-colors"
                    >
                      <Printer className="w-4 h-4" />
                      Print Certificate
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-surface-overlay hover:bg-surface-sunken rounded-xl text-sm font-medium text-text-primary transition-colors">
                      <Download className="w-4 h-4" />
                      Download PDF
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-surface-overlay hover:bg-surface-sunken rounded-xl text-sm font-medium text-text-primary transition-colors">
                      <Share2 className="w-4 h-4" />
                      Share
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-sm font-medium transition-colors">
                      <QrCode className="w-4 h-4" />
                      Generate QR Code
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-surface-raised rounded-2xl p-12 shadow-sm text-center">
                <Award className="w-16 h-16 text-text-muted mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-text-primary mb-2">Select a Certificate</h3>
                <p className="text-text-muted">Choose a certificate from the list to view details</p>
              </div>
            )}
          </div>
        </div>

        {/* Verification Modal */}
        <AnimatePresence>
          {showVerificationModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => {
                setShowVerificationModal(false);
                setVerificationResult(null);
                setVerificationCode('');
              }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-surface-raised rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
              >
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
                  <div className="flex items-center gap-3">
                    <Shield className="w-8 h-8" />
                    <div>
                      <h2 className="text-xl font-bold">Verify Certificate</h2>
                      <p className="text-emerald-100 text-sm">Enter certificate ID or hash</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Certificate ID or Hash
                    </label>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="e.g., CERT-2026-001 or SHA256:..."
                      className="w-full px-4 py-3 border border-surface-border rounded-xl bg-surface-sunken text-text-primary focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>

                  {verificationResult && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-xl flex items-center gap-3 ${
                        verificationResult === 'valid'
                          ? 'bg-success/10 text-success'
                          : 'bg-danger/10 text-danger'
                      }`}
                    >
                      {verificationResult === 'valid' ? (
                        <>
                          <CheckCircle2 className="w-6 h-6" />
                          <div>
                            <p className="font-semibold">Certificate Verified</p>
                            <p className="text-sm opacity-80">This certificate is valid and authentic</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-6 h-6" />
                          <div>
                            <p className="font-semibold">Verification Failed</p>
                            <p className="text-sm opacity-80">No matching certificate found</p>
                          </div>
                        </>
                      )}
                    </motion.div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => {
                        setShowVerificationModal(false);
                        setVerificationResult(null);
                        setVerificationCode('');
                      }}
                      className="flex-1 px-4 py-2 border border-surface-border rounded-xl text-text-secondary hover:bg-surface-sunken transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleVerification}
                      disabled={!verificationCode}
                      className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Verify
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ESignatureCertificate;

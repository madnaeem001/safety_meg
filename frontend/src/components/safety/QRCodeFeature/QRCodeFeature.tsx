import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  QrCode, Download, Share2, Copy, Eye, Printer, Search, Filter,
  ChevronRight, Plus, Smartphone, Camera, CheckCircle2, X, 
  FileText, ClipboardList, AlertTriangle, RefreshCw, ExternalLink, Scan
} from 'lucide-react';

// QR Code generation (simple canvas-based)
const generateQRMatrix = (data: string, size: number = 21): boolean[][] => {
  // Simplified QR-like pattern generator for demo
  const matrix: boolean[][] = [];
  const hash = data.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  for (let y = 0; y < size; y++) {
    matrix[y] = [];
    for (let x = 0; x < size; x++) {
      // Finder patterns (corners)
      const isFinderPattern = 
        (x < 7 && y < 7) || // Top-left
        (x >= size - 7 && y < 7) || // Top-right
        (x < 7 && y >= size - 7); // Bottom-left
      
      if (isFinderPattern) {
        const inOuter = (x < 7 && y < 7) ? 
          (x === 0 || x === 6 || y === 0 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4)) :
          (x >= size - 7) ?
            ((x === size - 7 || x === size - 1 || y === 0 || y === 6) || (x >= size - 5 && x <= size - 3 && y >= 2 && y <= 4)) :
            ((x === 0 || x === 6 || y === size - 7 || y === size - 1) || (x >= 2 && x <= 4 && y >= size - 5 && y <= size - 3));
        matrix[y][x] = inOuter;
      } else {
        // Data pattern based on hash
        matrix[y][x] = ((hash * (x + 1) * (y + 1)) % 7) < 3;
      }
    }
  }
  return matrix;
};

// QR Code Canvas Component
const QRCodeCanvas: React.FC<{ data: string; size?: number; color?: string }> = ({ 
  data, 
  size = 200, 
  color = '#1e293b' 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const qrSize = 21;
    const matrix = generateQRMatrix(data, qrSize);
    const cellSize = size / qrSize;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = color;
    for (let y = 0; y < qrSize; y++) {
      for (let x = 0; x < qrSize; x++) {
        if (matrix[y][x]) {
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      }
    }
  }, [data, size, color]);

  return <canvas ref={canvasRef} width={size} height={size} className="rounded-lg" />;
};

// Document types for QR codes
type DocumentType = 'jsa' | 'observation' | 'incident' | 'permit' | 'inspection';

interface QRDocument {
  id: string;
  type: DocumentType;
  title: string;
  createdAt: string;
  createdBy: string;
  location: string;
  status: 'active' | 'completed' | 'expired';
  qrData: string;
  scanCount: number;
  lastScanned?: string;
}

// Mock QR-enabled documents
const mockQRDocuments: QRDocument[] = [
  {
    id: 'JSA-2026-001',
    type: 'jsa',
    title: 'Forklift Operation and Loading',
    createdAt: '2026-01-20T09:00:00Z',
    createdBy: 'John Smith',
    location: 'Warehouse A',
    status: 'active',
    qrData: 'https://ehs.company.com/jsa/JSA-2026-001',
    scanCount: 45,
    lastScanned: '2026-01-25T14:30:00Z',
  },
  {
    id: 'JSA-2026-002',
    type: 'jsa',
    title: 'Hot Work - Welding Operations',
    createdAt: '2026-01-18T10:30:00Z',
    createdBy: 'Sarah Johnson',
    location: 'Maintenance Shop',
    status: 'active',
    qrData: 'https://ehs.company.com/jsa/JSA-2026-002',
    scanCount: 32,
    lastScanned: '2026-01-25T11:15:00Z',
  },
  {
    id: 'OBS-2026-015',
    type: 'observation',
    title: 'Safety Walk - Production Floor',
    createdAt: '2026-01-22T08:00:00Z',
    createdBy: 'Mike Davis',
    location: 'Production Building',
    status: 'completed',
    qrData: 'https://ehs.company.com/obs/OBS-2026-015',
    scanCount: 12,
    lastScanned: '2026-01-24T09:00:00Z',
  },
  {
    id: 'JSA-2026-003',
    type: 'jsa',
    title: 'Confined Space Entry - Tank Cleaning',
    createdAt: '2026-01-15T07:30:00Z',
    createdBy: 'Emily Chen',
    location: 'Tank Farm',
    status: 'active',
    qrData: 'https://ehs.company.com/jsa/JSA-2026-003',
    scanCount: 28,
    lastScanned: '2026-01-25T08:45:00Z',
  },
  {
    id: 'OBS-2026-016',
    type: 'observation',
    title: 'Housekeeping Inspection',
    createdAt: '2026-01-24T13:00:00Z',
    createdBy: 'Tom Anderson',
    location: 'Office Building',
    status: 'active',
    qrData: 'https://ehs.company.com/obs/OBS-2026-016',
    scanCount: 5,
    lastScanned: '2026-01-25T15:00:00Z',
  },
  {
    id: 'JSA-2025-089',
    type: 'jsa',
    title: 'Roof Access - Maintenance',
    createdAt: '2025-12-10T08:00:00Z',
    createdBy: 'Robert Wilson',
    location: 'Building C',
    status: 'expired',
    qrData: 'https://ehs.company.com/jsa/JSA-2025-089',
    scanCount: 67,
    lastScanned: '2026-01-05T10:30:00Z',
  },
];

interface QRCodeFeatureProps {
  onBack?: () => void;
}

export const QRCodeFeature: React.FC<QRCodeFeatureProps> = ({ onBack }) => {
  const [documents, setDocuments] = useState<QRDocument[]>(mockQRDocuments);
  const [selectedDocument, setSelectedDocument] = useState<QRDocument | null>(null);
  const [filter, setFilter] = useState<'all' | DocumentType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'expired'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter documents
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesType = filter === 'all' || doc.type === filter;
      const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
      const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.location.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesStatus && matchesSearch;
    });
  }, [documents, filter, statusFilter, searchQuery]);

  const getTypeIcon = (type: DocumentType) => {
    switch (type) {
      case 'jsa': return <ClipboardList className="w-5 h-5 text-blue-500" />;
      case 'observation': return <Eye className="w-5 h-5 text-green-500" />;
      case 'incident': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'permit': return <FileText className="w-5 h-5 text-purple-500" />;
      case 'inspection': return <CheckCircle2 className="w-5 h-5 text-amber-500" />;
      default: return <FileText className="w-5 h-5 text-slate-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 border-green-200';
      case 'completed': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'expired': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadQRCode = (doc: QRDocument) => {
    const canvas = document.createElement('canvas');
    const size = 400;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const qrSize = 21;
    const matrix = generateQRMatrix(doc.qrData, qrSize);
    const cellSize = size / qrSize;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#1e293b';
    for (let y = 0; y < qrSize; y++) {
      for (let x = 0; x < qrSize; x++) {
        if (matrix[y][x]) {
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      }
    }

    const link = document.createElement('a');
    link.download = `QR-${doc.id}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-4 md:p-6">
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
                className="p-2 hover:bg-white/80 rounded-xl transition-colors"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
            )}
            <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
              <QrCode className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">QR Code Management</h1>
              <p className="text-sm text-slate-500">Generate and manage QR codes for JSA & observations</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowScannerModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm hover:shadow-md transition-all text-sm"
            >
              <Camera className="w-4 h-4" />
              Scan QR
            </button>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl shadow-sm hover:shadow-md transition-all text-sm"
            >
              <Plus className="w-4 h-4" />
              Generate New
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total QR Codes', value: documents.length, icon: QrCode, color: 'bg-indigo-100 text-indigo-700' },
            { label: 'Active JSAs', value: documents.filter(d => d.type === 'jsa' && d.status === 'active').length, icon: ClipboardList, color: 'bg-blue-100 text-blue-700' },
            { label: 'Observations', value: documents.filter(d => d.type === 'observation').length, icon: Eye, color: 'bg-green-100 text-green-700' },
            { label: 'Total Scans', value: documents.reduce((acc, d) => acc + d.scanCount, 0), icon: Scan, color: 'bg-purple-100 text-purple-700' },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-xl p-4 shadow-sm"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color} mb-3`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
              <p className="text-sm text-slate-500">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex gap-2 flex-wrap">
            {[
              { id: 'all', label: 'All' },
              { id: 'jsa', label: 'JSA' },
              { id: 'observation', label: 'Observations' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  filter === tab.id
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 w-48"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc, idx) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => setSelectedDocument(doc)}
              className={`bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer border-2 ${
                selectedDocument?.id === doc.id ? 'border-indigo-500' : 'border-transparent'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getTypeIcon(doc.type)}
                  <span className="text-sm font-medium text-slate-800">{doc.id}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(doc.status)}`}>
                  {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                </span>
              </div>

              <h3 className="font-semibold text-slate-800 mb-2 line-clamp-1">{doc.title}</h3>
              <p className="text-sm text-slate-500 mb-3">{doc.location}</p>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Scan className="w-3 h-3" />
                  <span>{doc.scanCount} scans</span>
                </div>
                <span className="text-xs text-slate-400">{formatDate(doc.createdAt)}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Selected Document Detail */}
        <AnimatePresence>
          {selectedDocument && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-800">QR Code Details</h3>
                <button
                  onClick={() => setSelectedDocument(null)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* QR Code */}
                <div className="flex flex-col items-center">
                  <div className="bg-white p-4 rounded-xl border-2 border-slate-200 mb-4">
                    <QRCodeCanvas data={selectedDocument.qrData} size={200} />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-center">
                    <button
                      onClick={() => downloadQRCode(selectedDocument)}
                      className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                    <button
                      onClick={() => copyToClipboard(selectedDocument.qrData, selectedDocument.id)}
                      className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm transition-colors"
                    >
                      {copiedId === selectedDocument.id ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      {copiedId === selectedDocument.id ? 'Copied!' : 'Copy Link'}
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm transition-colors">
                      <Printer className="w-4 h-4" />
                      Print
                    </button>
                  </div>
                </div>

                {/* Document Info */}
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-500">Document ID</p>
                    <p className="font-semibold text-slate-800">{selectedDocument.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Title</p>
                    <p className="font-semibold text-slate-800">{selectedDocument.title}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">Type</p>
                      <p className="font-medium text-slate-800 capitalize">{selectedDocument.type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Status</p>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(selectedDocument.status)}`}>
                        {selectedDocument.status.charAt(0).toUpperCase() + selectedDocument.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">Location</p>
                      <p className="font-medium text-slate-800">{selectedDocument.location}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Created By</p>
                      <p className="font-medium text-slate-800">{selectedDocument.createdBy}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">Total Scans</p>
                      <p className="font-bold text-2xl text-indigo-600">{selectedDocument.scanCount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Last Scanned</p>
                      <p className="font-medium text-slate-800">
                        {selectedDocument.lastScanned ? formatDate(selectedDocument.lastScanned) : 'Never'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">QR Data URL</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-slate-100 px-3 py-2 rounded-lg text-slate-600 break-all">
                        {selectedDocument.qrData}
                      </code>
                      <a
                        href={selectedDocument.qrData}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 text-slate-500" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scanner Modal */}
        <AnimatePresence>
          {showScannerModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => setShowScannerModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
              >
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
                  <div className="flex items-center gap-3">
                    <Camera className="w-8 h-8" />
                    <div>
                      <h2 className="text-xl font-bold">Scan QR Code</h2>
                      <p className="text-indigo-100 text-sm">Point camera at a QR code</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="bg-slate-100 rounded-xl aspect-square flex items-center justify-center mb-4">
                    <div className="text-center">
                      <Smartphone className="w-16 h-16 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500">Camera access required</p>
                      <p className="text-sm text-slate-400">Use mobile device for best experience</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowScannerModal(false)}
                    className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Generate Modal */}
        <AnimatePresence>
          {showGenerateModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => setShowGenerateModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
              >
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
                  <div className="flex items-center gap-3">
                    <QrCode className="w-8 h-8" />
                    <div>
                      <h2 className="text-xl font-bold">Generate QR Code</h2>
                      <p className="text-indigo-100 text-sm">Create a new QR code for a document</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Document Type</label>
                    <select className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500">
                      <option value="jsa">Job Safety Analysis (JSA)</option>
                      <option value="observation">Safety Observation</option>
                      <option value="inspection">Inspection</option>
                      <option value="permit">Permit to Work</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Select Document</label>
                    <select className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500">
                      <option>JSA-2026-004 - Crane Operations</option>
                      <option>JSA-2026-005 - Electrical Work</option>
                      <option>OBS-2026-017 - Weekly Walk</option>
                    </select>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setShowGenerateModal(false)}
                      className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        // Add new QR code
                        const newDoc: QRDocument = {
                          id: `JSA-2026-00${documents.length + 1}`,
                          type: 'jsa',
                          title: 'New Generated JSA',
                          createdAt: new Date().toISOString(),
                          createdBy: 'Current User',
                          location: 'New Location',
                          status: 'active',
                          qrData: `https://ehs.company.com/jsa/JSA-2026-00${documents.length + 1}`,
                          scanCount: 0,
                        };
                        setDocuments(prev => [newDoc, ...prev]);
                        setShowGenerateModal(false);
                        setSelectedDocument(newDoc);
                      }}
                      className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                    >
                      Generate QR Code
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

export default QRCodeFeature;

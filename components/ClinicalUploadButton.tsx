'use client';

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { doc, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { db, storage } from "@/firebase";
import { PolicyType } from "@/lib/clinical-types";
import { Upload, X, FileText, AlertCircle } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

interface PolicyMetadata {
  type: PolicyType;
  version: string;
  department: string;
  effectiveDate: string;
  expirationDate?: string;
  approvedBy: string;
  keywords: string[];
  clinicalArea: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

function ClinicalUploadButton() {
  const { user } = useUser();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [metadata, setMetadata] = useState<PolicyMetadata>({
    type: PolicyType.CLINICAL_PROTOCOL,
    version: '1.0',
    department: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    expirationDate: '',
    approvedBy: '',
    keywords: [],
    clinicalArea: '',
    riskLevel: 'MEDIUM'
  });
  const [keywordInput, setKeywordInput] = useState('');

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0]);
      }
    }
  });

  const addKeyword = () => {
    if (keywordInput.trim() && !metadata.keywords.includes(keywordInput.trim())) {
      setMetadata(prev => ({
        ...prev,
        keywords: [...prev.keywords, keywordInput.trim()]
      }));
      setKeywordInput('');
    }
  };

  const removeKeyword = (keywordToRemove: string) => {
    setMetadata(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keywordToRemove)
    }));
  };

  const handleUpload = async () => {
    if (!file || !user?.id) return;

    // Validation
    if (!metadata.department || !metadata.approvedBy || !metadata.clinicalArea) {
      alert('Please fill in all required fields');
      return;
    }

    setUploading(true);

    try {
      const policyId = uuidv4();
      const storageRef = ref(storage, `users/${user.id}/clinical_policies/${policyId}.pdf`);
      
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Upload error:', error);
          alert('Upload failed. Please try again.');
          setUploading(false);
        },
        async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          
          // Save policy document with metadata
          const policyDoc = {
            id: policyId,
            name: file.name,
            downloadUrl,
            size: file.size,
            createdAt: new Date().toISOString(),
            metadata: {
              ...metadata,
              id: policyId,
              title: file.name.replace('.pdf', '')
            }
          };

          await setDoc(doc(db, "users", user.id, "clinical_policies", policyId), policyDoc);

          console.log('[CLINICAL] Policy uploaded successfully:', policyId);
          
          // Reset form
          setFile(null);
          setMetadata({
            type: PolicyType.CLINICAL_PROTOCOL,
            version: '1.0',
            department: '',
            effectiveDate: new Date().toISOString().split('T')[0],
            expirationDate: '',
            approvedBy: '',
            keywords: [],
            clinicalArea: '',
            riskLevel: 'MEDIUM'
          });
          setUploadProgress(0);
          setUploading(false);
          setIsOpen(false);
        }
      );
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
      setUploading(false);
    }
  };

  const formatPolicyType = (type: PolicyType) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
      >
        <Upload className="w-5 h-5" />
        Upload Policy
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Upload Clinical Policy</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Policy Document <span className="text-red-500">*</span>
                </label>
                {!file ? (
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      isDragActive 
                        ? 'border-blue-400 bg-blue-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      {isDragActive 
                        ? 'Drop the PDF file here...' 
                        : 'Drag & drop a PDF file here, or click to select'
                      }
                    </p>
                    <p className="text-sm text-gray-500 mt-2">Only PDF files are supported</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setFile(null)}
                      className="p-2 text-gray-400 hover:text-red-500 rounded-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Metadata Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Policy Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Policy Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={metadata.type}
                    onChange={(e) => setMetadata(prev => ({ ...prev, type: e.target.value as PolicyType }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Object.values(PolicyType).map(type => (
                      <option key={type} value={type}>
                        {formatPolicyType(type)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Version */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Version <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={metadata.version}
                    onChange={(e) => setMetadata(prev => ({ ...prev, version: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 1.0, 2.1"
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={metadata.department}
                    onChange={(e) => setMetadata(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Cardiology, Emergency Medicine"
                  />
                </div>

                {/* Clinical Area */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Clinical Area <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={metadata.clinicalArea}
                    onChange={(e) => setMetadata(prev => ({ ...prev, clinicalArea: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Acute Care, Outpatient Services"
                  />
                </div>

                {/* Approved By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Approved By <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={metadata.approvedBy}
                    onChange={(e) => setMetadata(prev => ({ ...prev, approvedBy: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Dr. Jane Smith, Chief Medical Officer"
                  />
                </div>

                {/* Risk Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Risk Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={metadata.riskLevel}
                    onChange={(e) => setMetadata(prev => ({ ...prev, riskLevel: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>

                {/* Effective Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Effective Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={metadata.effectiveDate}
                    onChange={(e) => setMetadata(prev => ({ ...prev, effectiveDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Expiration Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiration Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={metadata.expirationDate}
                    onChange={(e) => setMetadata(prev => ({ ...prev, expirationDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Keywords */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keywords
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add keywords for better searchability"
                  />
                  <button
                    type="button"
                    onClick={addKeyword}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Add
                  </button>
                </div>
                {metadata.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {metadata.keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {keyword}
                        <button
                          onClick={() => removeKeyword(keyword)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Uploading...</span>
                    <span className="text-gray-600">{uploadProgress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <AlertCircle className="w-4 h-4" />
                <span>All data is processed locally and stored securely</span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsOpen(false)}
                  disabled={uploading}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!file || uploading || !metadata.department || !metadata.approvedBy || !metadata.clinicalArea}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : 'Upload Policy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ClinicalUploadButton;
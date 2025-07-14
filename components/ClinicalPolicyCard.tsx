'use client';

import { useState } from "react";
import { ClinicalPolicy } from "./ClinicalPolicies";
import { PolicyType } from "@/lib/clinical-types";
import { Trash2, FileText, MessageSquare, AlertTriangle, Clock, User, Building } from "lucide-react";

interface Props {
  policy: ClinicalPolicy;
}

function ClinicalPolicyCard({ policy }: Props) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatPolicyType = (type: PolicyType) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB';
    return Math.round(bytes / 1048576) + ' MB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isExpiring = () => {
    if (!policy.metadata.expirationDate) return false;
    const expirationDate = new Date(policy.metadata.expirationDate);
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
    return expirationDate <= thirtyDaysFromNow;
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
              {policy.name}
            </h3>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRiskLevelColor(policy.metadata.riskLevel)}`}>
                {policy.metadata.riskLevel}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                {formatPolicyType(policy.metadata.type)}
              </span>
              {isExpiring() && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Expiring Soon
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete policy"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Building className="w-4 h-4" />
            <span>{policy.metadata.department}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <User className="w-4 h-4" />
            <span>{policy.metadata.approvedBy}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4" />
            <span>v{policy.metadata.version}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <FileText className="w-4 h-4" />
            <span>{formatFileSize(policy.size)}</span>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          <p><strong>Clinical Area:</strong> {policy.metadata.clinicalArea}</p>
          <p><strong>Effective:</strong> {formatDate(policy.metadata.effectiveDate)}</p>
          {policy.metadata.expirationDate && (
            <p><strong>Expires:</strong> {formatDate(policy.metadata.expirationDate)}</p>
          )}
        </div>

        {/* Keywords */}
        {policy.metadata.keywords.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Keywords:</p>
            <div className="flex flex-wrap gap-1">
              {policy.metadata.keywords.slice(0, 5).map((keyword, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                >
                  {keyword}
                </span>
              ))}
              {policy.metadata.keywords.length > 5 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">
                  +{policy.metadata.keywords.length - 5} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-6 pb-6">
        <div className="flex gap-3">
          <button
            onClick={() => window.open(`/dashboard/clinical/policies/${policy.id}`, '_blank')}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Ask AI
          </button>
          <button
            onClick={() => window.open(policy.downloadUrl, '_blank')}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4" />
            View PDF
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Policy</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete &quot;{policy.name}&quot;? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  // TODO: Implement delete functionality
                  console.log('Deleting policy:', policy.id);
                  setShowDeleteConfirm(false);
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClinicalPolicyCard;
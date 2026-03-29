'use client';

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/firebase";
import ClinicalPolicyCard from "./ClinicalPolicyCard";
import ClinicalUploadButton from "./ClinicalUploadButton";
import { PolicyType } from "@/lib/clinical-types";

export type ClinicalPolicy = {
  id: string;
  name: string;
  downloadUrl: string;
  size: number;
  createdAt: string;
  metadata: {
    type: PolicyType;
    version: string;
    department: string;
    effectiveDate: string;
    expirationDate?: string;
    approvedBy: string;
    keywords: string[];
    clinicalArea: string;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  };
};

function ClinicalPolicies() {
  const [policies, setPolicies] = useState<ClinicalPolicy[]>([]);
  const [filteredPolicies, setFilteredPolicies] = useState<ClinicalPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<PolicyType | "ALL">("ALL");
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>("ALL");
  const { user } = useUser();

  useEffect(() => {
    if (!user?.id) return;

    const q = query(
      collection(db, "users", user.id, "clinical_policies"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const policiesData: ClinicalPolicy[] = [];
      
      querySnapshot.forEach((doc) => {
        policiesData.push({
          id: doc.id,
          ...doc.data()
        } as ClinicalPolicy);
      });

      console.log('[CLINICAL] Loaded policies:', policiesData.length);
      setPolicies(policiesData);
      setFilteredPolicies(policiesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.id]);

  // Filter policies based on search term, type, and risk level
  useEffect(() => {
    let filtered = policies;

    if (searchTerm) {
      filtered = filtered.filter(policy => 
        policy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        policy.metadata.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        policy.metadata.keywords.some(keyword => 
          keyword.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (selectedType !== "ALL") {
      filtered = filtered.filter(policy => policy.metadata.type === selectedType);
    }

    if (selectedRiskLevel !== "ALL") {
      filtered = filtered.filter(policy => policy.metadata.riskLevel === selectedRiskLevel);
    }

    setFilteredPolicies(filtered);
  }, [policies, searchTerm, selectedType, selectedRiskLevel]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading clinical policies...</span>
      </div>
    );
  }

  const policyTypes = Object.values(PolicyType);
  const riskLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

  return (
    <div className="space-y-6">
      {/* Header and Upload */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Clinical Policies</h2>
          <p className="text-gray-600">Manage and query your hospital policies with AI-powered decision support</p>
        </div>
        <ClinicalUploadButton />
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search Policies
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, department, or keywords..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Policy Type Filter */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
              Policy Type
            </label>
            <select
              id="type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as PolicyType | "ALL")}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">All Types</option>
              {policyTypes.map(type => (
                <option key={type} value={type}>
                  {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          {/* Risk Level Filter */}
          <div>
            <label htmlFor="risk" className="block text-sm font-medium text-gray-700 mb-2">
              Risk Level
            </label>
            <select
              id="risk"
              value={selectedRiskLevel}
              onChange={(e) => setSelectedRiskLevel(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">All Levels</option>
              {riskLevels.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing {filteredPolicies.length} of {policies.length} policies
        </div>
        {(searchTerm || selectedType !== "ALL" || selectedRiskLevel !== "ALL") && (
          <button
            onClick={() => {
              setSearchTerm("");
              setSelectedType("ALL");
              setSelectedRiskLevel("ALL");
            }}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Policies Grid */}
      {filteredPolicies.length === 0 ? (
        <div className="text-center py-20">
          <div className="mx-auto h-24 w-24 text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-full h-full">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            {policies.length === 0 ? "No policies uploaded yet" : "No policies match your filters"}
          </h3>
          <p className="mt-2 text-gray-500">
            {policies.length === 0 
              ? "Upload your first clinical policy to get started with AI-powered decision support"
              : "Try adjusting your search or filter criteria"
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPolicies.map((policy) => (
            <ClinicalPolicyCard key={policy.id} policy={policy} />
          ))}
        </div>
      )}
    </div>
  );
}

export default ClinicalPolicies;
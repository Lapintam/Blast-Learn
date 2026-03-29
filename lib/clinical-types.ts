// Clinical types that can be safely imported by client-side components

export enum PolicyType {
  CLINICAL_PROTOCOL = 'clinical_protocol',
  SAFETY_POLICY = 'safety_policy',
  MEDICATION_GUIDELINE = 'medication_guideline',
  INFECTION_CONTROL = 'infection_control',
  EMERGENCY_PROCEDURE = 'emergency_procedure',
  PATIENT_CARE = 'patient_care',
  QUALITY_ASSURANCE = 'quality_assurance',
  REGULATORY_COMPLIANCE = 'regulatory_compliance'
}

export interface PolicyMetadata {
  title: string;
  department: string;
  clinicalArea: string;
  effectiveDate: string;
  expirationDate?: string;
  version: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  type: PolicyType;
  keywords: string[];
  approvedBy: string;
  reviewDate: string;
}

export interface ClinicalPolicy {
  id: string;
  userId: string;
  fileName: string;
  downloadUrl: string;
  metadata: PolicyMetadata;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
} 
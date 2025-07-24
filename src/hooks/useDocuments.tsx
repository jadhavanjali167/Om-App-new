import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Document, DocumentStatus, DocumentType } from '../types';
import { useCustomers } from './useCustomers';
import { useBuilders } from './useBuilders';

interface DocumentContextType {
  documents: Document[];
  loading: boolean;
  createDocument: (data: Partial<Document>) => Promise<Document>;
  updateDocument: (id: string, data: Partial<Document>) => Promise<Document>;
  deleteDocument: (id: string) => Promise<void>;
  getDocument: (id: string) => Document | undefined;
  updateStatus: (id: string, status: DocumentStatus) => Promise<void>;
  addNote: (id: string, note: string) => Promise<void>;
  uploadFile: (id: string, file: File) => Promise<void>;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

const mockDocuments: Document[] = [
  {
    id: 'DOC001',
    documentNumber: 'AGR/2024/001',
    customerName: 'Rajesh Kumar',
    customerPhone: '+91 9876543210',
    customerEmail: 'rajesh@email.com',
    builderName: 'ABC Properties Ltd.',
    propertyDetails: 'Plot No. 123, Sector 15, Gurgaon',
    documentType: 'agreement',
    status: 'registered',
    collectionDate: new Date(2024, 10, 1),
    dataEntryDate: new Date(2024, 10, 3),
    registrationDate: new Date(2024, 10, 10),
    assignedTo: 'John Doe',
    notes: ['Initial collection completed', 'All documents verified'],
    files: [],
    createdAt: new Date(2024, 9, 28),
    updatedAt: new Date(2024, 10, 10),
  },
  {
    id: 'DOC002',
    documentNumber: 'LEASE/2024/002',
    customerName: 'Priya Sharma',
    customerPhone: '+91 9876543211',
    builderName: 'XYZ Developers',
    propertyDetails: 'Flat 4B, Tower 2, Green Valley',
    documentType: 'lease_deed',
    status: 'data_entry_pending',
    collectionDate: new Date(2024, 10, 15),
    assignedTo: 'Jane Smith',
    notes: ['Documents collected from field'],
    files: [],
    createdAt: new Date(2024, 10, 12),
    updatedAt: new Date(2024, 10, 15),
  },
];

export function useDocuments() {
  const context = useContext(DocumentContext);
  if (context === undefined) {
    throw new Error('useDocuments must be used within a DocumentProvider');
  }
  return context;
}

export function DocumentProvider({ children }: { children: ReactNode }) {
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [loading, setLoading] = useState(false);
  const { createCustomer, getCustomerByPhone, addDocumentToCustomer } = useCustomers();
  const { createBuilder, getBuilderByName, addDocumentToBuilder } = useBuilders();

  const generateDocumentNumber = (type: DocumentType): string => {
    const prefix = type.toUpperCase().replace('_', '');
    const year = new Date().getFullYear();
    const count = documents.filter(d => d.documentType === type).length + 1;
    return `${prefix}/${year}/${count.toString().padStart(3, '0')}`;
  };

  const createDocument = async (data: Partial<Document>): Promise<Document> => {
    setLoading(true);
    try {
      const newDocument: Document = {
        id: `DOC${Date.now()}`,
        documentNumber: data.documentNumber || generateDocumentNumber(data.documentType!),
        customerName: data.customerName || '',
        customerPhone: data.customerPhone || '',
        customerEmail: data.customerEmail,
        builderName: data.builderName || '',
        propertyDetails: data.propertyDetails || '',
        documentType: data.documentType!,
        status: 'pending_collection',
        assignedTo: data.assignedTo,
        notes: [],
        files: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      };

      // Auto-create or update customer
      if (newDocument.customerName && newDocument.customerPhone) {
        let customer = getCustomerByPhone(newDocument.customerPhone);
        
        if (!customer) {
          // Create new customer
          customer = await createCustomer({
            name: newDocument.customerName,
            phone: newDocument.customerPhone,
            email: newDocument.customerEmail,
            address: newDocument.propertyDetails, // Use property details as initial address
            documents: [newDocument.id],
          });
        } else {
          // Add document to existing customer
          await addDocumentToCustomer(customer.id, newDocument.id);
        }
      }

      // Auto-create or update builder
      if (newDocument.builderName) {
        let builder = getBuilderByName(newDocument.builderName);
        
        if (!builder) {
          // Create new builder with minimal info
          builder = await createBuilder({
            name: newDocument.builderName,
            contactPerson: 'Contact Person', // Default value
            phone: '+91 0000000000', // Default value
            address: 'Address not provided',
            documents: [newDocument.id],
          });
        } else {
          // Add document to existing builder
          await addDocumentToBuilder(builder.id, newDocument.id);
        }
      }

      setDocuments(prev => [...prev, newDocument]);
      return newDocument;
    } finally {
      setLoading(false);
    }
  };

  const updateDocument = async (id: string, data: Partial<Document>): Promise<Document> => {
    setLoading(true);
    try {
      const updatedDocument = { ...data, updatedAt: new Date() };
      setDocuments(prev => 
        prev.map(doc => 
          doc.id === id ? { ...doc, ...updatedDocument } : doc
        )
      );
      return documents.find(d => d.id === id)!;
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (id: string): Promise<void> => {
    setLoading(true);
    try {
      setDocuments(prev => prev.filter(doc => doc.id !== id));
    } finally {
      setLoading(false);
    }
  };

  const getDocument = (id: string): Document | undefined => {
    return documents.find(doc => doc.id === id);
  };

  const updateStatus = async (id: string, status: DocumentStatus): Promise<void> => {
    await updateDocument(id, { status });
  };

  const addNote = async (id: string, note: string): Promise<void> => {
    const document = getDocument(id);
    if (document) {
      await updateDocument(id, { 
        notes: [...document.notes, note] 
      });
    }
  };

  const uploadFile = async (id: string, file: File): Promise<void> => {
    // Simulate file upload
    const document = getDocument(id);
    if (document) {
      const newFile = {
        id: `FILE${Date.now()}`,
        name: file.name,
        type: file.type.includes('image') ? 'photo' : 'document' as any,
        url: URL.createObjectURL(file),
        uploadedBy: 'Current User',
        uploadedAt: new Date(),
      };
      
      await updateDocument(id, {
        files: [...document.files, newFile]
      });
    }
  };

  const value = {
    documents,
    loading,
    createDocument,
    updateDocument,
    deleteDocument,
    getDocument,
    updateStatus,
    addNote,
    uploadFile,
  };

  return <DocumentContext.Provider value={value}>{children}</DocumentContext.Provider>;
}
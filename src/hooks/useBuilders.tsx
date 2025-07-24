import { useState, createContext, useContext, ReactNode } from 'react';
import { Builder } from '../types';

interface BuilderContextType {
  builders: Builder[];
  loading: boolean;
  createBuilder: (data: Partial<Builder>) => Promise<Builder>;
  updateBuilder: (id: string, data: Partial<Builder>) => Promise<Builder>;
  deleteBuilder: (id: string) => Promise<void>;
  getBuilder: (id: string) => Builder | undefined;
  getBuilderByName: (name: string) => Builder | undefined;
  addDocumentToBuilder: (builderId: string, documentId: string) => Promise<void>;
}

const BuilderContext = createContext<BuilderContextType | undefined>(undefined);

const mockBuilders: Builder[] = [
  {
    id: 'BLD001',
    name: 'ABC Properties Ltd.',
    contactPerson: 'Mr. Rajesh Gupta',
    phone: '+91 9876543220',
    email: 'contact@abcproperties.com',
    address: 'Tower A, Business Park, Sector 62, Gurgaon, Haryana - 122001',
    registrationNumber: 'REG/2020/001234',
    documents: ['DOC001'],
    createdAt: new Date(2024, 7, 15),
  },
  {
    id: 'BLD002',
    name: 'XYZ Developers',
    contactPerson: 'Ms. Priya Patel',
    phone: '+91 9876543221',
    email: 'info@xyzdev.com',
    address: 'Plot 45, Industrial Area, Noida, UP - 201301',
    registrationNumber: 'REG/2021/005678',
    documents: ['DOC002'],
    createdAt: new Date(2024, 8, 10),
  },
];

export function useBuilders() {
  const context = useContext(BuilderContext);
  if (context === undefined) {
    throw new Error('useBuilders must be used within a BuilderProvider');
  }
  return context;
}

export function BuilderProvider({ children }: { children: ReactNode }) {
  const [builders, setBuilders] = useState<Builder[]>(mockBuilders);
  const [loading, setLoading] = useState(false);

  const generateBuilderId = (): string => {
    const count = builders.length + 1;
    return `BLD${count.toString().padStart(3, '0')}`;
  };

  const createBuilder = async (data: Partial<Builder>): Promise<Builder> => {
    setLoading(true);
    try {
      const newBuilder: Builder = {
        id: data.id || generateBuilderId(),
        name: data.name || '',
        contactPerson: data.contactPerson || '',
        phone: data.phone || '',
        email: data.email,
        address: data.address || '',
        registrationNumber: data.registrationNumber,
        documents: data.documents || [],
        createdAt: new Date(),
        ...data,
      };

      setBuilders(prev => [...prev, newBuilder]);
      return newBuilder;
    } finally {
      setLoading(false);
    }
  };

  const updateBuilder = async (id: string, data: Partial<Builder>): Promise<Builder> => {
    setLoading(true);
    try {
      setBuilders(prev => 
        prev.map(builder => 
          builder.id === id ? { ...builder, ...data } : builder
        )
      );
      return builders.find(b => b.id === id)!;
    } finally {
      setLoading(false);
    }
  };

  const deleteBuilder = async (id: string): Promise<void> => {
    setLoading(true);
    try {
      setBuilders(prev => prev.filter(builder => builder.id !== id));
    } finally {
      setLoading(false);
    }
  };

  const getBuilder = (id: string): Builder | undefined => {
    return builders.find(builder => builder.id === id);
  };

  const getBuilderByName = (name: string): Builder | undefined => {
    return builders.find(builder => 
      builder.name.toLowerCase().includes(name.toLowerCase())
    );
  };

  const addDocumentToBuilder = async (builderId: string, documentId: string): Promise<void> => {
    const builder = getBuilder(builderId);
    if (builder && !builder.documents.includes(documentId)) {
      await updateBuilder(builderId, {
        documents: [...builder.documents, documentId]
      });
    }
  };

  const value = {
    builders,
    loading,
    createBuilder,
    updateBuilder,
    deleteBuilder,
    getBuilder,
    getBuilderByName,
    addDocumentToBuilder,
  };

  return <BuilderContext.Provider value={value}>{children}</BuilderContext.Provider>;
}
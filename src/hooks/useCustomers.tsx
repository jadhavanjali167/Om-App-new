import { useState, createContext, useContext, ReactNode } from 'react';
import { Customer } from '../types';

interface CustomerContextType {
  customers: Customer[];
  loading: boolean;
  createCustomer: (data: Partial<Customer>) => Promise<Customer>;
  updateCustomer: (id: string, data: Partial<Customer>) => Promise<Customer>;
  deleteCustomer: (id: string) => Promise<void>;
  getCustomer: (id: string) => Customer | undefined;
  getCustomerByPhone: (phone: string) => Customer | undefined;
  getCustomerByEmail: (email: string) => Customer | undefined;
  addDocumentToCustomer: (customerId: string, documentId: string) => Promise<void>;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

const mockCustomers: Customer[] = [
  {
    id: 'CUST001',
    name: 'Rajesh Kumar',
    phone: '+91 9876543210',
    email: 'rajesh@email.com',
    address: 'H-123, Sector 15, Gurgaon, Haryana - 122001',
    documents: ['DOC001'],
    createdAt: new Date(2024, 8, 15),
  },
  {
    id: 'CUST002',
    name: 'Priya Sharma',
    phone: '+91 9876543211',
    email: 'priya.sharma@email.com',
    address: 'Flat 4B, Tower 2, Green Valley, Noida, UP - 201301',
    documents: ['DOC002'],
    createdAt: new Date(2024, 9, 10),
  },
];

export function useCustomers() {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error('useCustomers must be used within a CustomerProvider');
  }
  return context;
}

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [loading, setLoading] = useState(false);

  const generateCustomerId = (): string => {
    const count = customers.length + 1;
    return `CUST${count.toString().padStart(3, '0')}`;
  };

  const createCustomer = async (data: Partial<Customer>): Promise<Customer> => {
    setLoading(true);
    try {
      const newCustomer: Customer = {
        id: data.id || generateCustomerId(),
        name: data.name || '',
        phone: data.phone || '',
        email: data.email,
        address: data.address || '',
        documents: data.documents || [],
        createdAt: new Date(),
        ...data,
      };

      setCustomers(prev => [...prev, newCustomer]);
      return newCustomer;
    } finally {
      setLoading(false);
    }
  };

  const updateCustomer = async (id: string, data: Partial<Customer>): Promise<Customer> => {
    setLoading(true);
    try {
      setCustomers(prev => 
        prev.map(customer => 
          customer.id === id ? { ...customer, ...data } : customer
        )
      );
      return customers.find(c => c.id === id)!;
    } finally {
      setLoading(false);
    }
  };

  const deleteCustomer = async (id: string): Promise<void> => {
    setLoading(true);
    try {
      setCustomers(prev => prev.filter(customer => customer.id !== id));
    } finally {
      setLoading(false);
    }
  };

  const getCustomer = (id: string): Customer | undefined => {
    return customers.find(customer => customer.id === id);
  };

  const getCustomerByPhone = (phone: string): Customer | undefined => {
    return customers.find(customer => customer.phone === phone);
  };

  const getCustomerByEmail = (email: string): Customer | undefined => {
    return customers.find(customer => customer.email === email);
  };

  const addDocumentToCustomer = async (customerId: string, documentId: string): Promise<void> => {
    const customer = getCustomer(customerId);
    if (customer && !customer.documents.includes(documentId)) {
      await updateCustomer(customerId, {
        documents: [...customer.documents, documentId]
      });
    }
  };

  const value = {
    customers,
    loading,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomer,
    getCustomerByPhone,
    getCustomerByEmail,
    addDocumentToCustomer,
  };

  return <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>;
}
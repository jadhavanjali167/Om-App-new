import { useState, createContext, useContext, ReactNode } from 'react';
import { User, UserRole, Permission } from '../types';

interface UserContextType {
  users: User[];
  loading: boolean;
  createUser: (data: Partial<User> & { password: string }) => Promise<User>;
  updateUser: (id: string, data: Partial<User>) => Promise<User>;
  deleteUser: (id: string) => Promise<void>;
  getUser: (id: string) => User | undefined;
  updateUserPermissions: (id: string, permissions: Permission[]) => Promise<void>;
  toggleUserStatus: (id: string) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@omservices.com',
    name: 'Main Admin',
    role: 'main_admin',
    permissions: [],
    isActive: true,
    createdAt: new Date(2024, 0, 1),
    lastLogin: new Date(2024, 10, 15, 10, 30),
  },
  {
    id: '2',
    email: 'staff@omservices.com',
    name: 'Staff Admin',
    role: 'staff_admin',
    permissions: [
      { id: '1', module: 'documents', action: 'create', granted: true },
      { id: '2', module: 'documents', action: 'read', granted: true },
      { id: '3', module: 'documents', action: 'update', granted: true },
      { id: '4', module: 'payments', action: 'read', granted: true },
      { id: '5', module: 'users', action: 'create', granted: true },
      { id: '6', module: 'users', action: 'read', granted: true },
    ],
    isActive: true,
    createdAt: new Date(2024, 1, 15),
    lastLogin: new Date(2024, 10, 14, 16, 45),
  },
  {
    id: '3',
    email: 'challan@omservices.com',
    name: 'Challan Staff',
    role: 'challan_staff',
    permissions: [
      { id: '7', module: 'documents', action: 'read', granted: true },
      { id: '8', module: 'challans', action: 'create', granted: true },
      { id: '9', module: 'challans', action: 'update', granted: true },
      { id: '10', module: 'payments', action: 'read', granted: true },
    ],
    isActive: true,
    createdAt: new Date(2024, 2, 1),
    lastLogin: new Date(2024, 10, 15, 9, 15),
  },
  {
    id: '4',
    email: 'collector@omservices.com',
    name: 'Field Collector',
    role: 'field_collection_staff',
    permissions: [
      { id: '11', module: 'documents', action: 'read', granted: true },
      { id: '12', module: 'documents', action: 'update', granted: true },
    ],
    isActive: true,
    createdAt: new Date(2024, 3, 10),
    lastLogin: new Date(2024, 10, 13, 14, 20),
  },
  {
    id: '5',
    email: 'dataentry@omservices.com',
    name: 'Data Entry Staff',
    role: 'data_entry_staff',
    permissions: [
      { id: '13', module: 'documents', action: 'read', granted: true },
      { id: '14', module: 'documents', action: 'update', granted: true },
    ],
    isActive: false,
    createdAt: new Date(2024, 4, 5),
    lastLogin: new Date(2024, 9, 20, 11, 30),
  },
  {
    id: '6',
    email: 'delivery@omservices.com',
    name: 'Delivery Staff',
    role: 'document_delivery_staff',
    permissions: [
      { id: '15', module: 'documents', action: 'read', granted: true },
      { id: '16', module: 'documents', action: 'update', granted: true },
    ],
    isActive: true,
    createdAt: new Date(2024, 5, 20),
    lastLogin: new Date(2024, 10, 12, 8, 45),
  },
];

export function useUsers() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUsers must be used within a UserProvider');
  }
  return context;
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [loading, setLoading] = useState(false);

  const generateUserId = (): string => {
    const count = users.length + 1;
    return count.toString();
  };

  const createUser = async (data: Partial<User> & { password: string }): Promise<User> => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newUser: User = {
        id: generateUserId(),
        email: data.email || '',
        name: data.name || '',
        role: data.role || 'staff_admin',
        permissions: data.permissions || [],
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdAt: new Date(),
        ...data,
      };

      setUsers(prev => [...prev, newUser]);
      return newUser;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (id: string, data: Partial<User>): Promise<User> => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));

      setUsers(prev => 
        prev.map(user => 
          user.id === id ? { ...user, ...data } : user
        )
      );
      return users.find(u => u.id === id)!;
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id: string): Promise<void> => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      setUsers(prev => prev.filter(user => user.id !== id));
    } finally {
      setLoading(false);
    }
  };

  const getUser = (id: string): User | undefined => {
    return users.find(user => user.id === id);
  };

  const updateUserPermissions = async (id: string, permissions: Permission[]): Promise<void> => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setUsers(prev => 
        prev.map(user => 
          user.id === id ? { ...user, permissions } : user
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (id: string): Promise<void> => {
    const user = getUser(id);
    if (user) {
      await updateUser(id, { isActive: !user.isActive });
    }
  };

  const value = {
    users,
    loading,
    createUser,
    updateUser,
    deleteUser,
    getUser,
    updateUserPermissions,
    toggleUserStatus,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
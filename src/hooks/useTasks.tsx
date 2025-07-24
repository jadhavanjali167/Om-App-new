import { useState, createContext, useContext, ReactNode } from 'react';
import { Task, TaskType, TaskStatus, TaskPriority, TaskPermission, TaskTemplate, TaskStats } from '../types/task';
import { useAuth } from './useAuth';

interface TaskContextType {
  tasks: Task[];
  taskPermissions: TaskPermission[];
  taskTemplates: TaskTemplate[];
  loading: boolean;
  createTask: (data: Partial<Task>) => Promise<Task>;
  updateTask: (id: string, data: Partial<Task>) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  assignTask: (taskId: string, userId: string) => Promise<void>;
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  addTaskComment: (taskId: string, content: string, isInternal?: boolean) => Promise<void>;
  getTasksByUser: (userId: string) => Task[];
  getTasksByType: (type: TaskType) => Task[];
  getTaskStats: () => TaskStats;
  hasTaskPermission: (taskType: TaskType, permission: keyof TaskPermission['permissions']) => boolean;
  getUserTaskPermissions: (userId: string) => TaskPermission[];
  updateTaskPermissions: (userId: string, permissions: TaskPermission[]) => Promise<void>;
  createTaskFromTemplate: (templateId: string, overrides?: Partial<Task>) => Promise<Task>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

const mockTasks: Task[] = [
  {
    id: 'TASK001',
    title: 'Collect documents from Rajesh Kumar',
    description: 'Visit customer location and collect all required documents for agreement processing',
    type: 'document_collection',
    priority: 'high',
    status: 'pending',
    assignedTo: '4', // Field Collection Staff
    assignedBy: '1', // Main Admin
    documentId: 'DOC001',
    customerId: 'CUST001',
    dueDate: new Date(2024, 11, 25),
    estimatedHours: 2,
    tags: ['urgent', 'customer-visit'],
    attachments: [],
    comments: [],
    dependencies: [],
    createdAt: new Date(2024, 11, 20),
    updatedAt: new Date(2024, 11, 20),
  },
  {
    id: 'TASK002',
    title: 'Data entry for lease agreement',
    description: 'Enter all data from collected documents into the system',
    type: 'data_entry',
    priority: 'medium',
    status: 'in_progress',
    assignedTo: '5', // Data Entry Staff
    assignedBy: '2', // Staff Admin
    documentId: 'DOC002',
    dueDate: new Date(2024, 11, 22),
    estimatedHours: 1.5,
    actualHours: 0.5,
    tags: ['data-entry', 'lease'],
    attachments: [],
    comments: [
      {
        id: 'COMMENT001',
        content: 'Started working on this task. Some documents are unclear.',
        authorId: '5',
        authorName: 'Data Entry Staff',
        createdAt: new Date(2024, 11, 21, 10, 30),
        isInternal: false,
      }
    ],
    dependencies: ['TASK001'],
    createdAt: new Date(2024, 11, 19),
    updatedAt: new Date(2024, 11, 21),
  },
  {
    id: 'TASK003',
    title: 'Create challan for property registration',
    description: 'Prepare and submit challan form for DHC payment',
    type: 'challan_creation',
    priority: 'high',
    status: 'pending',
    assignedTo: '3', // Challan Staff
    assignedBy: '1', // Main Admin
    documentId: 'DOC001',
    dueDate: new Date(2024, 11, 23),
    estimatedHours: 1,
    tags: ['challan', 'dhc'],
    attachments: [],
    comments: [],
    dependencies: ['TASK002'],
    createdAt: new Date(2024, 11, 20),
    updatedAt: new Date(2024, 11, 20),
  },
];

const mockTaskPermissions: TaskPermission[] = [
  {
    id: 'PERM001',
    userId: '3', // Challan Staff
    taskType: 'challan_creation',
    permissions: {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: false,
      canAssign: false,
      canComment: true,
      canChangeStatus: true,
      canViewAllTasks: false,
      canEditPriority: false,
      canSetDueDate: false,
      canAddAttachments: true,
      canViewComments: true,
    },
    restrictions: {
      maxTasksPerDay: 10,
      allowedStatuses: ['pending', 'in_progress', 'completed'],
      canOnlyViewOwnTasks: true,
    }
  },
  {
    id: 'PERM002',
    userId: '4', // Field Collection Staff
    taskType: 'document_collection',
    permissions: {
      canView: true,
      canCreate: false,
      canEdit: true,
      canDelete: false,
      canAssign: false,
      canComment: true,
      canChangeStatus: true,
      canViewAllTasks: false,
      canEditPriority: false,
      canSetDueDate: false,
      canAddAttachments: true,
      canViewComments: true,
    },
    restrictions: {
      maxTasksPerDay: 8,
      allowedStatuses: ['pending', 'in_progress', 'completed'],
      canOnlyViewOwnTasks: true,
    }
  },
];

const mockTaskTemplates: TaskTemplate[] = [
  {
    id: 'TEMPLATE001',
    name: 'Document Collection',
    description: 'Standard document collection task',
    type: 'document_collection',
    defaultPriority: 'medium',
    estimatedHours: 2,
    checklist: [
      {
        id: 'CHECK001',
        title: 'Verify customer identity',
        description: 'Check ID proof and match with records',
        isRequired: true,
        isCompleted: false,
      },
      {
        id: 'CHECK002',
        title: 'Collect all required documents',
        description: 'Ensure all documents in the checklist are collected',
        isRequired: true,
        isCompleted: false,
      },
      {
        id: 'CHECK003',
        title: 'Take photos of documents',
        description: 'Photograph all collected documents',
        isRequired: true,
        isCompleted: false,
      },
    ],
    requiredFields: ['customerId', 'documentId', 'dueDate'],
    autoAssignmentRules: {
      role: 'field_collection_staff',
      workload: 'balanced',
    }
  },
];

export function useTasks() {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
}

export function TaskProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [taskPermissions, setTaskPermissions] = useState<TaskPermission[]>(mockTaskPermissions);
  const [taskTemplates] = useState<TaskTemplate[]>(mockTaskTemplates);
  const [loading, setLoading] = useState(false);

  const generateTaskId = (): string => {
    const count = tasks.length + 1;
    return `TASK${count.toString().padStart(3, '0')}`;
  };

  const createTask = async (data: Partial<Task>): Promise<Task> => {
    setLoading(true);
    try {
      const newTask: Task = {
        id: generateTaskId(),
        title: data.title || '',
        description: data.description || '',
        type: data.type || 'custom',
        priority: data.priority || 'medium',
        status: 'pending',
        assignedTo: data.assignedTo || '',
        assignedBy: user?.id || '',
        documentId: data.documentId,
        customerId: data.customerId,
        builderId: data.builderId,
        dueDate: data.dueDate,
        estimatedHours: data.estimatedHours,
        tags: data.tags || [],
        attachments: [],
        comments: [],
        dependencies: data.dependencies || [],
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      };

      setTasks(prev => [...prev, newTask]);
      return newTask;
    } finally {
      setLoading(false);
    }
  };

  const updateTask = async (id: string, data: Partial<Task>): Promise<Task> => {
    setLoading(true);
    try {
      setTasks(prev => 
        prev.map(task => 
          task.id === id ? { ...task, ...data, updatedAt: new Date() } : task
        )
      );
      return tasks.find(t => t.id === id)!;
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (id: string): Promise<void> => {
    setLoading(true);
    try {
      setTasks(prev => prev.filter(task => task.id !== id));
    } finally {
      setLoading(false);
    }
  };

  const assignTask = async (taskId: string, userId: string): Promise<void> => {
    await updateTask(taskId, { assignedTo: userId });
  };

  const updateTaskStatus = async (taskId: string, status: TaskStatus): Promise<void> => {
    const updateData: Partial<Task> = { status };
    if (status === 'completed') {
      updateData.completedAt = new Date();
    }
    await updateTask(taskId, updateData);
  };

  const addTaskComment = async (taskId: string, content: string, isInternal = false): Promise<void> => {
    const task = tasks.find(t => t.id === taskId);
    if (task && user) {
      const newComment = {
        id: `COMMENT${Date.now()}`,
        content,
        authorId: user.id,
        authorName: user.name,
        createdAt: new Date(),
        isInternal,
      };
      
      await updateTask(taskId, {
        comments: [...task.comments, newComment]
      });
    }
  };

  const getTasksByUser = (userId: string): Task[] => {
    return tasks.filter(task => task.assignedTo === userId);
  };

  const getTasksByType = (type: TaskType): Task[] => {
    return tasks.filter(task => task.type === type);
  };

  const getTaskStats = (): TaskStats => {
    const totalTasks = tasks.length;
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const overdueTasks = tasks.filter(t => 
      t.dueDate && t.dueDate < new Date() && t.status !== 'completed'
    ).length;

    const completedTasksWithTime = tasks.filter(t => t.status === 'completed' && t.actualHours);
    const averageCompletionTime = completedTasksWithTime.length > 0
      ? completedTasksWithTime.reduce((sum, t) => sum + (t.actualHours || 0), 0) / completedTasksWithTime.length
      : 0;

    const tasksByType = tasks.reduce((acc, task) => {
      acc[task.type] = (acc[task.type] || 0) + 1;
      return acc;
    }, {} as Record<TaskType, number>);

    const tasksByPriority = tasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {} as Record<TaskPriority, number>);

    const userWorkload = tasks.reduce((acc, task) => {
      if (task.assignedTo && task.status !== 'completed') {
        acc[task.assignedTo] = (acc[task.assignedTo] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      totalTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      overdueTasks,
      averageCompletionTime,
      tasksByType,
      tasksByPriority,
      userWorkload,
    };
  };

  const hasTaskPermission = (taskType: TaskType, permission: keyof TaskPermission['permissions']): boolean => {
    if (!user) return false;
    if (user.role === 'main_admin') return true;

    const userPermission = taskPermissions.find(p => p.userId === user.id && p.taskType === taskType);
    return userPermission?.permissions[permission] || false;
  };

  const getUserTaskPermissions = (userId: string): TaskPermission[] => {
    return taskPermissions.filter(p => p.userId === userId);
  };

  const updateTaskPermissions = async (userId: string, permissions: TaskPermission[]): Promise<void> => {
    setLoading(true);
    try {
      // Remove existing permissions for this user
      setTaskPermissions(prev => prev.filter(p => p.userId !== userId));
      // Add new permissions
      setTaskPermissions(prev => [...prev, ...permissions]);
    } finally {
      setLoading(false);
    }
  };

  const createTaskFromTemplate = async (templateId: string, overrides?: Partial<Task>): Promise<Task> => {
    const template = taskTemplates.find(t => t.id === templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    return createTask({
      title: template.name,
      description: template.description,
      type: template.type,
      priority: template.defaultPriority,
      estimatedHours: template.estimatedHours,
      ...overrides,
    });
  };

  const getTaskRedirectUrl = (task: Task): string => {
    // Redirect based on task type for incomplete tasks
    switch (task.type) {
      case 'document_collection':
        return '/collection';
      case 'data_entry':
        return '/data-entry';
      case 'document_delivery':
        return '/delivery';
      case 'challan_creation':
        return '/challans';
      case 'payment_processing':
        return '/payments';
      case 'customer_follow_up':
        return task.customerId ? `/customers` : '/customers';
      case 'document_verification':
        return task.documentId ? `/documents/${task.documentId}` : '/documents';
      case 'registration_follow_up':
        return task.documentId ? `/documents/${task.documentId}` : '/documents';
      case 'quality_check':
        return task.documentId ? `/documents/${task.documentId}` : '/documents';
      case 'custom':
      default:
        // For custom tasks and completed tasks, go to task detail page
        return `/tasks/${task.id}`;
    }
  };

  const value = {
    tasks,
    taskPermissions,
    taskTemplates,
    loading,
    createTask,
    updateTask,
    deleteTask,
    assignTask,
    updateTaskStatus,
    addTaskComment,
    getTasksByUser,
    getTasksByType,
    getTaskStats,
    hasTaskPermission,
    getUserTaskPermissions,
    updateTaskPermissions,
    createTaskFromTemplate,
    getTaskRedirectUrl,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}
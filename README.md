# Om Services Admin Panel

A comprehensive document management system for property registration and legal document processing services.

## 🚀 Features

- **Document Management**: Complete workflow from collection to delivery
- **Payment Tracking**: Comprehensive payment and challan management
- **Task Management**: Role-based task assignment and tracking
- **User Management**: Multi-role access control system
- **Gmail Integration**: Real inbox access and email management
- **Customer & Builder Management**: Relationship tracking and contact management

## 📧 Gmail Integration Setup

To enable real Gmail integration:

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the Gmail API:
   - Go to "APIs & Services" > "Library"
   - Search for "Gmail API" and enable it

### 2. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Add authorized origins:
   - `http://localhost:5173` (for development)
   - Your production domain (e.g., `https://yourdomain.com`)
5. Copy the Client ID

### 3. Create API Key

1. In "Credentials", click "Create Credentials" > "API Key"
2. Restrict the key to Gmail API for security
3. Copy the API Key

### 4. Environment Configuration

Create a `.env` file in your project root:

```env
VITE_GOOGLE_CLIENT_ID=your_oauth_client_id_here
VITE_GOOGLE_API_KEY=your_api_key_here
```

### 5. Domain Authorization

For production deployment, add your domain to:
- OAuth 2.0 authorized origins
- API key restrictions (if applicable)

## 🔐 Demo Credentials

For testing without Gmail integration:
- **Main Admin**: admin@omservices.com / password123
- **Challan Staff**: challan@omservices.com / password123

## 🛠 Development

```bash
npm install
npm run dev
```

## 🚀 Deployment

The app is deployed at: https://genuine-crostata-57882a.netlify.app

## 📱 User Roles

- **Main Admin**: Full system access
- **Staff Admin**: Document and user management
- **Challan Staff**: Challan creation and management
- **Field Collection Staff**: Document collection tasks
- **Data Entry Staff**: Document data entry
- **Document Delivery Staff**: Document delivery management

## 🔧 Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Gmail API**: Google APIs Client Library

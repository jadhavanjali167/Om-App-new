// Gmail API service for real Gmail integration
export interface GmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  date: Date;
  body: string;
  isRead: boolean;
  isStarred: boolean;
  labels: string[];
  attachments?: GmailAttachment[];
}

export interface GmailAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
}

class GmailApiService {
  private gapi: any;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = async () => {
        try {
          await new Promise<void>((resolveGapi) => {
            (window as any).gapi.load('client:auth2', resolveGapi);
          });

          this.gapi = (window as any).gapi;
          
          await this.gapi.client.init({
            apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
            clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest'],
            scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.modify'
          });

          // Explicitly initialize the auth2 client
          await this.gapi.auth2.init({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          });

          this.isInitialized = true;
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async signIn(): Promise<boolean> {
    try {
      await this.initialize();
      const authInstance = this.gapi.auth2.getAuthInstance();
      const user = await authInstance.signIn();
      return user.isSignedIn();
    } catch (error) {
      console.error('Gmail sign-in error:', error);
      return false;
    }
  }

  async signOut(): Promise<void> {
    try {
      const authInstance = this.gapi.auth2.getAuthInstance();
      await authInstance.signOut();
    } catch (error) {
      console.error('Gmail sign-out error:', error);
    }
  }

  async isSignedIn(): Promise<boolean> {
    try {
      await this.initialize();
      const authInstance = this.gapi.auth2.getAuthInstance();
      return authInstance.isSignedIn.get();
    } catch (error) {
      return false;
    }
  }

  async getCurrentUser(): Promise<any> {
    try {
      const authInstance = this.gapi.auth2.getAuthInstance();
      return authInstance.currentUser.get();
    } catch (error) {
      return null;
    }
  }

  async getMessages(maxResults: number = 50): Promise<GmailMessage[]> {
    try {
      const response = await this.gapi.client.gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: 'in:inbox'
      });

      const messages = response.result.messages || [];
      const detailedMessages: GmailMessage[] = [];

      for (const message of messages) {
        const detail = await this.gapi.client.gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'full'
        });

        const parsedMessage = this.parseMessage(detail.result);
        if (parsedMessage) {
          detailedMessages.push(parsedMessage);
        }
      }

      return detailedMessages;
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  private parseMessage(message: any): GmailMessage | null {
    try {
      const headers = message.payload.headers;
      const getHeader = (name: string) => 
        headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

      const subject = getHeader('Subject');
      const from = getHeader('From');
      const to = getHeader('To');
      const date = new Date(parseInt(message.internalDate));

      // Extract body
      let body = '';
      if (message.payload.body?.data) {
        body = this.decodeBase64(message.payload.body.data);
      } else if (message.payload.parts) {
        const textPart = message.payload.parts.find((part: any) => 
          part.mimeType === 'text/plain' || part.mimeType === 'text/html'
        );
        if (textPart?.body?.data) {
          body = this.decodeBase64(textPart.body.data);
        }
      }

      // Clean HTML if present
      if (body.includes('<')) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = body;
        body = tempDiv.textContent || tempDiv.innerText || '';
      }

      const isRead = !message.labelIds?.includes('UNREAD');
      const isStarred = message.labelIds?.includes('STARRED') || false;

      return {
        id: message.id,
        threadId: message.threadId,
        subject: subject || '(No Subject)',
        from: this.extractEmail(from),
        to: this.extractEmail(to),
        date,
        body: body.substring(0, 1000), // Limit body length
        isRead,
        isStarred,
        labels: message.labelIds || [],
        attachments: this.extractAttachments(message.payload)
      };
    } catch (error) {
      console.error('Error parsing message:', error);
      return null;
    }
  }

  private decodeBase64(data: string): string {
    try {
      // Gmail API returns base64url encoded data
      const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
      return decodeURIComponent(escape(atob(base64)));
    } catch (error) {
      return data;
    }
  }

  private extractEmail(emailString: string): string {
    const match = emailString.match(/<(.+)>/);
    return match ? match[1] : emailString;
  }

  private extractAttachments(payload: any): GmailAttachment[] {
    const attachments: GmailAttachment[] = [];
    
    const extractFromParts = (parts: any[]) => {
      parts.forEach(part => {
        if (part.filename && part.body?.attachmentId) {
          attachments.push({
            id: part.body.attachmentId,
            filename: part.filename,
            mimeType: part.mimeType,
            size: part.body.size || 0
          });
        }
        if (part.parts) {
          extractFromParts(part.parts);
        }
      });
    };

    if (payload.parts) {
      extractFromParts(payload.parts);
    }

    return attachments;
  }

  async markAsRead(messageId: string): Promise<void> {
    try {
      await this.gapi.client.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        removeLabelIds: ['UNREAD']
      });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }

  async markAsUnread(messageId: string): Promise<void> {
    try {
      await this.gapi.client.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        addLabelIds: ['UNREAD']
      });
    } catch (error) {
      console.error('Error marking as unread:', error);
    }
  }

  async starMessage(messageId: string): Promise<void> {
    try {
      await this.gapi.client.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        addLabelIds: ['STARRED']
      });
    } catch (error) {
      console.error('Error starring message:', error);
    }
  }

  async unstarMessage(messageId: string): Promise<void> {
    try {
      await this.gapi.client.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        removeLabelIds: ['STARRED']
      });
    } catch (error) {
      console.error('Error unstarring message:', error);
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    try {
      await this.gapi.client.gmail.users.messages.trash({
        userId: 'me',
        id: messageId
      });
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  }

  async sendReply(originalMessageId: string, content: string): Promise<void> {
    try {
      // Get original message for reply headers
      const originalMessage = await this.gapi.client.gmail.users.messages.get({
        userId: 'me',
        id: originalMessageId,
        format: 'full'
      });

      const headers = originalMessage.result.payload.headers;
      const getHeader = (name: string) => 
        headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

      const to = getHeader('From');
      const subject = getHeader('Subject');
      const messageId = getHeader('Message-ID');

      const replySubject = subject.startsWith('Re: ') ? subject : `Re: ${subject}`;

      const email = [
        `To: ${to}`,
        `Subject: ${replySubject}`,
        `In-Reply-To: ${messageId}`,
        `References: ${messageId}`,
        '',
        content
      ].join('\n');

      const encodedEmail = btoa(unescape(encodeURIComponent(email)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      await this.gapi.client.gmail.users.messages.send({
        userId: 'me',
        resource: {
          raw: encodedEmail
        }
      });
    } catch (error) {
      console.error('Error sending reply:', error);
      throw error;
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const response = await this.gapi.client.gmail.users.messages.list({
        userId: 'me',
        q: 'in:inbox is:unread',
        maxResults: 1
      });
      return response.result.resultSizeEstimate || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }
}

export const gmailApi = new GmailApiService();
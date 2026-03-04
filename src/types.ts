export interface Contact {
  id: string;
  name: string;
  phone: string;
  [key: string]: string;
}

export interface MessageQueueItem {
  id: string;
  contact: Contact;
  message: string;
  status: 'pending' | 'sent' | 'failed';
}

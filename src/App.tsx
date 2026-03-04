import React, { useState, useRef, useMemo } from 'react';
import { 
  Send, 
  Users, 
  MessageSquare, 
  Upload, 
  Trash2, 
  Sparkles, 
  CheckCircle2, 
  ExternalLink,
  Plus,
  FileText,
  AlertCircle,
  LayoutDashboard,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Papa from 'papaparse';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Contact, MessageQueueItem } from './types';
import { refineMessage } from './services/geminiService';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messageTemplate, setMessageTemplate] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [activeTab, setActiveTab] = useState<'contacts' | 'message' | 'queue'>('contacts');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stats
  const stats = useMemo(() => ({
    totalContacts: contacts.length,
    readyToSend: contacts.length > 0 && messageTemplate.length > 0,
  }), [contacts, messageTemplate]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedContacts: Contact[] = results.data.map((row: any, index: number) => ({
          id: `contact-${Date.now()}-${index}`,
          name: row.name || row.Name || 'Contact',
          phone: row.phone || row.Phone || row.mobile || '',
          ...row
        })).filter(c => c.phone);
        
        setContacts(prev => [...prev, ...parsedContacts]);
      },
      error: (error) => {
        console.error('CSV Parse Error:', error);
        alert('Failed to parse CSV file.');
      }
    });
  };

  const removeContact = (id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id));
  };

  const clearContacts = () => {
    if (confirm('Are you sure you want to clear all contacts?')) {
      setContacts([]);
    }
  };

  const handleRefine = async () => {
    if (!messageTemplate) return;
    setIsRefining(true);
    try {
      const refined = await refineMessage(messageTemplate);
      setMessageTemplate(refined);
    } finally {
      setIsRefining(false);
    }
  };

  const processedQueue: MessageQueueItem[] = useMemo(() => {
    return contacts.map(contact => {
      let message = messageTemplate;
      // Replace placeholders
      Object.keys(contact).forEach(key => {
        const value = contact[key];
        const regex = new RegExp(`{${key}}`, 'gi');
        message = message.replace(regex, value);
      });
      return {
        id: `msg-${contact.id}`,
        contact,
        message,
        status: 'pending'
      };
    });
  }, [contacts, messageTemplate]);

  const openWhatsApp = (item: MessageQueueItem) => {
    const encodedMsg = encodeURIComponent(item.message);
    const phone = item.contact.phone.replace(/\D/g, '');
    const url = `https://wa.me/${phone}?text=${encodedMsg}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen royal-gradient flex flex-col">
      {/* Header */}
      <header className="h-20 border-b border-amethyst-500/20 bg-royal-bg/50 backdrop-blur-xl flex items-center px-8 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amethyst-600 rounded-xl flex items-center justify-center gold-glow">
            <Send className="text-royal-accent w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Tech<span className="text-royal-accent">taire</span>
            </h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-amethyst-400 font-semibold">
              Premium Bulk Messaging
            </p>
          </div>
        </div>

        <nav className="ml-auto flex gap-6">
          <button 
            onClick={() => setActiveTab('contacts')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
              activeTab === 'contacts' ? "bg-amethyst-600/20 text-amethyst-300 border border-amethyst-500/30" : "text-amethyst-400 hover:text-white"
            )}
          >
            <Users size={18} />
            <span className="text-sm font-medium">Contacts</span>
          </button>
          <button 
            onClick={() => setActiveTab('message')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
              activeTab === 'message' ? "bg-amethyst-600/20 text-amethyst-300 border border-amethyst-500/30" : "text-amethyst-400 hover:text-white"
            )}
          >
            <MessageSquare size={18} />
            <span className="text-sm font-medium">Message</span>
          </button>
          <button 
            onClick={() => setActiveTab('queue')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
              activeTab === 'queue' ? "bg-amethyst-600/20 text-amethyst-300 border border-amethyst-500/30" : "text-amethyst-400 hover:text-white"
            )}
          >
            <LayoutDashboard size={18} />
            <span className="text-sm font-medium">Queue</span>
          </button>
        </nav>
      </header>

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar / Stats */}
        <div className="lg:col-span-3 space-y-6">
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-amethyst-400">Campaign Overview</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-sm text-amethyst-200/60">Total Contacts</span>
                <span className="text-2xl font-bold text-white">{stats.totalContacts}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-sm text-amethyst-200/60">Ready to Send</span>
                <span className={cn("text-2xl font-bold", stats.readyToSend ? "text-emerald-400" : "text-amber-400")}>
                  {stats.readyToSend ? stats.totalContacts : 0}
                </span>
              </div>
              <div className="h-1 bg-amethyst-900 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: stats.readyToSend ? '100%' : '0%' }}
                  className="h-full bg-royal-accent"
                />
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-amethyst-400 mb-4">Quick Tips</h3>
            <ul className="text-xs text-amethyst-200/60 space-y-3">
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-royal-accent mt-1 shrink-0" />
                Use <code className="text-royal-accent">{'{name}'}</code> to personalize messages.
              </li>
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-royal-accent mt-1 shrink-0" />
                Upload CSV with 'name' and 'phone' columns.
              </li>
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-royal-accent mt-1 shrink-0" />
                AI Refiner helps optimize for engagement.
              </li>
            </ul>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9">
          <AnimatePresence mode="wait">
            {activeTab === 'contacts' && (
              <motion.div
                key="contacts"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Users className="text-amethyst-400" />
                    Contact List
                  </h2>
                  <div className="flex gap-3">
                    <button 
                      onClick={clearContacts}
                      disabled={contacts.length === 0}
                      className="px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Clear All
                    </button>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-6 py-2 bg-amethyst-600 hover:bg-amethyst-500 text-white rounded-lg font-medium transition-all gold-glow"
                    >
                      <Upload size={18} />
                      Import CSV
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      accept=".csv" 
                      className="hidden" 
                    />
                  </div>
                </div>

                <div className="glass-card overflow-hidden">
                  <div className="max-h-[600px] overflow-y-auto">
                    {contacts.length > 0 ? (
                      <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-royal-card z-10">
                          <tr className="border-b border-amethyst-500/20">
                            <th className="p-4 text-xs font-bold uppercase tracking-widest text-amethyst-400">Name</th>
                            <th className="p-4 text-xs font-bold uppercase tracking-widest text-amethyst-400">Phone</th>
                            <th className="p-4 text-xs font-bold uppercase tracking-widest text-amethyst-400 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-amethyst-500/10">
                          {contacts.map((contact) => (
                            <tr key={contact.id} className="hover:bg-amethyst-600/5 transition-colors group">
                              <td className="p-4 font-medium">{contact.name}</td>
                              <td className="p-4 text-amethyst-300 font-mono text-sm">{contact.phone}</td>
                              <td className="p-4 text-right">
                                <button 
                                  onClick={() => removeContact(contact.id)}
                                  className="p-2 text-amethyst-400 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="p-20 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-16 h-16 bg-amethyst-900/50 rounded-full flex items-center justify-center text-amethyst-500">
                          <Users size={32} />
                        </div>
                        <div>
                          <p className="text-lg font-medium text-amethyst-200">No contacts yet</p>
                          <p className="text-sm text-amethyst-400">Upload a CSV file to get started with your campaign.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'message' && (
              <motion.div
                key="message"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <MessageSquare className="text-amethyst-400" />
                    Message Template
                  </h2>
                  <button 
                    onClick={handleRefine}
                    disabled={!messageTemplate || isRefining}
                    className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-amethyst-600 to-royal-accent text-white rounded-lg font-medium transition-all gold-glow disabled:opacity-50"
                  >
                    <Sparkles size={18} className={isRefining ? "animate-spin" : ""} />
                    {isRefining ? "Refining..." : "AI Refiner"}
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="glass-card p-6 space-y-4">
                      <label className="text-xs font-bold uppercase tracking-widest text-amethyst-400">Compose Message</label>
                      <textarea 
                        value={messageTemplate}
                        onChange={(e) => setMessageTemplate(e.target.value)}
                        placeholder="Hello {name}, we have a special offer for you..."
                        className="w-full h-64 bg-royal-bg/50 border border-amethyst-500/20 rounded-xl p-4 text-white placeholder:text-amethyst-500/50 focus:outline-none focus:border-amethyst-500 transition-colors resize-none"
                      />
                      <div className="flex flex-wrap gap-2">
                        {['name', 'phone'].map(tag => (
                          <button 
                            key={tag}
                            onClick={() => setMessageTemplate(prev => prev + `{${tag}}`)}
                            className="px-3 py-1 bg-amethyst-900/50 border border-amethyst-500/20 rounded-full text-xs text-amethyst-300 hover:bg-amethyst-800 transition-colors"
                          >
                            +{tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="glass-card p-6 space-y-4">
                      <label className="text-xs font-bold uppercase tracking-widest text-amethyst-400">Live Preview</label>
                      <div className="bg-[#0b141a] rounded-2xl p-4 min-h-[300px] relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-12 bg-[#202c33] flex items-center px-4 gap-3">
                          <div className="w-8 h-8 bg-amethyst-600 rounded-full" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">Preview Contact</p>
                            <p className="text-[10px] text-emerald-400">online</p>
                          </div>
                        </div>
                        <div className="mt-14 space-y-4">
                          <div className="bg-[#005c4b] text-white p-3 rounded-lg rounded-tl-none max-w-[85%] shadow-sm relative">
                            <p className="text-sm whitespace-pre-wrap">
                              {messageTemplate ? processedQueue[0]?.message || messageTemplate : "Your message preview will appear here..."}
                            </p>
                            <span className="text-[10px] text-white/50 absolute bottom-1 right-2">12:00 PM</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'queue' && (
              <motion.div
                key="queue"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <LayoutDashboard className="text-amethyst-400" />
                    Sending Queue
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-amethyst-400">
                    <AlertCircle size={16} />
                    <span>Click 'Send' to open WhatsApp Web for each contact.</span>
                  </div>
                </div>

                <div className="glass-card overflow-hidden">
                  <div className="max-h-[600px] overflow-y-auto">
                    {processedQueue.length > 0 ? (
                      <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-royal-card z-10">
                          <tr className="border-b border-amethyst-500/20">
                            <th className="p-4 text-xs font-bold uppercase tracking-widest text-amethyst-400">Recipient</th>
                            <th className="p-4 text-xs font-bold uppercase tracking-widest text-amethyst-400">Message Snippet</th>
                            <th className="p-4 text-xs font-bold uppercase tracking-widest text-amethyst-400 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-amethyst-500/10">
                          {processedQueue.map((item) => (
                            <tr key={item.id} className="hover:bg-amethyst-600/5 transition-colors">
                              <td className="p-4">
                                <p className="font-medium">{item.contact.name}</p>
                                <p className="text-xs text-amethyst-400">{item.contact.phone}</p>
                              </td>
                              <td className="p-4">
                                <p className="text-sm text-amethyst-300 truncate max-w-md">
                                  {item.message}
                                </p>
                              </td>
                              <td className="p-4 text-right">
                                <button 
                                  onClick={() => openWhatsApp(item)}
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-emerald-900/20"
                                >
                                  <ExternalLink size={14} />
                                  Send
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="p-20 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-16 h-16 bg-amethyst-900/50 rounded-full flex items-center justify-center text-amethyst-500">
                          <LayoutDashboard size={32} />
                        </div>
                        <div>
                          <p className="text-lg font-medium text-amethyst-200">Queue is empty</p>
                          <p className="text-sm text-amethyst-400">Add contacts and a message template to see the queue.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-8 border-t border-amethyst-500/10 text-center">
        <p className="text-sm text-amethyst-500">
          &copy; {new Date().getFullYear()} Techtaire Premium. Built for efficiency and elegance.
        </p>
      </footer>
    </div>
  );
}

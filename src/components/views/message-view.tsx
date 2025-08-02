'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '@/lib/i18n';
import { useAuth } from '@/context/auth-context';
import { useUserData } from '@/context/user-data-context';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  setDoc,
  Timestamp,
  updateDoc,
  arrayUnion,
  deleteDoc,
  limit,
  getDocs,
} from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/loader';
import { Send, MessageCircle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { adminEmails } from '@/lib/config';
import { format } from 'date-fns';
import { it, enUS } from 'date-fns/locale';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: Timestamp;
}

interface ConversationParticipant {
  uid: string;
  name: string;
  avatar: string;
}

interface Conversation {
  id: string;
  participants: ConversationParticipant[];
  lastMessage: {
    text: string;
    timestamp: Timestamp;
  };
  unread: boolean;
}

const getConversationId = (uid1: string, uid2: string) => {
  return [uid1, uid2].sort().join('_');
};

export function MessagesView({ preselectedUserId, setPreselectedUserId }: { preselectedUserId: string | null, setPreselectedUserId: (userId: string | null) => void}) {
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const { userStats, updateUserStats } = useUserData();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isAdmin = user ? adminEmails.includes(user.email ?? '') : false;
  const dateLocale = language === 'it' ? it : enUS;

  useEffect(() => {
    if (!user) return;

    const conversationsQuery = query(
      collection(db, 'conversations'),
      where('participantIds', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(conversationsQuery, (snapshot) => {
      const convos: Conversation[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        const otherParticipant = data.participants.find((p: any) => p.uid !== user.uid);
        if (otherParticipant) {
           convos.push({
            id: doc.id,
            participants: data.participants,
            lastMessage: data.lastMessage,
            unread: data.lastMessage?.senderId !== user.uid && !data.readBy.includes(user.uid),
          } as Conversation);
        }
      });
      convos.sort((a, b) => b.lastMessage.timestamp.toMillis() - a.lastMessage.timestamp.toMillis());
      setConversations(convos);
      setLoading(false);
      
      const hasUnread = convos.some(c => c.unread);
      if (userStats?.unreadMessages !== hasUnread) {
        updateUserStats({ unreadMessages: hasUnread });
      }
    });

    return () => unsubscribe();
  }, [user, userStats?.unreadMessages, updateUserStats]);

 useEffect(() => {
    if (preselectedUserId && user) {
        const startConversation = async () => {
            const conversationId = getConversationId(user.uid, preselectedUserId);
            const convoRef = doc(db, 'conversations', conversationId);
            const convoSnap = await getDoc(convoRef);

            if (!convoSnap.exists()) {
                const otherUserDoc = await getDoc(doc(db, 'users', preselectedUserId));
                if (otherUserDoc.exists() && userStats) {
                    const otherUserData = otherUserDoc.data().profile;
                    const newConversation = {
                        participantIds: [user.uid, preselectedUserId],
                        participants: [
                            { uid: user.uid, name: userStats.profile.name, avatar: userStats.profile.avatar },
                            { uid: preselectedUserId, name: otherUserData.name, avatar: otherUserData.avatar }
                        ],
                        lastMessage: { text: 'Conversazione iniziata', timestamp: serverTimestamp() },
                        readBy: [user.uid],
                    };
                    await setDoc(convoRef, newConversation);
                }
            }
            setActiveConversationId(conversationId);
            setPreselectedUserId(null); // Reset after use
        };
        startConversation();
    }
 }, [preselectedUserId, user, userStats, setPreselectedUserId]);


  useEffect(() => {
    if (activeConversationId) {
      setLoadingMessages(true);
      const messagesQuery = query(collection(db, 'conversations', activeConversationId, 'messages'), orderBy('createdAt', 'asc'));

      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const msgs: Message[] = [];
        snapshot.forEach(doc => {
          msgs.push({ id: doc.id, ...doc.data() } as Message);
        });
        setMessages(msgs);
        setLoadingMessages(false);
        markConversationAsRead(activeConversationId);
      });

      return () => unsubscribe();
    } else {
      setMessages([]);
    }
  }, [activeConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

 const markConversationAsRead = async (convoId: string) => {
    if (!user) return;
    const convoRef = doc(db, 'conversations', convoId);
    const convoSnap = await getDoc(convoRef);
    if(convoSnap.exists()){
        const data = convoSnap.data();
        if(!data.readBy.includes(user.uid)){
            await updateDoc(convoRef, { readBy: arrayUnion(user.uid) });
        }
    }
 }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !activeConversationId) return;

    const convoRef = doc(db, 'conversations', activeConversationId);
    await addDoc(collection(convoRef, 'messages'), {
      senderId: user.uid,
      text: newMessage,
      createdAt: serverTimestamp(),
    });

    await setDoc(convoRef, {
        lastMessage: { text: newMessage, timestamp: serverTimestamp() },
        readBy: [user.uid]
    }, { merge: true });
    
    setNewMessage('');
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!activeConversationId) return;
    setIsDeleting(true);

    try {
        const messageRef = doc(db, 'conversations', activeConversationId, 'messages', messageId);
        await deleteDoc(messageRef);

        // Check if it was the last message
        if (messages.length > 0 && messages[messages.length - 1].id === messageId) {
            const messagesQuery = query(collection(db, 'conversations', activeConversationId, 'messages'), orderBy('createdAt', 'desc'), limit(1));
            const lastMessageSnapshot = await getDocs(messagesQuery);

            let newLastMessage = { text: 'Messaggio eliminato', timestamp: serverTimestamp() };
            if (!lastMessageSnapshot.empty) {
                const lastMessageDoc = lastMessageSnapshot.docs[0].data();
                newLastMessage = { text: lastMessageDoc.text, timestamp: lastMessageDoc.createdAt };
            }
            
            await updateDoc(doc(db, 'conversations', activeConversationId), { lastMessage: newLastMessage });
        }
        
        toast({ title: "Messaggio eliminato" });
    } catch (error) {
        console.error("Error deleting message: ", error);
        toast({ variant: 'destructive', title: "Errore", description: "Impossibile eliminare il messaggio." });
    } finally {
        setIsDeleting(false);
    }
  };
  
  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const otherUser = activeConversation?.participants.find(p => p.uid !== user?.uid);

  return (
    <div className="space-y-6">
        <div className="text-center">
            <h1 className="text-3xl font-bold font-headline">{t.nav.messages}</h1>
            <p className="text-muted-foreground mt-2">{t.messages.subtitle}</p>
        </div>
        <Card className="h-[70vh]">
            <CardContent className="p-0 h-full grid grid-cols-1 md:grid-cols-3">
                <div className="border-r border-border flex flex-col">
                    <ScrollArea className="flex-1">
                        {loading ? <Spinner className="m-auto"/> : (
                             conversations.map(convo => {
                                const participant = convo.participants.find(p => p.uid !== user?.uid);
                                if (!participant) return null;
                                const timestamp = convo.lastMessage?.timestamp?.toDate();
                                const displayDate = timestamp ? format(timestamp, 'Pp', { locale: dateLocale }) : '';
                                return (
                                    <button
                                        key={convo.id}
                                        onClick={() => setActiveConversationId(convo.id)}
                                        className={cn(
                                            "flex items-center w-full text-left gap-3 p-3 border-b border-border hover:bg-muted",
                                            activeConversationId === convo.id && "bg-muted"
                                        )}
                                    >
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={participant.avatar} alt={participant.name} />
                                            <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="font-semibold truncate">{participant.name}</p>
                                            <p className="text-sm text-muted-foreground truncate">{displayDate}</p>
                                        </div>
                                         {convo.unread && <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />}
                                    </button>
                                )
                             })
                        )}
                    </ScrollArea>
                </div>
                <div className="md:col-span-2 flex flex-col h-full">
                    {activeConversationId && otherUser ? (
                        <>
                            <div className="p-3 border-b border-border flex items-center gap-3">
                                 <Avatar className="h-9 w-9">
                                    <AvatarImage src={otherUser.avatar} alt={otherUser.name} />
                                    <AvatarFallback>{otherUser.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <h3 className="font-semibold">{otherUser.name}</h3>
                            </div>
                            <ScrollArea className="flex-1 p-4">
                                {loadingMessages ? <Spinner className="m-auto"/> : (
                                    <div className="space-y-1">
                                        {messages.map(msg => {
                                            const canDelete = isAdmin && msg.senderId === user?.uid;
                                            return (
                                                <div key={msg.id} className={cn("flex items-end gap-2 group", msg.senderId === user?.uid ? "justify-end" : "justify-start")}>
                                                    {canDelete && (
                                                         <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" disabled={isDeleting}>
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                       Questa azione è irreversibile.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Annulla</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => handleDeleteMessage(msg.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                                        Elimina
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    )}
                                                    <div className={cn(
                                                        "max-w-xs md:max-w-md p-3 rounded-2xl",
                                                        msg.senderId === user?.uid 
                                                        ? "bg-primary text-primary-foreground rounded-br-none" 
                                                        : "bg-muted rounded-bl-none"
                                                    )}>
                                                        <p className="text-sm">{msg.text}</p>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                         <div ref={messagesEndRef} />
                                    </div>
                                )}
                            </ScrollArea>
                            <div className="p-4 border-t border-border">
                                <div className="flex items-center gap-2">
                                    <Input 
                                        placeholder={t.messages.startTyping}
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    />
                                    <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
                            <MessageCircle className="h-16 w-16 mb-4"/>
                            <p className="text-lg font-semibold">{t.messages.noConversation}</p>
                            <p>{t.messages.selectConversation}</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
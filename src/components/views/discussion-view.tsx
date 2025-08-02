'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { useUserData } from '@/context/user-data-context';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ThumbsUp, Send, MessageSquare, CornerUpLeft, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, serverTimestamp, getDocs, Timestamp, deleteDoc, writeBatch } from 'firebase/firestore';
import { Spinner } from '../loader';
import { formatDistanceToNow } from 'date-fns';
import { it, enUS } from 'date-fns/locale';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { adminEmails } from '@/lib/config';

interface PostAuthor {
  uid: string;
  name: string;
  avatar: string;
}

interface Reply {
  id: string;
  author: PostAuthor;
  content: string;
  createdAt: Timestamp;
}

interface Post {
  id: string;
  author: PostAuthor;
  content: string;
  createdAt: Timestamp;
  likes: string[];
  replyCount: number;
  replies?: Reply[];
}

function PostCard({ post, user, locale }: { post: Post; user: any, locale: string }) {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [likes, setLikes] = useState(post.likes);
    const [showReplies, setShowReplies] = useState(false);
    const [replies, setReplies] = useState<Reply[]>([]);
    const [newReplyContent, setNewReplyContent] = useState('');
    const [isRepliesLoading, setIsRepliesLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const hasLiked = user ? likes.includes(user.uid) : false;
    const isAdmin = user && adminEmails.includes(user.email ?? '');
    const canDelete = user && (user.uid === post.author.uid || isAdmin);

    const dateLocale = locale === 'it' ? it : enUS;
    const timeAgo = post.createdAt ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true, locale: dateLocale }) : t.comments.now;

    const handleLike = async () => {
        if (!user) return;
        const postRef = doc(db, 'posts', post.id);
        if (hasLiked) {
            await updateDoc(postRef, { likes: arrayRemove(user.uid) });
            setLikes(likes.filter(uid => uid !== user.uid));
        } else {
            await updateDoc(postRef, { likes: arrayUnion(user.uid) });
            setLikes([...likes, user.uid]);
        }
    };

    const fetchReplies = async () => {
        if (isRepliesLoading) return;
        setIsRepliesLoading(true);
        const repliesCol = collection(db, 'posts', post.id, 'replies');
        const repliesQuery = query(repliesCol, orderBy('createdAt', 'asc'));
        const repliesSnapshot = await getDocs(repliesQuery);
        setReplies(repliesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reply)));
        setIsRepliesLoading(false);
    };

    const handleToggleReplies = () => {
        const newShowReplies = !showReplies;
        setShowReplies(newShowReplies);
        if (newShowReplies && replies.length === 0) {
            fetchReplies();
        }
    };

    const handleReply = async () => {
        if (newReplyContent.trim() === '' || !user) return;

        const repliesCol = collection(db, 'posts', post.id, 'replies');
        const postRef = doc(db, 'posts', post.id);
        
        await addDoc(repliesCol, {
            author: {
                uid: user.uid,
                name: user.displayName,
                avatar: user.photoURL,
            },
            content: newReplyContent,
            createdAt: serverTimestamp(),
        });
        
        const currentReplyCount = post.replyCount || 0;
        await updateDoc(postRef, { replyCount: currentReplyCount + 1 });

        setNewReplyContent('');
        fetchReplies();
    };

    const handleDelete = async () => {
        if (!canDelete) return;
        setIsDeleting(true);

        try {
            const postRef = doc(db, 'posts', post.id);
            
            // Delete all replies in a batch
            const repliesCol = collection(db, 'posts', post.id, 'replies');
            const repliesSnapshot = await getDocs(repliesCol);
            const batch = writeBatch(db);
            repliesSnapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();

            // Delete the post itself
            await deleteDoc(postRef);

            toast({ title: "Post eliminato con successo." });
        } catch (error) {
            console.error("Error deleting post: ", error);
            toast({ variant: 'destructive', title: "Errore", description: "Impossibile eliminare il post." });
            setIsDeleting(false);
        }
    };

    return (
        <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <Avatar>
                  <AvatarImage src={post.author.avatar} alt={post.author.name} />
                  <AvatarFallback>{post.author.name?.charAt(0) ?? 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <p className="font-semibold">{post.author.name}</p>
                      <p className="text-xs text-muted-foreground">{timeAgo}</p>
                    </div>
                     {canDelete && (
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7" disabled={isDeleting}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Questa azione non può essere annullata. Questo eliminerà permanentemente il post e tutte le risposte.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Annulla</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                        {isDeleting ? <Spinner className="w-4 h-4" /> : "Elimina"}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                         </AlertDialog>
                     )}
                  </div>
                  <p className="mt-1 text-card-foreground/90 whitespace-pre-wrap">{post.content}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleLike} disabled={!user}>
                        <ThumbsUp className={cn("h-4 w-4", hasLiked && "text-primary fill-current")} />
                      </Button>
                      <span className="text-sm font-medium">{likes.length}</span>
                    </div>
                     <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleToggleReplies}>
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <span className="text-sm font-medium">{post.replyCount || 0}</span>
                    </div>
                  </div>

                  {showReplies && (
                      <div className="mt-4 space-y-4">
                          {isRepliesLoading ? <Spinner /> : (
                              replies.map(reply => {
                                  const replyTimeAgo = reply.createdAt ? formatDistanceToNow(reply.createdAt.toDate(), { addSuffix: true, locale: dateLocale }) : t.comments.now;
                                  return (
                                    <div key={reply.id} className="flex items-start gap-3 ml-4">
                                        <Avatar className="h-8 w-8">
                                          <AvatarImage src={reply.author.avatar} alt={reply.author.name} />
                                          <AvatarFallback>{reply.author.name?.charAt(0) ?? 'U'}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 bg-muted p-2 rounded-lg">
                                            <div className="flex items-baseline gap-2">
                                                <p className="font-semibold text-sm">{reply.author.name}</p>
                                                <p className="text-xs text-muted-foreground">{replyTimeAgo}</p>
                                            </div>
                                            <p className="text-sm text-card-foreground/80">{reply.content}</p>
                                        </div>
                                    </div>
                                  )
                              })
                          )}

                          <div className="flex gap-3 ml-4">
                               <Avatar className="h-8 w-8">
                                  <AvatarImage src={user?.photoURL} alt={user?.displayName} />
                                  <AvatarFallback>{user?.displayName?.charAt(0) ?? 'U'}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 flex gap-2">
                                  <Textarea 
                                      placeholder={t.comments.addComment}
                                      value={newReplyContent}
                                      onChange={(e) => setNewReplyContent(e.target.value)}
                                      className="h-10 text-sm"
                                  />
                                  <Button size="icon" className="h-10 w-10 shrink-0" onClick={handleReply} disabled={!newReplyContent.trim()}>
                                      <CornerUpLeft className="h-4 w-4" />
                                  </Button>
                              </div>
                          </div>
                      </div>
                  )}

                </div>
              </div>
            </CardContent>
          </Card>
    )
}

export function DiscussionView() {
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { userStats } = useUserData();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');

  useEffect(() => {
    setIsLoading(true);
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const postsData: Post[] = [];
      querySnapshot.forEach((doc) => {
        postsData.push({ id: doc.id, ...doc.data() } as Post);
      });
      setPosts(postsData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handlePost = async () => {
    if (newPostContent.trim() === '' || !user || !userStats) return;
    setIsPosting(true);

    try {
        await addDoc(collection(db, 'posts'), {
          author: {
            uid: user.uid,
            name: userStats.profile.name,
            avatar: userStats.profile.avatar,
          },
          content: newPostContent,
          likes: [],
          replyCount: 0,
          createdAt: serverTimestamp(),
        });

        setNewPostContent('');

    } catch(error) {
        console.error("Error creating post: ", error);
        toast({ variant: 'destructive', title: "Errore", description: "Impossibile creare il post." });
    } finally {
        setIsPosting(false);
    }
  };

  if (authLoading || !userStats) {
      return <div className="flex justify-center items-center h-64"><Spinner className="h-8 w-8" /></div>
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="text-center">
        <h1 className="text-3xl font-bold font-headline">{t.discussion.title}</h1>
        <p className="text-muted-foreground mt-2">{t.discussion.subtitle}</p>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
            <div className="flex gap-4">
                <Avatar className="h-10 w-10">
                    <AvatarImage src={userStats.profile.avatar} alt={userStats.profile.name} />
                    <AvatarFallback>{userStats.profile.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <Textarea 
                        placeholder={t.discussion.postPlaceholder}
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        className="mb-2"
                    />
                    <div className="flex justify-end items-center mt-2">
                        <Button onClick={handlePost} disabled={isPosting || newPostContent.trim() === ''}>
                            {isPosting ? <Spinner className="mr-2 h-4 w-4" /> : <Send className="mr-2 h-4 w-4" />}
                            {t.discussion.postButton}
                        </Button>
                    </div>
                </div>
            </div>
        </CardContent>
      </Card>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64"><Spinner className="h-8 w-8" /></div>
      ) : (
        <div className="space-y-4">
            {posts.map(post => <PostCard key={post.id} post={post} user={user} locale={language} />)}
        </div>
      )}
    </div>
  );
}
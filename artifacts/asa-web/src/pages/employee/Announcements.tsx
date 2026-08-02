import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { announcementApi } from '@/services/api';
import { queryKeys } from '@/services/queryKeys';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Bell, MessageSquare, Pin, Clock, ChevronRight, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Announcements: React.FC = () => {
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="الإشعارات والتبليغات" 
        description="قرارات وتعاميم إدارية هامة"
      />
      
      {activeThreadId ? (
        <AnnouncementThread threadId={activeThreadId} onBack={() => setActiveThreadId(null)} />
      ) : (
        <AnnouncementList onSelectThread={setActiveThreadId} />
      )}
    </div>
  );
};

const AnnouncementList: React.FC<{ onSelectThread: (id: string) => void }> = ({ onSelectThread }) => {
  const { data: announcements, isLoading } = useQuery({
    queryKey: queryKeys.announcements.list,
    queryFn: announcementApi.list,
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ar-SA', { 
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  if (isLoading) return <Card className="p-8"><LoadingSpinner /></Card>;
  
  if (!announcements || announcements.length === 0) {
    return (
      <EmptyState 
        icon={Bell} 
        title="لا توجد إشعارات" 
        description="لا توجد أي تعاميم أو إشعارات إدارية في الوقت الحالي." 
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {announcements.map((announcement) => (
        <Card 
          key={announcement.id} 
          className={cn(
            "border-border transition-all cursor-pointer hover:bg-card/80 group",
            announcement.pinned ? "bg-primary/5 border-primary/20" : "bg-card/50"
          )}
          onClick={() => onSelectThread(announcement.id)}
        >
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  {announcement.pinned && (
                    <span className="bg-[#C9963F] text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Pin className="h-3 w-3" /> مثبت
                    </span>
                  )}
                  <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                    {announcement.title}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {announcement.body}
                </p>
                <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground/80">
                  <span className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-foreground border border-white/5">
                      {announcement.authorNameAr.charAt(0)}
                    </div>
                    {announcement.authorNameAr} • {announcement.authorRole}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDate(announcement.createdAt)}
                  </span>
                  <span className="flex items-center gap-1 mr-auto bg-black/20 px-2 py-1 rounded">
                    <MessageSquare className="h-3.5 w-3.5" />
                    {announcement.replyCount} ردود
                  </span>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const replySchema = z.object({
  body: z.string().min(1, 'يجب كتابة رد أولاً')
});

const AnnouncementThread: React.FC<{ threadId: string, onBack: () => void }> = ({ threadId, onBack }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: thread, isLoading } = useQuery({
    queryKey: queryKeys.announcements.thread(threadId),
    queryFn: () => announcementApi.getThread(threadId),
  });

  const form = useForm<z.infer<typeof replySchema>>({
    resolver: zodResolver(replySchema),
    defaultValues: { body: '' }
  });

  const replyMutation = useMutation({
    mutationFn: (body: string) => announcementApi.reply(threadId, body),
    onSuccess: () => {
      form.reset();
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.thread(threadId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.list });
      toast({ title: 'تم', description: 'تمت إضافة ردك بنجاح' });
    },
    onError: () => {
      toast({ title: 'خطأ', description: 'فشل إضافة الرد', variant: 'destructive' });
    }
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ar-SA', { 
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  if (isLoading) return <Card className="p-8"><LoadingSpinner /></Card>;
  if (!thread) return null;

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={onBack} className="text-muted-foreground hover:text-foreground pl-0 group mb-2">
        <ChevronRight className="h-5 w-5 ml-1 transition-transform group-hover:-translate-x-1" />
        العودة للقائمة
      </Button>

      {/* OP */}
      <Card className="border-border bg-card shadow-md relative overflow-hidden">
        {thread.pinned && <div className="absolute top-0 right-0 left-0 h-1 bg-[#C9963F]" />}
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground border-b border-border/50 pb-3">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">
              {thread.authorNameAr.charAt(0)}
            </div>
            <div>
              <p className="font-medium text-foreground">{thread.authorNameAr}</p>
              <p className="text-xs">{thread.authorRole} • {formatDate(thread.createdAt)}</p>
            </div>
            {thread.pinned && <Badge variant="outline" className="mr-auto text-[#C9963F] border-[#C9963F]/30 bg-[#C9963F]/5">إشعار مثبت</Badge>}
          </div>
          <CardTitle className="text-xl leading-relaxed">{thread.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm md:text-base leading-loose whitespace-pre-wrap">{thread.body}</p>
        </CardContent>
      </Card>

      {/* Replies */}
      <div className="pl-6 space-y-4 pt-4 border-r-2 border-border/30 mr-6 pr-6">
        <h3 className="text-sm font-semibold text-muted-foreground mb-6 flex items-center gap-2">
          <MessageSquare className="h-4 w-4" /> الردود والتعليقات ({thread.replyCount})
        </h3>
        
        {thread.replies?.map((reply) => (
          <Card key={reply.id} className="bg-card/40 border-border/50 rounded-lg">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-medium text-foreground">{reply.authorNameAr}</span>
                <span className="text-muted-foreground/50">•</span>
                <span className="text-muted-foreground">{reply.authorRole}</span>
                <span className="text-muted-foreground/50">•</span>
                <span className="text-muted-foreground">{formatDate(reply.createdAt)}</span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{reply.body}</p>
            </CardContent>
          </Card>
        ))}

        {/* Reply Form */}
        <div className="pt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => replyMutation.mutate(d.body))} className="flex items-end gap-2">
              <FormField
                control={form.control}
                name="body"
                render={({ field }) => (
                  <FormItem className="flex-1 mb-0">
                    <FormControl>
                      <Input 
                        placeholder="اكتب تعليقاً..." 
                        className="bg-black/20 border-border h-11" 
                        autoComplete="off"
                        {...field} 
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="h-11 px-6 shadow-[0_0_10px_rgba(0,230,118,0.15)]"
                disabled={!form.watch('body')?.trim() || replyMutation.isPending}
              >
                {replyMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Send className="h-4 w-4 ml-2" /> إرسال</>}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

// Adding Badge import
import { Badge } from '@/components/ui/badge';

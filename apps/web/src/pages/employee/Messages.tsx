import React, { useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { messageApi, downloadMessageAttachment } from '@/services/api';
import { queryKeys } from '@/services/queryKeys';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Send, Paperclip, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const messageSchema = z.object({
  body: z.string().optional()
});

export const Messages: React.FC = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: messages, isLoading } = useQuery({
    queryKey: queryKeys.messages.list,
    queryFn: messageApi.list,
    refetchInterval: 10000, // Poll every 10s for new messages
  });

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const form = useForm<z.infer<typeof messageSchema>>({
    resolver: zodResolver(messageSchema),
    defaultValues: { body: '' }
  });

  const sendMutation = useMutation({
    mutationFn: (body: string) => messageApi.send(body),
    onSuccess: () => {
      form.reset();
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.list });
    },
    onError: () => {
      toast({ title: 'خطأ', description: 'فشل إرسال الرسالة', variant: 'destructive' });
    }
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file, body }: { file: File, body?: string }) => messageApi.sendWithAttachment(file, body),
    onSuccess: () => {
      form.reset();
      if (fileInputRef.current) fileInputRef.current.value = '';
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.list });
      toast({ title: 'تم الإرسال', description: 'تم إرسال المرفق بنجاح' });
    },
    onError: (error: any) => {
      toast({ title: 'خطأ في الرفع', description: error.message || 'فشل إرسال المرفق', variant: 'destructive' });
    }
  });

  const onSubmit = (data: z.infer<typeof messageSchema>) => {
    if (!data.body?.trim()) return;
    sendMutation.mutate(data.body);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (e.g. max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'حجم الملف كبير', description: 'الحد الأقصى لحجم الملف هو 5 ميجابايت', variant: 'destructive' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const currentBody = form.getValues().body;
    uploadMutation.mutate({ file, body: currentBody });
  };

  const formatTime = (isoStr: string) => {
    return new Date(isoStr).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-[calc(100dvh-120px)] flex flex-col space-y-4">
      <PageHeader
        title="رسائل القسم / Department messages"
        description="رسائل القسم — يمكن للإدارة العليا مراجعتها / Department messages, visible to senior management"
        className="mb-0 shrink-0"
      />

      <Card className="flex-1 border-border shadow-sm flex flex-col overflow-hidden bg-card/60 backdrop-blur-sm">
        {/* Messages Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6">
          {isLoading ? (
            <div className="h-full flex items-center justify-center"><LoadingSpinner /></div>
          ) : messages && messages.length > 0 ? (
            messages.map((msg, idx) => {
              const isMe = msg.senderId === session?.employeeId;
              const showHeader = idx === 0 || messages[idx - 1].senderId !== msg.senderId;

              return (
                <div key={msg.id} className={cn("flex flex-col max-w-[80%]", isMe ? "ml-auto items-end" : "mr-auto items-start")}>
                  {showHeader && (
                    <div className="flex items-center gap-2 mb-1.5 px-1">
                      <span className="text-xs font-medium text-foreground">{isMe ? 'أنت' : msg.senderNameAr}</span>
                      <span className="text-[10px] text-muted-foreground bg-white/5 px-1.5 py-0.5 rounded">{msg.senderRole}</span>
                    </div>
                  )}

                  <div className={cn(
                    "relative p-3 rounded-2xl",
                    isMe
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-muted/50 border border-border rounded-tl-sm"
                  )}>
                    {msg.body && <p className="text-sm whitespace-pre-wrap break-words">{msg.body}</p>}

                    {msg.attachmentUrl && (
                      <div className={cn("mt-2 rounded-lg overflow-hidden border", isMe ? "border-primary-foreground/20" : "border-border/50")}>
                        <button type="button" className="flex items-center gap-3 p-3 text-start"
                          onClick={() => downloadMessageAttachment(msg.attachmentUrl!, msg.attachmentName || 'attachment')
                            .catch(() => toast({ title: 'Attachment unavailable / المرفق غير متاح', variant: 'destructive' }))}>
                          <FileText className="h-4 w-4" />
                          <span className="text-xs truncate max-w-[200px]">{msg.attachmentName || 'Download / تحميل'}</span>
                        </button>
                      </div>
                    )}

                    <span className={cn(
                      "text-[10px] block mt-1.5 text-left",
                      isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}>
                      {formatTime(msg.sentAt)}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
              <MessageSquare className="h-12 w-12 mb-3" />
              <p>لا توجد رسائل بعد. كن أول من يكتب!</p>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-3 bg-card border-t border-border shrink-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-end gap-2">
              <div className="relative">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.txt,.docx,.xlsx"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-muted-foreground hover:text-foreground shrink-0 rounded-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadMutation.isPending || sendMutation.isPending}
                >
                  {uploadMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5" />}
                </Button>
              </div>

              <FormField
                control={form.control}
                name="body"
                render={({ field }) => (
                  <FormItem className="flex-1 mb-0">
                    <FormControl>
                      <Input
                        placeholder="اكتب رسالة..."
                        className="bg-black/20 border-border h-10 rounded-full px-4"
                        autoComplete="off"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                size="icon"
                className="h-10 w-10 rounded-full shrink-0 shadow-[0_0_10px_rgba(0,230,118,0.2)]"
                disabled={(!form.watch('body')?.trim() && !uploadMutation.isPending) || sendMutation.isPending}
              >
                {sendMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 mr-1" />}
              </Button>
            </form>
          </Form>
        </div>
      </Card>
    </div>
  );
};

// Also adding the MessageSquare import that I missed in the render block
import { MessageSquare } from 'lucide-react';

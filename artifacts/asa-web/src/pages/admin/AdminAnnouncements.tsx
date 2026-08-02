import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { announcementApi } from '@/services/api';
import { queryKeys } from '@/services/queryKeys';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Megaphone, Trash2, Loader2, Pin } from 'lucide-react';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

const announcementSchema = z.object({
  title: z.string().min(3, 'العنوان مطلوب (3 أحرف على الأقل)'),
  body: z.string().min(10, 'المحتوى مطلوب (10 أحرف على الأقل)'),
  pinned: z.boolean().default(false),
});

export const AdminAnnouncements: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: announcements, isLoading } = useQuery({
    queryKey: queryKeys.announcements.list,
    queryFn: announcementApi.list,
  });

  const form = useForm<z.infer<typeof announcementSchema>>({
    resolver: zodResolver(announcementSchema),
    defaultValues: { title: '', body: '', pinned: false }
  });

  const createMutation = useMutation({
    mutationFn: (data: z.infer<typeof announcementSchema>) => 
      announcementApi.create(data.title, data.body, data.pinned),
    onSuccess: () => {
      toast({ title: 'تم', description: 'تم نشر التبليغ بنجاح' });
      form.reset();
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.list });
    },
    onError: (error: any) => {
      toast({ title: 'خطأ', description: error.message || 'فشل النشر', variant: 'destructive' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => announcementApi.delete(id),
    onSuccess: () => {
      toast({ title: 'تم', description: 'تم حذف التبليغ بنجاح' });
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.list });
    },
    onError: (error: any) => {
      toast({ title: 'خطأ', description: error.message || 'فشل الحذف', variant: 'destructive' });
    }
  });

  return (
    <div className="space-y-6">
      <PageHeader 
        title="إدارة التبليغات" 
        description="نشر وإدارة التعاميم الإدارية الهامة"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 border-border shadow-sm h-fit sticky top-24 bg-card/60 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6 text-lg font-bold">
              <Megaphone className="h-5 w-5 text-primary" /> نشر تبليغ جديد
            </div>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel>العنوان</FormLabel>
                    <FormControl><Input className="bg-black/20" placeholder="عنوان التبليغ..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                
                <FormField control={form.control} name="body" render={({ field }) => (
                  <FormItem>
                    <FormLabel>المحتوى</FormLabel>
                    <FormControl>
                      <Textarea className="bg-black/20 min-h-[150px] resize-none" placeholder="اكتب نص التعميم هنا..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                
                <FormField control={form.control} name="pinned" render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border bg-black/20 p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm">تثبيت في الأعلى</FormLabel>
                      <FormDescription className="text-xs">سيظهر هذا التبليغ دائماً في أعلى القائمة</FormDescription>
                    </div>
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )} />
                
                <Button type="submit" className="w-full mt-2" disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : 'نشر التبليغ'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold text-muted-foreground flex items-center gap-2">التبليغات السابقة</h3>
          
          {isLoading ? (
            <Card className="p-12"><LoadingSpinner /></Card>
          ) : announcements && announcements.length > 0 ? (
            announcements.map((announcement) => (
              <Card key={announcement.id} className="border-border bg-card/40 hover:bg-card/60 transition-colors">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      {announcement.pinned && <Pin className="h-4 w-4 text-[#C9963F]" />}
                      <h4 className="font-bold text-lg leading-tight">{announcement.title}</h4>
                    </div>
                    <Button 
                      variant="ghost" size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mt-2 -mr-2"
                      onClick={() => setDeleteId(announcement.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{announcement.body}</p>
                  <div className="flex justify-between items-center text-xs text-muted-foreground/70 border-t border-border/50 pt-3">
                    <span>{new Date(announcement.createdAt).toLocaleDateString('ar-SA')}</span>
                    <span>الردود: {announcement.replyCount}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="p-12 text-center text-muted-foreground border-dashed">
              لا توجد تبليغات سابقة
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog 
        open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}
        title="حذف التبليغ" description="هل أنت متأكد من رغبتك في حذف هذا التبليغ بشكل نهائي؟"
        isDestructive onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
      />
    </div>
  );
};


import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { StickyNote } from 'lucide-react';
import { adminApi, type EmployeeNoteDto } from '@/services/api';
import { loadSession } from '@/services/auth';
import { queryKeys } from '@/services/queryKeys';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const categoryLabels: Record<EmployeeNoteDto['category'], string> = {
  GENERAL: 'ملاحظة عامة',
  PERFORMANCE: 'الأداء',
  CONDUCT: 'السلوك',
  COMMENDATION: 'إشادة',
};

export const MyNotes: React.FC = () => {
  const session = loadSession();
  const { data: notes, isLoading } = useQuery({
    queryKey: queryKeys.admin.employeeNotes(session?.employeeId || ''),
    queryFn: () => adminApi.listEmployeeNotes(session!.employeeId),
    enabled: !!session,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="ملاحظاتي الإدارية"
        description="الملاحظات المسجلة من مدير قسمك"
      />

      {isLoading ? (
        <LoadingSpinner />
      ) : notes?.length ? (
        <div className="space-y-3">
          {notes.map((note) => (
            <Card key={note.id} className="border-border bg-card">
              <CardContent className="p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge variant="outline">{categoryLabels[note.category]}</Badge>
                  <time className="text-xs text-muted-foreground" dir="ltr">
                    {new Date(note.createdAt).toLocaleString('ar-SA')}
                  </time>
                </div>
                <p className="whitespace-pre-wrap leading-7">{note.note}</p>
                <p className="text-xs text-muted-foreground">أضيفت بواسطة: {note.authorNameAr}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-border bg-card">
          <CardContent className="p-10 text-center text-muted-foreground">
            <StickyNote className="h-10 w-10 mx-auto mb-3 opacity-50" />
            لا توجد ملاحظات مسجلة لك
          </CardContent>
        </Card>
      )}
    </div>
  );
};

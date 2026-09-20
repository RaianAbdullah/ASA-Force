import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';

export const WaitingApproval: React.FC = () => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden py-12">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-[#C9963F]/5 blur-[120px]" />
      </div>

      <div className="w-full max-w-md p-4 relative z-10">
        <Card className="border-border bg-card/60 backdrop-blur-xl shadow-2xl text-center">
          <CardContent className="pt-10 pb-8 space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-[#C9963F]/10 flex items-center justify-center border border-[#C9963F]/20">
                <Clock className="h-10 w-10 text-[#C9963F] animate-pulse" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-foreground tracking-tight">في انتظار الموافقة</h3>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
                لقد تم استلام طلب التسجيل الخاص بك وهو الآن قيد المراجعة من قبل الإدارة. ستتمكن من تسجيل الدخول بمجرد الموافقة على حسابك.
              </p>
            </div>
            
            <div className="pt-4 border-t border-border">
              <Link href="/login">
                <Button variant="ghost" className="w-full text-muted-foreground hover:text-foreground">
                  العودة لتسجيل الدخول
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

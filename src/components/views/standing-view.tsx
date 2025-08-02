'use client';

import { useTranslation } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function StandingsView() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Card>
        <CardHeader>
          <CardTitle>Lombardia - Alievi Provinciali U17 Legnano - Girone A</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-hidden rounded-lg border shadow-sm" style={{ minHeight: '600px' }}>
            <iframe 
              src='https://www.tuttocampo.it/WidgetV2/Classifica/f735fcc3-d921-47c9-b834-46507f8004d2' 
              className='w-full h-full min-h-[800px] border-0'
              scrolling='no' 
              loading='lazy'>
            </iframe>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
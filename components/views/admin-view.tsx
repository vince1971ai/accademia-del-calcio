'use client';
import { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Spinner } from '@/components/loader';
import { getQuizDataForImport } from '@/ai/flows/import-quizzes-flow';
import { getTacticsDataForImport } from '@/ai/flows/import-tactics-flow';
import { getGlossaryDataForImport } from '@/ai/flows/import-glossary-flow';
import { collection, writeBatch, doc, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type CollectionName = 'quizCategories' | 'quizzes' | 'formations' | 'glossary';

export function AdminView() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<Record<CollectionName, 'pending' | 'done' | 'error'>>({
    quizCategories: 'pending',
    quizzes: 'pending',
    formations: 'pending',
    glossary: 'pending',
  });

  const clearAllData = async () => {
    const collectionsToClear: CollectionName[] = ['quizzes', 'quizCategories', 'formations', 'glossary'];
    for (const collectionName of collectionsToClear) {
      try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        const batch = writeBatch(db);
        querySnapshot.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      } catch (error) {
         console.error(`Error clearing ${collectionName}:`, error);
      }
    }
  }


  const handleImport = async () => {
    setIsImporting(true);
    setImportStatus({
        quizCategories: 'pending',
        quizzes: 'pending',
        formations: 'pending',
        glossary: 'pending',
    });

    await clearAllData();

    try {
      // Import quiz data
      const { categories, quizzes } = await getQuizDataForImport();
      let batch = writeBatch(db);
      categories.forEach((item: any) => {
        const docRef = doc(db, 'quizCategories', item.docId);
        const fields = item.fields.reduce((acc: any, field: any) => ({ ...acc, [field.name]: field.value }), {});
        batch.set(docRef, fields);
      });
      await batch.commit();
      setImportStatus(s => ({ ...s, quizCategories: 'done' }));

      batch = writeBatch(db);
      quizzes.forEach((item: any) => {
        const docRef = doc(db, 'quizzes', item.docId);
        batch.set(docRef, item.fields);
      });
      await batch.commit();
      setImportStatus(s => ({ ...s, quizzes: 'done' }));

      // Import tactics data
      const { formations } = await getTacticsDataForImport();
      batch = writeBatch(db);
      formations.forEach((item: any) => {
        const docRef = doc(db, 'formations', item.docId);
        const fields = item.fields.reduce((acc: any, field: any) => {
           if (field.type === 'json') {
                try {
                    acc[field.name] = JSON.parse(field.value);
                } catch(e) {
                    console.error("Failed to parse JSON for", item.docId, field.name, e);
                    acc[field.name] = [];
                }
            } else {
                acc[field.name] = field.value;
            }
            return acc;
        }, {});
        batch.set(docRef, fields);
      });
      await batch.commit();
      setImportStatus(s => ({ ...s, formations: 'done' }));

      // Import glossary data
      const { glossary } = await getGlossaryDataForImport();
      batch = writeBatch(db);
      glossary.forEach((item: any) => {
        const docRef = doc(db, 'glossary', item.docId);
        const fields = item.fields.reduce((acc: any, field: any) => ({ ...acc, [field.name]: field.value }), {});
        batch.set(docRef, fields);
      });
      await batch.commit();
      setImportStatus(s => ({ ...s, glossary: 'done' }));


      toast({ title: 'Successo!', description: 'Dati di base importati correttamente.' });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Errore', description: 'Importazione fallita. Controlla la console per i dettagli.' });
    } finally {
      setIsImporting(false);
    }
  };

  const getStatusColor = (status: 'pending' | 'done' | 'error') => {
    if (status === 'done') return 'text-green-500';
    if (status === 'error') return 'text-red-500';
    return 'text-muted-foreground';
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pannello di Amministrazione</CardTitle>
          <CardDescription>Strumenti e utilità per la gestione dell'app.</CardDescription>
        </CardHeader>
        <CardContent>
            <Card>
                <CardHeader>
                    <CardTitle>Importazione Dati di Base</CardTitle>
                    <CardDescription>
                        Usa questo strumento per popolare il database con i dati essenziali (quiz, tattiche, ecc.).
                        Questo cancellerà e sostituirà i dati esistenti.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleImport} disabled={isImporting}>
                        {isImporting ? <Spinner className="mr-2"/> : null}
                        {isImporting ? 'Importazione in corso...' : 'Avvia Importazione Dati'}
                    </Button>
                    {isImporting && (
                        <div className="mt-4 space-y-2">
                            <p className={getStatusColor(importStatus.quizCategories)}>Stato Categorie Quiz: {importStatus.quizCategories}</p>
                            <p className={getStatusColor(importStatus.quizzes)}>Stato Quiz: {importStatus.quizzes}</p>
                            <p className={getStatusColor(importStatus.formations)}>Stato Tattiche: {importStatus.formations}</p>
                             <p className={getStatusColor(importStatus.glossary)}>Stato Glossario: {importStatus.glossary}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </CardContent>
      </Card>
    </div>
  );
}

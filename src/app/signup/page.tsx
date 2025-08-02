'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/lib/i18n';
import { Loader2 } from 'lucide-react';
import { FullScreenLoader } from '@/components/loader';
import { invitationCode } from '@/lib/config';

const formSchema = z.object({
  email: z.string().email({ message: "Indirizzo email non valido." }),
  password: z.string().min(6, { message: 'La password deve contenere almeno 6 caratteri.' }),
  invitationCode: z.string().min(1, { message: "Il codice di invito è obbligatorio." }),
});

export default function SignupPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user, signup, loading } = useAuth();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      invitationCode: '',
    },
  });

  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (values.invitationCode !== invitationCode) {
      toast({
        variant: "destructive",
        title: t.login.toast.errorTitle,
        description: t.login.toast.invitationCodeError,
      });
      return;
    }

    try {
      await signup(values.email, values.password);
      router.push('/');
    } catch (error: any) {
      console.error(error);
      let description = t.login.toast.unexpectedError;
      if (error.code === 'auth/email-already-in-use') {
          description = t.login.toast.emailInUse;
      }
      toast({
        variant: "destructive",
        title: t.login.toast.errorTitle,
        description: description,
      });
    }
  }

  if (loading || user) {
    return <FullScreenLoader />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold font-headline">{t.appName}</CardTitle>
          <CardDescription>{t.login.signupTitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.login.emailLabel}</FormLabel>
                    <FormControl>
                      <Input placeholder="nome@esempio.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.login.passwordLabel}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="********" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="invitationCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.login.invitationCodeLabel}</FormLabel>
                    <FormControl>
                      <Input placeholder={t.login.invitationCodePlaceholder} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t.login.signupButton}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-sm">
            {t.login.loginPrompt}{' '}
            <Link href="/login">
              <span className="font-semibold text-primary hover:underline">
                {t.login.loginLink}
              </span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

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

const formSchema = z.object({
  email: z.string().email({ message: 'Indirizzo email non valido.' }),
  password: z.string().min(6, { message: 'La password deve contenere almeno 6 caratteri.' }),
});

export default function LoginPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user, login, loading } = useAuth();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await login(values.email, values.password);
      router.push('/');
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: t.login.toast.errorTitle,
        description: t.login.toast.invalidCredentials,
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
          <CardDescription>{t.login.title}</CardDescription>
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
              <div className="flex items-center justify-end">
                <Link href="/forgot-password">
                  <span className="text-sm text-primary hover:underline">
                    {t.login.forgotPasswordLink}
                  </span>
                </Link>
              </div>
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t.login.loginButton}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-sm">
            {t.login.signupPrompt}{' '}
            <Link href="/signup">
              <span className="font-semibold text-primary hover:underline">
                {t.login.signupLink}
              </span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

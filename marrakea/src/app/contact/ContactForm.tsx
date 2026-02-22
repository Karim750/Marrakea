'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactFormSchema, type ContactFormData } from '@/lib/validations/schemas';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import styles from './ContactForm.module.css';

export function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BFF_URL || 'http://localhost:3002'}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi du message');
      }

      setStatus('success');
      reset();
    } catch (error) {
      setStatus('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'Une erreur est survenue'
      );
    }
  };

  if (status === 'success') {
    return (
      <div className={styles.success}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className={styles.successIcon}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
        <h3 className={styles.successTitle}>Message envoyé</h3>
        <p className={styles.successText}>
          Merci pour votre message. Nous vous répondrons dans les plus brefs délais.
        </p>
        <Button onClick={() => setStatus('idle')} variant="ghost">
          Envoyer un autre message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <div className={styles.field}>
        <label htmlFor="name" className={styles.label}>
          Nom <span className={styles.required}>*</span>
        </label>
        <Input
          id="name"
          {...register('name')}
          placeholder="Votre nom"
          error={errors.name?.message}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="email" className={styles.label}>
          Email <span className={styles.required}>*</span>
        </label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          placeholder="votre@email.com"
          error={errors.email?.message}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="subject" className={styles.label}>
          Sujet <span className={styles.required}>*</span>
        </label>
        <Input
          id="subject"
          {...register('subject')}
          placeholder="L'objet de votre message"
          error={errors.subject?.message}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="message" className={styles.label}>
          Message <span className={styles.required}>*</span>
        </label>
        <textarea
          id="message"
          {...register('message')}
          placeholder="Votre message..."
          rows={6}
          className={styles.textarea}
        />
        {errors.message && (
          <span className={styles.error}>{errors.message.message}</span>
        )}
      </div>

      {status === 'error' && (
        <div className={styles.errorBanner}>
          <p>{errorMessage}</p>
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={status === 'loading'}
        fullWidth
      >
        {status === 'loading' ? 'Envoi en cours...' : 'Envoyer le message'}
      </Button>
    </form>
  );
}

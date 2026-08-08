'use client';

import { FormEvent, useState } from 'react';

type RegisterResponse = {
  id: string;
  email: string;
  athleteProfile: {
    id: string;
    displayName: string;
    preferredWeightUnit: 'KG' | 'LB';
  };
};

type ApiErrorResponse = {
  message?: string | string[];
};

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [preferredWeightUnit, setPreferredWeightUnit] = useState<'KG' | 'LB'>(
    'KG',
  );

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          displayName,
          preferredWeightUnit,
        }),
      });

      const data = (await response.json()) as RegisterResponse | ApiErrorResponse;

      if (!response.ok) {
        const message =
          'message' in data
            ? Array.isArray(data.message)
              ? data.message.join(', ')
              : data.message
            : 'Unable to register';

        setError(message ?? 'Unable to register');
        return;
      }

      const registeredUser = data as RegisterResponse;

      setSuccess(`Account created for ${registeredUser.email}`);

      setEmail('');
      setPassword('');
      setDisplayName('');
      setPreferredWeightUnit('KG');
    } catch {
      setError('Unable to connect to the server');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold">Create your WODLab account</h1>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="displayName" className="block font-medium">
              Display name
            </label>

            <input
              id="displayName"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block font-medium">
              Email
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block font-medium">
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
              minLength={8}
              required
            />
          </div>

          <div>
            <label htmlFor="weightUnit" className="block font-medium">
              Preferred weight unit
            </label>

            <select
              id="weightUnit"
              value={preferredWeightUnit}
              onChange={(event) =>
                setPreferredWeightUnit(event.target.value as 'KG' | 'LB')
              }
              className="mt-1 w-full rounded border px-3 py-2"
            >
              <option value="KG">Kilograms</option>
              <option value="LB">Pounds</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>

          {error && (
            <p className="text-sm text-red-600">
              {error}
            </p>
          )}

          {success && (
            <p className="text-sm text-green-600">
              {success}
            </p>
          )}
        </form>
      </div>
    </main>
  );
}
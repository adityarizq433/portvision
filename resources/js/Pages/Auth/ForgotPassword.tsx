import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <GuestLayout>
            <Head title="Lupa Kata Sandi" />

            <div className="mb-4 text-sm text-gray-600">
                Lupa kata sandi? Masukkan alamat email operator Anda dan kami kirim
                tautan untuk memilih kata sandi baru.
            </div>

            {status && (
                <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-700" role="alert">
                    {status}
                </div>
            )}

            <form onSubmit={submit}>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Alamat Email</label>
                <TextInput
                    id="email"
                    type="email"
                    name="email"
                    value={data.email}
                    className="mt-1 block w-full"
                    isFocused={true}
                    autoComplete="username"
                    required
                    onChange={(e) => setData('email', e.target.value)}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    aria-invalid={!!errors.email}
                />
                <span id="email-error"><InputError message={errors.email} className="mt-2" /></span>

                <div className="mt-4 flex items-center justify-end">
                    <PrimaryButton className="ms-4 w-full" disabled={processing}>
                        {processing ? 'Mengirim…' : 'Kirim Tautan Reset Kata Sandi'}
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({
    status,
}: PageProps<{ status?: string }>) {
    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h1 className="text-lg font-bold tracking-tight text-navy-900">
                        PENGATURAN PROFIL OPERATOR
                    </h1>
                    <p className="mt-0.5 text-xs text-gray-500 font-mono">
                        Kelola informasi akun, kata sandi, dan kredensial akses
                    </p>
                </div>
            }
        >
            <Head title="Pengaturan Profil" />

            <div className="max-w-4xl space-y-6">
                <div className="pv-card p-6">
                    <UpdateProfileInformationForm status={status} className="max-w-xl" />
                </div>

                <div className="pv-card p-6">
                    <UpdatePasswordForm className="max-w-xl" />
                </div>

                <div className="pv-card p-6 border-red-200 bg-red-50/20">
                    <DeleteUserForm className="max-w-xl" />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'admin@portvision.local'],
            [
                'name'     => 'Admin NOC',
                'email'    => 'admin@portvision.local',
                'password' => Hash::make('admin123'),
                'role'     => 'admin',
            ]
        );

        User::firstOrCreate(
            ['email' => 'viewer@portvision.local'],
            [
                'name'     => 'Viewer NOC',
                'email'    => 'viewer@portvision.local',
                'password' => Hash::make('viewer123'),
                'role'     => 'viewer',
            ]
        );
    }
}

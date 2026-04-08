<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        \App\Models\User::firstOrCreate([
            'email' => 'test@example.com'
        ], [
            'name' => 'Admin',
            'password' => bcrypt('admin123')
        ]);

        $seeders = [
            PangkatSeeder::class,
        ];

        if (class_exists(PegawaiSeeder::class)) {
            $seeders[] = PegawaiSeeder::class;
        }

        $this->call($seeders);
    }
}

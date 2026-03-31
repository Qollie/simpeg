<?php

namespace Tests\Feature;

use App\Models\Pegawai;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CareerProcessStatusTest extends TestCase
{
    use RefreshDatabase;

    public function test_process_statuses_returns_default_blm_and_persists_row(): void
    {
        $this->actingAsApiUser();
        $this->createActivePegawai('198901012014031111', 'Andi Pratama', 'andi@example.com');

        $response = $this->withHeaders($this->apiHeaders())
            ->getJson('/api/karir/status-proses');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.nipPegawai', '198901012014031111')
            ->assertJsonPath('data.0.nama', 'Andi Pratama')
            ->assertJsonPath('data.0.status', 'blm');

        $this->assertDatabaseHas('KarirStatusProses', [
            'nipPegawai' => '198901012014031111',
            'status' => 'blm',
        ]);
    }

    public function test_update_process_status_changes_to_sdh_diproses(): void
    {
        $this->actingAsApiUser();
        $this->createActivePegawai('198901012014031112', 'Bima Adi', 'bima@example.com');

        $response = $this->withHeaders($this->apiHeaders())
            ->patchJson('/api/karir/status-proses/198901012014031112', [
                'status' => 'sdh diproses',
            ]);

        $response->assertOk()
            ->assertJsonPath('nipPegawai', '198901012014031112')
            ->assertJsonPath('status', 'sdh diproses');

        $this->assertDatabaseHas('KarirStatusProses', [
            'nipPegawai' => '198901012014031112',
            'status' => 'sdh diproses',
        ]);
    }

    private function createActivePegawai(string $nip, string $nama, string $email): void
    {
        Pegawai::query()->create([
            'nipPegawai' => $nip,
            'nama' => $nama,
            'gelarDepan' => null,
            'gelarBelakang' => null,
            'tempatLahir' => 'Makassar',
            'tanggalLahir' => '1989-01-01',
            'jenisKelamin' => 'Laki-laki',
            'agama' => 'Islam',
            'alamat' => 'Jl. Veteran',
            'email' => $email,
            'noHp' => '081234567890',
            'foto' => '',
            'jabatan' => 'Analis',
            'departemen' => 'Kepegawaian',
            'golongan' => 'III/a',
            'status' => 'Aktif',
            'tanggalMasuk' => '2014-03-01',
        ]);
    }

    private function actingAsApiUser(): void
    {
        $user = User::factory()->create([
            'email' => 'admin.career@example.com',
        ]);

        $user->remember_token = 'career-test-token';
        $user->save();
    }

    /**
     * @return array<string, string>
     */
    private function apiHeaders(): array
    {
        return [
            'Authorization' => 'Bearer career-test-token',
            'Accept' => 'application/json',
        ];
    }
}

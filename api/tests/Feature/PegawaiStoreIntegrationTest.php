<?php

namespace Tests\Feature;

use App\Models\IdentitasResmi;
use App\Models\Kepegawaian;
use App\Models\Pegawai;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PegawaiStoreIntegrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_store_creates_pegawai_and_related_records_when_tmt_cpns_is_omitted(): void
    {
        $this->actingAsApiUser();

        $response = $this->withHeaders($this->apiHeaders())->postJson('/api/pegawai', $this->validPayload());

        $response->assertCreated()
            ->assertJsonPath('nipPegawai', '198901012014031001');

        $this->assertDatabaseHas('Pegawai', [
            'nipPegawai' => '198901012014031001',
            'nama' => 'Budi Santoso',
            'email' => 'budi@example.com',
        ]);

        $this->assertDatabaseHas('IdentitasResmi', [
            'nipIdResmi' => '198901012014031001',
            'nik' => '7301010101010001',
        ]);

        $this->assertDatabaseHas('Kepegawaian', [
            'nipKepegawaian' => '198901012014031001',
            'statusPegawai' => 'PNS',
            'jenisPegawai' => 'Tenaga Struktural',
            'masaKerjaTahun' => 0,
            'masaKerjaBulan' => 0,
        ]);

        $this->assertNull(
            Kepegawaian::query()->findOrFail('198901012014031001')->tmtCpns
        );
    }

    public function test_store_returns_validation_error_for_duplicate_nik_without_database_exception(): void
    {
        $this->actingAsApiUser();

        Pegawai::create([
            'nipPegawai' => '198901012014031001',
            'nama' => 'Pegawai Lama',
            'tempatLahir' => 'Makassar',
            'tanggalLahir' => '1989-01-01',
            'jenisKelamin' => 'Laki-laki',
            'agama' => 'Islam',
            'email' => 'lama@example.com',
            'noHp' => '081234567890',
            'foto' => '',
            'jabatan' => 'Analis',
            'golongan' => 'III/a',
            'status' => 'Aktif',
            'departemen' => 'Umum',
            'tanggalMasuk' => '2014-03-01',
        ]);

        IdentitasResmi::create([
            'nipIdResmi' => '198901012014031001',
            'nik' => '7301010101010001',
        ]);

        Kepegawaian::create([
            'nipKepegawaian' => '198901012014031001',
            'statusPegawai' => 'PNS',
            'jenisPegawai' => 'Tenaga Struktural',
            'masaKerjaTahun' => 0,
            'masaKerjaBulan' => 0,
        ]);

        $payload = $this->validPayload([
            'nipPegawai' => '198901012014031002',
            'email' => 'baru@example.com',
        ]);

        $response = $this->withHeaders($this->apiHeaders())->postJson('/api/pegawai', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['nik']);

        $this->assertDatabaseMissing('Pegawai', [
            'nipPegawai' => '198901012014031002',
        ]);
    }

    private function actingAsApiUser(): void
    {
        $user = User::factory()->create([
            'email' => 'admin@example.com',
        ]);

        $user->remember_token = 'integration-test-token';
        $user->save();
    }

    /**
     * @return array<string, string>
     */
    private function apiHeaders(): array
    {
        return [
            'Authorization' => 'Bearer integration-test-token',
            'Accept' => 'application/json',
        ];
    }

    /**
     * @param array<string, mixed> $overrides
     * @return array<string, mixed>
     */
    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'nipPegawai' => '198901012014031001',
            'nama' => 'Budi Santoso',
            'gelarDepan' => null,
            'gelarBelakang' => null,
            'tempatLahir' => 'Makassar',
            'tanggalLahir' => '1989-01-01',
            'jenisKelamin' => 'Laki-laki',
            'agama' => 'Islam',
            'alamat' => 'Jl. Veteran',
            'email' => 'budi@example.com',
            'noHp' => '081234567891',
            'jabatan' => 'Analis SDM',
            'golongan' => 'III/a',
            'status' => 'Aktif',
            'departemen' => 'Kepegawaian',
            'tanggalMasuk' => '2014-03-01',
            'nik' => '7301010101010001',
            'statusPegawai' => 'PNS',
            'jenisPegawai' => 'Tenaga Struktural',
            'masaKerjaTahun' => 0,
            'masaKerjaBulan' => 0,
        ], $overrides);
    }
}

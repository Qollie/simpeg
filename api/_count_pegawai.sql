SELECT 'Pegawai' AS table_name, COUNT(*) AS total FROM "Pegawai"
UNION ALL SELECT 'Kepegawaian', COUNT(*) FROM "Kepegawaian"
UNION ALL SELECT 'IdentitasResmi', COUNT(*) FROM "IdentitasResmi"
UNION ALL SELECT 'RiwayatPangkat', COUNT(*) FROM "RiwayatPangkat"
UNION ALL SELECT 'EfilePegawai', COUNT(*) FROM "EfilePegawai"
UNION ALL SELECT 'KarirStatusProses', COUNT(*) FROM "KarirStatusProses";

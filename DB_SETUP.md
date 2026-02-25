# Database setup & connection

Quick steps to wire the provided SQL schema into this project (Laravel API + React front-end):

1) Import the provided SQL into your database (Postgres recommended since SQL file uses double-quoted identifiers):

   psql -U <user> -d <database> -f "query sql simpeg_kaltim.txt"

2) Configure Laravel DB connection: copy `api/.env.example` to `api/.env` and set the `DB_` values, for example:

   DB_CONNECTION=pgsql
   DB_HOST=127.0.0.1
   DB_PORT=5432
   DB_DATABASE=your_db
   DB_USERNAME=your_user
   DB_PASSWORD=your_pass

3) If you prefer to use Laravel migrations instead of importing SQL, run (from `api/`):

   php artisan migrate

   Note: migrations were added under `api/database/migrations` and create the tables present in the SQL.

4) Start backend and frontend:

   - Backend (Laravel):

     cd api
     php -S 127.0.0.1:8000 -t public  # or use `php artisan serve`

   - Frontend (React):

     cd react
     npm install
     npm run dev

5) Frontend component: include `react/components/pegawai/PegawaiList.tsx` on any page to show the list. It fetches `/api/pegawai`.

If you want, I can run and test migrations or wire a seed importer next.

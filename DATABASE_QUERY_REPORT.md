# Database Query Report: Customers in Implementation/Live Stages

## Executive Summary

I attempted to query the Supabase database to check which customers are in "Implementation" or "Live" pipeline stages and whether they have active or pending contracts. However, I was unable to complete the query due to **Row Level Security (RLS)** policies that require authentication.

## Findings

### 1. Database Connection
- **Status**: Successfully connected to Supabase
- **URL**: `https://vnhwhyufevcixgelsujb.supabase.co`
- **Authentication**: Used anonymous (anon) key - this provides unauthenticated access

### 2. Row Level Security (RLS)
The database has Row Level Security enabled on both the `customers` and `contracts` tables with the following policies:

**Customers Table Policies** (from migration `20251004233010`):
- SELECT: Requires `authenticated` role
- INSERT: Requires `authenticated` role with `auth.uid() IS NOT NULL`
- UPDATE: Requires `authenticated` role
- DELETE: Requires `authenticated` role

**Impact**: The anonymous key cannot read data from these tables. Only authenticated users can access the data.

### 3. Database Schema
I successfully retrieved the database schema, which shows:

**Customers Table** includes:
- `id` (UUID)
- `name` (string)
- `stage` (string) - This is the field we need to filter on
- `status` (string)
- `contact_name`, `contact_email` (string)
- `go_live_date` (date)
- Other fields...

**Contracts Table** includes:
- `id` (UUID)
- `customer_id` (UUID) - Foreign key to customers table
- `name` (string)
- `status` (string) - This is the field to check for 'active' or 'pending'
- `value` (number)
- `start_date`, `end_date`, `renewal_date` (dates)
- Other fields...

### 4. Query Result
- **Customers found**: 0 (due to RLS blocking access)
- **Contracts found**: 0 (due to RLS blocking access)
- **Actual data**: Unknown - the tables may contain data but it's not accessible with anonymous access

## How to Query the Database Properly

There are three main options to access the database and run the required queries:

### Option 1: Use the Supabase Dashboard (RECOMMENDED)
This is the easiest and most secure method.

1. Go to https://supabase.com/dashboard
2. Log in to your Supabase account
3. Select the project: `vnhwhyufevcixgelsujb`
4. Navigate to **SQL Editor** in the left sidebar
5. Open the SQL file I created: `query-customers-contracts.sql`
6. Run each query section to get the results

The SQL file contains:
- Query 1: List customers in Implementation/Live with contract counts
- Query 2: Detailed view with all contract information
- Query 3: Summary statistics
- Query 4: All unique stages in the database
- Query 5: All unique contract statuses

### Option 2: Use Supabase Service Role Key
If you need to run queries programmatically with full admin access:

1. Get the Service Role Key from Supabase Dashboard:
   - Go to Project Settings > API
   - Copy the `service_role` key (keep this secret!)

2. Create a `.env.local` file with:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

3. Use the service role key in your Node.js script instead of the anon key

**⚠️ WARNING**: The service role key bypasses ALL RLS policies. Never expose it in client-side code or commit it to version control.

### Option 3: Authenticate as a User
If you want to query through the application's normal authentication flow:

1. Start the application: `npm run dev`
2. Navigate to the login page
3. Sign in with valid credentials
4. The authenticated session will have access to the data through the RLS policies

## SQL Queries Created

I've created a SQL file at:
```
/Users/alialtoblani/Downloads/lifecycle-connector/query-customers-contracts.sql
```

This file contains comprehensive queries to:
1. List all customers in "Implementation" or "Live" stages
2. Show their contract information
3. Identify which customers have active/pending contracts
4. Provide summary statistics
5. List all stages and contract statuses for reference

## Database Schema References

### Customers Table (relevant fields)
- `stage`: Pipeline stage (e.g., "Implementation", "Live")
- `status`: Customer status
- `name`: Customer name
- `contact_email`, `contact_name`: Contact information
- `go_live_date`: When the customer went live
- `annual_rate`: Annual contract value

### Contracts Table (relevant fields)
- `customer_id`: Links to customers table
- `status`: Contract status (we're looking for "active" or "pending")
- `name`: Contract name
- `value`: Contract value
- `start_date`, `end_date`, `renewal_date`: Contract dates

## Recommendations

1. **Immediate Action**: Use the Supabase Dashboard (Option 1) to run the queries and get the results you need. This is the safest and quickest method.

2. **For Regular Queries**: Consider creating a Supabase Edge Function or a backend API endpoint that uses the service role key to query and return this data in a controlled manner.

3. **For Reporting**: You may want to create a dedicated reporting view or materialized view in the database that aggregates this information for easy access.

4. **Security Note**: The current RLS policies are working correctly by blocking anonymous access. This is a good security practice.

## Next Steps

To get the actual customer and contract data:

1. Access the Supabase Dashboard
2. Run the SQL queries from `query-customers-contracts.sql`
3. Export or copy the results

If you need me to create a more specific query or modify the analysis, please let me know what additional information you need.

---

**Files Created:**
- `/Users/alialtoblani/Downloads/lifecycle-connector/query-customers-contracts.sql` - SQL queries to run
- `/Users/alialtoblani/Downloads/lifecycle-connector/DATABASE_QUERY_REPORT.md` - This report

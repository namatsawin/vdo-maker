# PostgreSQL Migration Guide

This document outlines the migration from SQLite to PostgreSQL for the VDO Maker application.

## Changes Made

### 1. Database Configuration
- **Before**: SQLite with `DATABASE_URL="file:./dev.db"`
- **After**: PostgreSQL with `DATABASE_URL="postgresql://vdo_maker_user:vdo_maker_password@localhost:5433/vdo_maker"`

### 2. Docker Compose Updates
- Added PostgreSQL service running on port 5433 (to avoid conflict with existing port 5432)
- Updated backend service to depend on PostgreSQL health check
- Removed SQLite database volume mounts
- Added PostgreSQL data volume

### 3. Prisma Schema Changes
- Changed datasource provider from `"sqlite"` to `"postgresql"`
- All existing models remain the same (PostgreSQL is compatible with the current schema)

### 4. Environment Variables
Updated `.env` file:
```bash
# Old
DATABASE_URL="file:./dev.db"

# New
DATABASE_URL="postgresql://vdo_maker_user:vdo_maker_password@localhost:5433/vdo_maker"
```

## Database Credentials

### Development
- **Host**: localhost:5433
- **Database**: vdo_maker
- **Username**: vdo_maker_user
- **Password**: vdo_maker_password

### Production
Use environment variables:
- `POSTGRES_PASSWORD`: Set your secure password
- `JWT_SECRET`: Set your secure JWT secret
- `GEMINI_API_KEY`: Your Gemini API key
- `GOOGLE_CLOUD_PROJECT_ID`: Your Google Cloud project ID
- `PIAPI_API_KEY`: Your PiAPI key

## Migration Steps

### 1. Stop Current Services
```bash
docker-compose down
```

### 2. Start PostgreSQL
```bash
docker-compose up -d postgres
```

### 3. Run Database Migration
```bash
cd server
npx prisma migrate dev --name init
```

### 4. Start All Services
```bash
docker-compose up -d
```

## Verification

### 1. Check Services Status
```bash
docker-compose ps
```

### 2. Test Database Connection
```bash
docker-compose exec postgres psql -U vdo_maker_user -d vdo_maker -c "\\dt"
```

### 3. Test API Endpoints
```bash
# Health check
curl http://localhost:3001/health

# Register user
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "testpass", "name": "Test User"}'

# Create project (use token from registration response)
curl -X POST http://localhost:3001/api/v1/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"title": "Test Project", "description": "Test Description"}'
```

## Database Management

### Connect to PostgreSQL
```bash
# Via Docker
docker-compose exec postgres psql -U vdo_maker_user -d vdo_maker

# Via local psql (if installed)
psql -h localhost -p 5433 -U vdo_maker_user -d vdo_maker
```

### Common Commands
```sql
-- List tables
\dt

-- Describe table structure
\d projects

-- View data
SELECT * FROM projects;
SELECT * FROM segments;

-- Check database size
SELECT pg_size_pretty(pg_database_size('vdo_maker'));
```

### Backup and Restore
```bash
# Backup
docker-compose exec postgres pg_dump -U vdo_maker_user vdo_maker > backup.sql

# Restore
docker-compose exec -T postgres psql -U vdo_maker_user vdo_maker < backup.sql
```

## Performance Considerations

### Indexing
PostgreSQL automatically creates indexes for:
- Primary keys
- Unique constraints
- Foreign keys

### Connection Pooling
Prisma uses connection pooling by default:
- Development: 21 connections
- Production: Configurable via `DATABASE_URL` parameters

### Monitoring
Monitor PostgreSQL performance:
```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity;

-- Database statistics
SELECT * FROM pg_stat_database WHERE datname = 'vdo_maker';

-- Table statistics
SELECT * FROM pg_stat_user_tables;
```

## Troubleshooting

### Common Issues

1. **Port 5433 already in use**
   - Change the port in docker-compose.yml
   - Update DATABASE_URL accordingly

2. **Connection refused**
   - Ensure PostgreSQL container is healthy: `docker-compose ps`
   - Check logs: `docker-compose logs postgres`

3. **Migration errors**
   - Reset migrations: `rm -rf prisma/migrations`
   - Create fresh migration: `npx prisma migrate dev --name init`

4. **Permission denied**
   - Check PostgreSQL user permissions
   - Verify environment variables

### Logs
```bash
# PostgreSQL logs
docker-compose logs postgres

# Backend logs
docker-compose logs backend

# All logs
docker-compose logs
```

## Benefits of PostgreSQL Migration

1. **Scalability**: Better performance with large datasets
2. **Concurrency**: Superior handling of concurrent connections
3. **Features**: Advanced SQL features and data types
4. **Reliability**: ACID compliance and data integrity
5. **Production Ready**: Industry-standard database for production applications

## Next Steps

1. **Monitoring**: Set up database monitoring and alerting
2. **Backup Strategy**: Implement automated backups
3. **Performance Tuning**: Optimize queries and indexes
4. **Security**: Implement SSL/TLS for database connections
5. **Scaling**: Consider read replicas for high-traffic scenarios

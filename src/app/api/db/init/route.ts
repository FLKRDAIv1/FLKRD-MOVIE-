import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { sql } from 'drizzle-orm'

interface TableStatus {
  name: string
  exists: boolean
  rowCount?: number
}

interface DatabaseStatus {
  connected: boolean
  tables: TableStatus[]
  error?: string
}

interface InitializationResult {
  success: boolean
  message: string
  tablesCreated: string[]
  errors: string[]
  status: DatabaseStatus
}

// Check if a table exists
const checkTableExists = async (tableName: string): Promise<boolean> => {
  try {
    const result = await db.run(
      sql`SELECT name FROM sqlite_master WHERE type='table' AND name=${tableName}`
    )
    return result.rows.length > 0
  } catch (error) {
    console.error(`Error checking table ${tableName}:`, error)
    return false
  }
}

// Get table row count
const getTableRowCount = async (tableName: string): Promise<number> => {
  try {
    const result = await db.run(sql`SELECT COUNT(*) as count FROM ${sql.identifier(tableName)}`)
    return (result.rows[0] as any)?.count || 0
  } catch (error) {
    console.error(`Error getting row count for ${tableName}:`, error)
    return 0
  }
}

// Check database connection and status
const checkDatabaseStatus = async (): Promise<DatabaseStatus> => {
  const status: DatabaseStatus = {
    connected: false,
    tables: []
  }

  try {
    // Test database connection
    await db.run(sql`SELECT 1`)
    status.connected = true

    // Check essential tables
    const tableNames = [
      'user', 'session', 'account', 'verification',
      'movie_reviews', 'review_comments', 'review_helpful',
      'user_profiles', 'movie_analytics', 'user_achievements',
      'watched_movies', 'watch_progress', 'user_stats',
      'kurdish_movies', 'user_favorites', 'streaming_watch_progress',
      'streaming_user_stats', 'tv_shows'
    ]
    
    for (const tableName of tableNames) {
      const exists = await checkTableExists(tableName)
      const tableStatus: TableStatus = {
        name: tableName,
        exists
      }
      
      if (exists) {
        tableStatus.rowCount = await getTableRowCount(tableName)
      }
      
      status.tables.push(tableStatus)
    }

  } catch (error) {
    console.error('Database status check failed:', error)
    status.error = error instanceof Error ? error.message : 'Unknown error'
  }

  return status
}

// Create tables manually based on actual schema
const createTablesManually = async (): Promise<{ tablesCreated: string[]; errors: string[] }> => {
  const tablesCreated: string[] = []
  const errors: string[] = []

  // Manual table creation SQL based on actual schema
  const createTableStatements = {
    user: `
      CREATE TABLE IF NOT EXISTS "user" (
        "id" text PRIMARY KEY,
        "name" text NOT NULL,
        "email" text NOT NULL UNIQUE,
        "email_verified" integer DEFAULT false NOT NULL,
        "image" text,
        "created_at" integer NOT NULL,
        "updated_at" integer NOT NULL
      )
    `,
    session: `
      CREATE TABLE IF NOT EXISTS "session" (
        "id" text PRIMARY KEY,
        "expires_at" integer NOT NULL,
        "token" text NOT NULL UNIQUE,
        "created_at" integer NOT NULL,
        "updated_at" integer NOT NULL,
        "ip_address" text,
        "user_agent" text,
        "user_id" text NOT NULL,
        FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE
      )
    `,
    account: `
      CREATE TABLE IF NOT EXISTS "account" (
        "id" text PRIMARY KEY,
        "account_id" text NOT NULL,
        "provider_id" text NOT NULL,
        "user_id" text NOT NULL,
        "access_token" text,
        "refresh_token" text,
        "id_token" text,
        "access_token_expires_at" integer,
        "refresh_token_expires_at" integer,
        "scope" text,
        "password" text,
        "created_at" integer NOT NULL,
        "updated_at" integer NOT NULL,
        FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE
      )
    `,
    verification: `
      CREATE TABLE IF NOT EXISTS "verification" (
        "id" text PRIMARY KEY,
        "identifier" text NOT NULL,
        "value" text NOT NULL,
        "expires_at" integer NOT NULL,
        "created_at" integer,
        "updated_at" integer
      )
    `,
    movie_reviews: `
      CREATE TABLE IF NOT EXISTS "movie_reviews" (
        "id" integer PRIMARY KEY AUTOINCREMENT,
        "user_id" text NOT NULL,
        "movie_id" integer NOT NULL,
        "movie_type" text NOT NULL,
        "title" text NOT NULL,
        "content" text NOT NULL,
        "rating" integer NOT NULL,
        "is_coming_soon" integer DEFAULT false,
        "helpful" integer DEFAULT 0,
        "spoiler_warning" integer DEFAULT false,
        "created_at" text NOT NULL,
        "updated_at" text NOT NULL,
        FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE
      )
    `,
    review_comments: `
      CREATE TABLE IF NOT EXISTS "review_comments" (
        "id" integer PRIMARY KEY AUTOINCREMENT,
        "review_id" integer NOT NULL,
        "user_id" text NOT NULL,
        "content" text NOT NULL,
        "created_at" text NOT NULL,
        "updated_at" text NOT NULL,
        FOREIGN KEY ("review_id") REFERENCES "movie_reviews"("id") ON DELETE CASCADE,
        FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE
      )
    `,
    review_helpful: `
      CREATE TABLE IF NOT EXISTS "review_helpful" (
        "id" integer PRIMARY KEY AUTOINCREMENT,
        "review_id" integer NOT NULL,
        "user_id" text NOT NULL,
        "is_helpful" integer NOT NULL,
        "created_at" text NOT NULL,
        FOREIGN KEY ("review_id") REFERENCES "movie_reviews"("id") ON DELETE CASCADE,
        FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE
      )
    `,
    user_profiles: `
      CREATE TABLE IF NOT EXISTS "user_profiles" (
        "id" integer PRIMARY KEY AUTOINCREMENT,
        "user_id" text NOT NULL UNIQUE,
        "profile_image" text,
        "bio" text,
        "favorite_movies" text,
        "movie_genre_preferences" text,
        "review_count" integer DEFAULT 0,
        "average_rating" real DEFAULT 0,
        "joined_at" text NOT NULL,
        "last_active_at" text NOT NULL,
        "created_at" text NOT NULL,
        "updated_at" text NOT NULL,
        FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE
      )
    `,
    movie_analytics: `
      CREATE TABLE IF NOT EXISTS "movie_analytics" (
        "id" integer PRIMARY KEY AUTOINCREMENT,
        "movie_id" integer NOT NULL,
        "movie_type" text NOT NULL,
        "total_views" integer DEFAULT 0,
        "total_reviews" integer DEFAULT 0,
        "average_rating" real DEFAULT 0,
        "total_favorites" integer DEFAULT 0,
        "total_watch_time" integer DEFAULT 0,
        "popularity_score" real DEFAULT 0,
        "trending_score" real DEFAULT 0,
        "created_at" text NOT NULL,
        "updated_at" text NOT NULL
      )
    `,
    user_achievements: `
      CREATE TABLE IF NOT EXISTS "user_achievements" (
        "id" integer PRIMARY KEY AUTOINCREMENT,
        "user_id" text NOT NULL,
        "achievement_type" text NOT NULL,
        "achievement_name" text NOT NULL,
        "description" text,
        "completed_at" text NOT NULL,
        "progress" integer DEFAULT 0,
        "target" integer NOT NULL,
        "created_at" text NOT NULL,
        FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE
      )
    `,
    watched_movies: `
      CREATE TABLE IF NOT EXISTS "watched_movies" (
        "id" integer PRIMARY KEY AUTOINCREMENT,
        "user_id" text NOT NULL,
        "movie_id" integer NOT NULL,
        "movie_title" text NOT NULL,
        "movie_poster" text,
        "watched_at" text NOT NULL,
        "rating" integer,
        FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE
      )
    `,
    watch_progress: `
      CREATE TABLE IF NOT EXISTS "watch_progress" (
        "id" integer PRIMARY KEY AUTOINCREMENT,
        "user_id" text NOT NULL,
        "movie_id" integer NOT NULL,
        "current_time" integer NOT NULL,
        "total_duration" integer NOT NULL,
        "progress_percentage" real NOT NULL,
        "last_watched_at" text NOT NULL,
        "completed" integer DEFAULT false,
        FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE
      )
    `,
    user_stats: `
      CREATE TABLE IF NOT EXISTS "user_stats" (
        "id" integer PRIMARY KEY AUTOINCREMENT,
        "user_id" text NOT NULL UNIQUE,
        "total_movies_watched" integer DEFAULT 0,
        "total_watch_time" integer DEFAULT 0,
        "favorite_genre" text,
        "created_at" text NOT NULL,
        "updated_at" text NOT NULL,
        FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE
      )
    `,
    kurdish_movies: `
      CREATE TABLE IF NOT EXISTS "kurdish_movies" (
        "id" integer PRIMARY KEY AUTOINCREMENT,
        "tmdb_id" integer,
        "title" text NOT NULL,
        "title_kurdish" text,
        "overview" text,
        "overview_kurdish" text,
        "poster_path" text,
        "backdrop_path" text,
        "release_date" text,
        "vote_average" real,
        "genre_ids" text,
        "has_kurdish_dub" integer DEFAULT false,
        "has_kurdish_subtitle" integer DEFAULT false,
        "kurdish_dub_quality" text,
        "kurdish_subtitle_quality" text,
        "streaming_url" text,
        "is_kurdish_production" integer DEFAULT false,
        "created_at" text NOT NULL,
        "updated_at" text NOT NULL
      )
    `,
    user_favorites: `
      CREATE TABLE IF NOT EXISTS "user_favorites" (
        "id" integer PRIMARY KEY AUTOINCREMENT,
        "user_id" text NOT NULL,
        "movie_id" integer NOT NULL,
        "movie_type" text NOT NULL,
        "created_at" text NOT NULL,
        FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE
      )
    `
  }

  for (const [tableName, createStatement] of Object.entries(createTableStatements)) {
    try {
      console.log(`Creating table: ${tableName}`)
      await db.run(sql.raw(createStatement))
      tablesCreated.push(tableName)
      console.log(`✅ Table ${tableName} created successfully`)
    } catch (error) {
      const errorMsg = `Failed to create table ${tableName}: ${error instanceof Error ? error.message : 'Unknown error'}`
      console.error(`❌ ${errorMsg}`)
      errors.push(errorMsg)
    }
  }

  return { tablesCreated, errors }
}

// Create indexes for better performance
const createIndexes = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('Creating database indexes...')
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_movie_reviews_movie_id ON movie_reviews(movie_id)',
      'CREATE INDEX IF NOT EXISTS idx_movie_reviews_user_id ON movie_reviews(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_movie_reviews_movie_type ON movie_reviews(movie_type)',
      'CREATE INDEX IF NOT EXISTS idx_movie_reviews_created_at ON movie_reviews(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_review_comments_review_id ON review_comments(review_id)',
      'CREATE INDEX IF NOT EXISTS idx_review_helpful_review_id ON review_helpful(review_id)',
      'CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_watched_movies_user_id ON watched_movies(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_session_user_id ON session(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_session_token ON session(token)'
    ]

    for (const indexSQL of indexes) {
      try {
        await db.run(sql.raw(indexSQL))
      } catch (error) {
        console.warn(`Index creation warning:`, error)
      }
    }

    console.log('✅ Database indexes created')
    return { success: true }
  } catch (error) {
    console.error('Index creation failed:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Index creation failed' 
    }
  }
}

// GET - Check database status
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking database status...')
    
    const status = await checkDatabaseStatus()
    
    return NextResponse.json({
      success: true,
      status,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Database status check failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// POST - Initialize database (no auth required for setup)
export async function POST(request: NextRequest) {
  const initResult: InitializationResult = {
    success: false,
    message: '',
    tablesCreated: [],
    errors: [],
    status: {
      connected: false,
      tables: []
    }
  }

  try {
    console.log('🚀 Starting database initialization...')

    // Check initial database status
    const initialStatus = await checkDatabaseStatus()
    initResult.status = initialStatus

    if (!initialStatus.connected) {
      initResult.errors.push('Failed to connect to database')
      initResult.message = 'Database connection failed'
      
      return NextResponse.json(initResult, { status: 500 })
    }

    console.log('✅ Database connection verified')

    // Check if all tables already exist
    const missingTables = initialStatus.tables.filter(table => !table.exists)
    if (missingTables.length === 0) {
      initResult.success = true
      initResult.message = 'Database is already fully initialized with all required tables'
      console.log('ℹ️ Database already initialized')
      
      return NextResponse.json(initResult)
    }

    console.log(`📝 Found ${missingTables.length} missing tables:`, missingTables.map(t => t.name))

    // Create missing tables
    const { tablesCreated, errors } = await createTablesManually()
    initResult.tablesCreated = tablesCreated
    initResult.errors.push(...errors)

    // Create indexes for performance
    const indexResult = await createIndexes()
    if (!indexResult.success && indexResult.error) {
      initResult.errors.push(`Index creation warning: ${indexResult.error}`)
    }

    // Get final status
    const finalStatus = await checkDatabaseStatus()
    initResult.status = finalStatus

    // Determine overall success
    const allTablesExist = finalStatus.tables.every(table => table.exists)
    initResult.success = allTablesExist && finalStatus.connected

    if (initResult.success) {
      initResult.message = `Database initialized successfully! Created ${tablesCreated.length} tables. You can now add reviews and use all features.`
      console.log('🎉 Database initialization completed successfully')
    } else {
      initResult.message = `Database initialization completed with ${initResult.errors.length} errors.`
      console.log('⚠️ Database initialization completed with warnings')
    }

    return NextResponse.json(initResult, {
      status: initResult.success ? 200 : 207 // 207 = Multi-Status (partial success)
    })

  } catch (error) {
    console.error('💥 Database initialization failed:', error)
    
    initResult.errors.push(error instanceof Error ? error.message : 'Unknown initialization error')
    initResult.message = 'Database initialization failed'
    
    return NextResponse.json(initResult, { status: 500 })
  }
}
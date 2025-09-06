import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

// Reviews table
export const reviews = sqliteTable("reviews", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => user.id),
  movieId: text("movie_id").notNull(),
  rating: integer("rating").notNull(),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

// Auth tables for better-auth
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

// Movie tracking tables
export const watchedMovies = sqliteTable('watched_movies', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  movieId: integer('movie_id').notNull(),
  movieTitle: text('movie_title').notNull(),
  moviePoster: text('movie_poster'),
  watchedAt: text('watched_at').notNull(),
  rating: integer('rating'), // 1-10, nullable
});

export const watchProgress = sqliteTable('watch_progress', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  movieId: integer('movie_id').notNull(),
  currentTime: integer('current_time').notNull(), // seconds
  totalDuration: integer('total_duration').notNull(), // seconds
  progressPercentage: real('progress_percentage').notNull(), // 0-100
  lastWatchedAt: text('last_watched_at').notNull(),
  completed: integer('completed', { mode: 'boolean' }).default(false),
});

export const userStats = sqliteTable('user_stats', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().unique().references(() => user.id, { onDelete: 'cascade' }),
  totalMoviesWatched: integer('total_movies_watched').default(0),
  totalWatchTime: integer('total_watch_time').default(0), // seconds
  favoriteGenre: text('favorite_genre'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Kurdish Movies table for streaming platform
export const kurdishMovies = sqliteTable('kurdish_movies', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tmdbId: integer('tmdb_id'),
  title: text('title').notNull(),
  titleKurdish: text('title_kurdish'),
  overview: text('overview'),
  overviewKurdish: text('overview_kurdish'),
  posterPath: text('poster_path'),
  backdropPath: text('backdrop_path'),
  releaseDate: text('release_date'),
  voteAverage: real('vote_average'),
  genreIds: text('genre_ids', { mode: 'json' }),
  hasKurdishDub: integer('has_kurdish_dub', { mode: 'boolean' }).default(false),
  hasKurdishSubtitle: integer('has_kurdish_subtitle', { mode: 'boolean' }).default(false),
  kurdishDubQuality: text('kurdish_dub_quality'),
  kurdishSubtitleQuality: text('kurdish_subtitle_quality'),
  streamingUrl: text('streaming_url'),
  isKurdishProduction: integer('is_kurdish_production', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// User Favorites table
export const userFavorites = sqliteTable('user_favorites', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  movieId: integer('movie_id').notNull(),
  movieType: text('movie_type').notNull(), // 'kurdish' or 'tmdb'
  createdAt: text('created_at').notNull(),
});

// Enhanced Watch Progress table for streaming
export const streamingWatchProgress = sqliteTable('streaming_watch_progress', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  movieId: integer('movie_id').notNull(),
  movieType: text('movie_type').notNull(), // 'kurdish' or 'tmdb'
  progressSeconds: integer('progress_seconds').notNull().default(0),
  totalDurationSeconds: integer('total_duration_seconds').notNull(),
  progressPercentage: real('progress_percentage').notNull().default(0),
  lastWatchedAt: text('last_watched_at').notNull(),
  isCompleted: integer('is_completed', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Enhanced User Statistics table
export const streamingUserStats = sqliteTable('streaming_user_stats', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().unique().references(() => user.id, { onDelete: 'cascade' }),
  totalMoviesWatched: integer('total_movies_watched').default(0),
  totalWatchTimeMinutes: integer('total_watch_time_minutes').default(0),
  favoriteGenre: text('favorite_genre'),
  kurdishMoviesWatched: integer('kurdish_movies_watched').default(0),
  internationalMoviesWatched: integer('international_movies_watched').default(0),
  streakDays: integer('streak_days').default(0),
  lastActivityDate: text('last_activity_date'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// TV Shows/Drama table
export const tvShows = sqliteTable('tv_shows', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tmdbId: integer('tmdb_id'),
  name: text('name').notNull(),
  nameKurdish: text('name_kurdish'),
  overview: text('overview'),
  overviewKurdish: text('overview_kurdish'),
  posterPath: text('poster_path'),
  backdropPath: text('backdrop_path'),
  firstAirDate: text('first_air_date'),
  voteAverage: real('vote_average'),
  genreIds: text('genre_ids', { mode: 'json' }),
  streamingService: text('streaming_service'), // 'netflix', 'disney', 'prime', 'other'
  hasKurdishDub: integer('has_kurdish_dub', { mode: 'boolean' }).default(false),
  hasKurdishSubtitle: integer('has_kurdish_subtitle', { mode: 'boolean' }).default(false),
  totalSeasons: integer('total_seasons'),
  totalEpisodes: integer('total_episodes'),
  status: text('status').notNull().default('ongoing'), // 'ongoing', 'completed', 'cancelled'
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Add corrected movie_reviews table
export const movieReviews = sqliteTable('movie_reviews', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  movieId: integer('movie_id').notNull(),
  movieType: text('movie_type').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  rating: integer('rating').notNull(),
  isComingSoon: integer('is_coming_soon', { mode: 'boolean' }).notNull().default(false),
  helpful: integer('helpful').notNull().default(0),
  spoilerWarning: integer('spoiler_warning', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const reviewComments = sqliteTable('review_comments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reviewId: integer('review_id').notNull().references(() => movieReviews.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const reviewHelpful = sqliteTable('review_helpful', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reviewId: integer('review_id').notNull().references(() => movieReviews.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  isHelpful: integer('is_helpful', { mode: 'boolean' }).notNull(),
  createdAt: text('created_at').notNull(),
});

export const userProfiles = sqliteTable('user_profiles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().unique().references(() => user.id, { onDelete: 'cascade' }),
  profileImage: text('profile_image'),
  bio: text('bio'),
  favoriteMovies: text('favorite_movies', { mode: 'json' }),
  movieGenrePreferences: text('movie_genre_preferences', { mode: 'json' }),
  reviewCount: integer('review_count').default(0),
  averageRating: real('average_rating').default(0),
  joinedAt: text('joined_at').notNull(),
  lastActiveAt: text('last_active_at').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const movieAnalytics = sqliteTable('movie_analytics', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  movieId: integer('movie_id').notNull(),
  movieType: text('movie_type').notNull(), // 'tmdb' or 'kurdish'
  totalViews: integer('total_views').default(0),
  totalReviews: integer('total_reviews').default(0),
  averageRating: real('average_rating').default(0),
  totalFavorites: integer('total_favorites').default(0),
  totalWatchTime: integer('total_watch_time').default(0), // in minutes
  popularityScore: real('popularity_score').default(0),
  trendingScore: real('trending_score').default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// User Achievements table
export const userAchievements = sqliteTable('user_achievements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  achievementType: text('achievement_type').notNull(),
  achievementName: text('achievement_name').notNull(),
  description: text('description'),
  completedAt: text('completed_at').notNull(),
  progress: integer('progress').default(0),
  target: integer('target').notNull(),
  createdAt: text('created_at').notNull(),
});
CREATE TABLE `kurdish_movies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tmdb_id` integer,
	`title` text NOT NULL,
	`title_kurdish` text,
	`overview` text,
	`overview_kurdish` text,
	`poster_path` text,
	`backdrop_path` text,
	`release_date` text,
	`vote_average` real,
	`genre_ids` text,
	`has_kurdish_dub` integer DEFAULT false,
	`has_kurdish_subtitle` integer DEFAULT false,
	`kurdish_dub_quality` text,
	`kurdish_subtitle_quality` text,
	`streaming_url` text,
	`is_kurdish_production` integer DEFAULT false,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `streaming_user_stats` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`total_movies_watched` integer DEFAULT 0,
	`total_watch_time_minutes` integer DEFAULT 0,
	`favorite_genre` text,
	`kurdish_movies_watched` integer DEFAULT 0,
	`international_movies_watched` integer DEFAULT 0,
	`streak_days` integer DEFAULT 0,
	`last_activity_date` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `streaming_user_stats_user_id_unique` ON `streaming_user_stats` (`user_id`);--> statement-breakpoint
CREATE TABLE `streaming_watch_progress` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`movie_id` integer NOT NULL,
	`movie_type` text NOT NULL,
	`progress_seconds` integer DEFAULT 0 NOT NULL,
	`total_duration_seconds` integer NOT NULL,
	`progress_percentage` real DEFAULT 0 NOT NULL,
	`last_watched_at` text NOT NULL,
	`is_completed` integer DEFAULT false,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tv_shows` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tmdb_id` integer,
	`name` text NOT NULL,
	`name_kurdish` text,
	`overview` text,
	`overview_kurdish` text,
	`poster_path` text,
	`backdrop_path` text,
	`first_air_date` text,
	`vote_average` real,
	`genre_ids` text,
	`streaming_service` text,
	`has_kurdish_dub` integer DEFAULT false,
	`has_kurdish_subtitle` integer DEFAULT false,
	`total_seasons` integer,
	`total_episodes` integer,
	`status` text DEFAULT 'ongoing' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_favorites` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`movie_id` integer NOT NULL,
	`movie_type` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);

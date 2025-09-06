CREATE TABLE `user_achievements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`achievement_type` text NOT NULL,
	`achievement_name` text NOT NULL,
	`achievement_description` text NOT NULL,
	`progress` integer DEFAULT 0,
	`target` integer NOT NULL,
	`is_completed` integer DEFAULT false,
	`completed_at` text,
	`icon_url` text,
	`points` integer DEFAULT 0,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);

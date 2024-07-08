CREATE TABLE `reminders` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`aisle` text,
	`image` text,
	`error` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
